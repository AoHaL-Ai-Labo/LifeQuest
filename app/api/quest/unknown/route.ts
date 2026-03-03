import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserData } from '@/app/actions/userActions'
import { getCompletedQuestIds } from '@/lib/quest-completion'
import { getTendencyForPrompt } from '@/lib/user-tendency'
import type { PrimaryStat, QuestStats } from '@/lib/quest-types'

const PRIMARY_STAT_VALUES = ['str', 'dex', 'end', 'int', 'fai', 'arc'] as const

const unknownQuestSchema = z.object({
  beginner: z.object({
    title: z.string(),
    description: z.string(),
    flavorText: z.string(),
    primaryStat: z.enum(PRIMARY_STAT_VALUES),
  }),
  intermediate: z.object({
    title: z.string(),
    description: z.string(),
    flavorText: z.string(),
    primaryStat: z.enum(PRIMARY_STAT_VALUES),
  }),
  advanced: z.object({
    title: z.string(),
    description: z.string(),
    flavorText: z.string(),
    primaryStat: z.enum(PRIMARY_STAT_VALUES),
  }),
})

/** primaryStat と難易度から stats を生成（初級+1, 中級+3, 上級+5） */
function statsFromTier(primaryStat: PrimaryStat, tier: 'beginner' | 'intermediate' | 'advanced'): QuestStats {
  const value = tier === 'beginner' ? 1 : tier === 'intermediate' ? 3 : 5
  return {
    str: primaryStat === 'str' ? value : 0,
    dex: primaryStat === 'dex' ? value : 0,
    end: primaryStat === 'end' ? value : 0,
    int: primaryStat === 'int' ? value : 0,
    fai: primaryStat === 'fai' ? value : 0,
    arc: primaryStat === 'arc' ? value : 0,
  }
}

function getTodayJST(): string {
  const str = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })
  return str
}

/**
 * GET /api/quest/unknown
 * 未知の試練（AI生成クエスト）を取得。1日1回キャッシュ、なければ生成
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'APIキーが設定されていません。GEMINI_API_KEY を .env.local に設定してください。' },
      { status: 500 }
    )
  }

  try {
    const today = getTodayJST()
    const cached = await prisma.unknownQuestDaily.findUnique({
      where: { date: today },
    })

    if (cached) {
      const quests = await prisma.quest.findMany({
        where: { id: { in: [cached.questId1, cached.questId2, cached.questId3] } },
      })
      const byId = Object.fromEntries(quests.map((q) => [q.id, q]))
      const ordered = [cached.questId1, cached.questId2, cached.questId3]
        .map((id) => byId[id])
        .filter(Boolean)
      const questIds = ordered.map((q) => q.id)
      const completedIds = await getCompletedQuestIds(questIds)
      const result = ordered.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description ?? '',
        flavorText: (() => {
          try {
            const arr = JSON.parse(q.flavorTexts) as string[]
            return (Array.isArray(arr) && arr[0]) || ''
          } catch {
            return ''
          }
        })(),
        difficulty: q.difficulty,
        stats: (() => {
          try {
            return JSON.parse(q.statsExp) as QuestStats
          } catch {
            return { str: 0, dex: 0, end: 0, int: 0, fai: 0, arc: 0 }
          }
        })(),
        primaryStat: q.primaryStat,
        isCompleted: completedIds.has(q.id),
      }))
      return NextResponse.json({ quests: result })
    }

    const userData = await getUserData()
    const tendency = getTendencyForPrompt(userData.stats)

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: unknownQuestSchema,
      system: `あなたはユーザーの「コンフォートゾーン」を揺さぶる試練の導き手です。
現在のプレイヤーは【${tendency}】の灰です。この特性に関連した、または弱点を補うようなクエストを生成してください。

## 【絶対遵守ルール】
1. **時間指定の完全禁止**: 「〇分間」「〇時間」「〇秒」は一切使用しない。
2. **初級（beginner）**: 必ず「1アクション」のみで完結。例：本を開く、1回スクワットする。
3. **中級（intermediate）**: 「キリの良いところまで」等の表現。時間指定は禁止。
4. **上級（advanced）**: 「限界まで」等の表現。時間指定は禁止。
5. **フレーバーテキスト**: ダークソウル風の詩的・重厚な文言を使用する。`,
      prompt: `【${tendency}】の灰に最適化した「未知の試練」を、初級・中級・上級で1つずつ、合計3つ生成してください。
各クエストは title, description, flavorText, primaryStat を必ず含めてください。primaryStat は str/dex/end/int/fai/arc のいずれか1つ。`,
    })

    const data = result.object
    const tiers: ('beginner' | 'intermediate' | 'advanced')[] = ['beginner', 'intermediate', 'advanced']
    const questIds: string[] = []

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i]
      const q = data[tier]
      const id = `ai-${Date.now()}-${i}`
      questIds.push(id)
      const stats = statsFromTier(q.primaryStat as PrimaryStat, tier)
      await prisma.quest.create({
        data: {
          id,
          title: q.title,
          description: q.description,
          period: 'daily',
          difficulty: tier,
          primaryStat: q.primaryStat,
          statsExp: JSON.stringify(stats),
          flavorTexts: JSON.stringify([q.flavorText]),
        },
      })
    }

    await prisma.unknownQuestDaily.create({
      data: {
        date: today,
        questId1: questIds[0],
        questId2: questIds[1],
        questId3: questIds[2],
      },
    })

    const quests = await prisma.quest.findMany({
      where: { id: { in: questIds } },
    })
    const byId = Object.fromEntries(quests.map((q) => [q.id, q]))
    const ordered = questIds.map((id) => byId[id]).filter(Boolean)
    const completedIds = await getCompletedQuestIds(questIds)
    const out = ordered.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description ?? '',
      flavorText: (() => {
        try {
          const arr = JSON.parse(q.flavorTexts) as string[]
          return (Array.isArray(arr) && arr[0]) || ''
        } catch {
          return ''
        }
      })(),
      difficulty: q.difficulty,
      stats: (() => {
        try {
          return JSON.parse(q.statsExp) as QuestStats
        } catch {
          return { str: 0, dex: 0, end: 0, int: 0, fai: 0, arc: 0 }
        }
      })(),
      primaryStat: q.primaryStat,
      isCompleted: completedIds.has(q.id),
    }))

    return NextResponse.json({ quests: out })
  } catch (err) {
    console.error('Unknown quest generation error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: '未知の試練の生成に失敗しました', detail: message },
      { status: 500 }
    )
  }
}
