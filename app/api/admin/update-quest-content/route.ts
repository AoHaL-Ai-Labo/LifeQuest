/**
 * 管理者用: カタログクエスト（非AIクエスト）のdescriptionとflavorTextsをAIで生成・更新する
 * GET /api/admin/update-quest-content
 * - descriptionがnullまたは空、もしくはflavorTextsが'[]'のクエストを対象に生成・更新する
 * - QuestHistoryは削除しない（安全な部分更新）
 */

import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const questContentSchema = z.object({
  description: z.string(),
  flavorText: z.string(),
})

const STAT_LABEL: Record<string, string> = {
  str: '筋力（STR）',
  dex: '技量（DEX）',
  end: '持久（END）',
  int: '理力（INT）',
  fai: '信仰（FAI）',
  arc: '神秘（ARC）',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
}

const PERIOD_LABEL: Record<string, string> = {
  daily: 'デイリー（毎日）',
  weekly: 'ウィークリー（毎週）',
  monthly: 'マンスリー（毎月）',
}

async function generateQuestContent(
  title: string,
  existingDescription: string | null,
  primaryStat: string,
  difficulty: string,
  period: string
): Promise<{ description: string; flavorText: string }> {
  const statLabel = STAT_LABEL[primaryStat] ?? primaryStat
  const diffLabel = DIFFICULTY_LABEL[difficulty] ?? difficulty
  const periodLabel = PERIOD_LABEL[period] ?? period

  const descriptionInstruction = existingDescription
    ? `既存のdescriptionは「${existingDescription}」です。これを参考にしつつ、より洗練させるか、そのまま使用してください。`
    : 'descriptionは具体的な行動指示を書いてください。ダーク要素は入れないこと。'

  const result = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: questContentSchema,
    system: `あなたはゲーム「灰（Ash）」のクエスト設計者です。
ダークソウルシリーズのような世界観を持つ、自己成長ゲームのクエストを設計します。

## クエスト情報
- タイトル: ${title}
- 主属性: ${statLabel}
- 難易度: ${diffLabel}
- 期間: ${periodLabel}

## 出力形式
### description（行動指示）
- 具体的で明確な行動指示を1〜2文で書く
- ダーク・ファンタジー要素は入れない（plain text）
- 「○分間」等の時間指定は禁止
- ${diffLabel}に合った難易度感にすること
${descriptionInstruction}

### flavorText（フレーバーテキスト）
- ダークソウル風の詩的・哲学的なテキスト（1〜2文）
- 「灰よ」「汝」等の古めかしい二人称を使う
- クエストのテーマや精神を暗示する
- 例: 「固まった血は、思考を濁らせる。立ち上がり、身体を揺さぶれ。」`,
    prompt: `クエスト「${title}」（${statLabel} / ${diffLabel} / ${periodLabel}）のdescriptionとflavorTextを生成してください。`,
  })

  return {
    description: result.object.description,
    flavorText: result.object.flavorText,
  }
}

export async function GET() {
  try {
    const allQuests = await prisma.quest.findMany()
    const targetQuests = allQuests.filter(
      (q) =>
        !q.id.startsWith('ai-') &&
        (!q.description || q.description.trim() === '' || q.flavorTexts === '[]' || q.flavorTexts === '')
    )

    if (targetQuests.length === 0) {
      return new Response(
        JSON.stringify({ message: '更新対象のクエストはありません。', updated: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const results: Array<{ id: string; title: string; status: string }> = []

    for (const quest of targetQuests) {
      try {
        const generated = await generateQuestContent(
          quest.title,
          quest.description,
          quest.primaryStat,
          quest.difficulty,
          quest.period
        )

        const newDescription =
          !quest.description || quest.description.trim() === ''
            ? generated.description
            : quest.description

        const newFlavorTexts =
          quest.flavorTexts === '[]' || quest.flavorTexts === ''
            ? JSON.stringify([generated.flavorText])
            : quest.flavorTexts

        await prisma.quest.update({
          where: { id: quest.id },
          data: {
            description: newDescription,
            flavorTexts: newFlavorTexts,
          },
        })

        results.push({ id: quest.id, title: quest.title, status: 'updated' })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        results.push({ id: quest.id, title: quest.title, status: `error: ${message}` })
      }
    }

    return new Response(
      JSON.stringify({ updated: results.filter((r) => r.status === 'updated').length, results }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: 'クエスト更新に失敗しました', detail: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
