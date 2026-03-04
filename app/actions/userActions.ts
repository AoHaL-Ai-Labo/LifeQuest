'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  parseQuestStatsExp,
  getExpFromQuest,
  applyQuestCompletion,
} from '@/lib/save-data-utils'
import type { PrimaryStat, QuestStats } from '@/lib/quest-types'

/** シングルユーザー想定の固定ID */
const DEFAULT_USER_ID = 'default'

const DEFAULT_STATS: QuestStats = { str: 10, dex: 10, end: 10, int: 10, fai: 10, arc: 10 }
const DEFAULT_HIDDEN_EXP = '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":0}'
const STAT_KEYS = ['str', 'dex', 'end', 'int', 'fai', 'arc'] as const

export interface UserData {
  id: string
  level: number
  currentExp: number
  stats: QuestStats
  hiddenExp: QuestStats
  prefix: string
  prestigeCount: number
}

/**
 * ユーザーデータを取得。存在しない場合は初期値で作成して返す
 * シングルユーザー想定のため、最初の1件を取得または固定IDで新規作成
 */
/** SaveData の Int 列から QuestStats を構築 */
function buildStatsFromRow(row: { str: number; dex: number; end: number; int: number; fai: number; arc: number }): QuestStats {
  return {
    str: row.str,
    dex: row.dex,
    end: row.end,
    int: row.int,
    fai: row.fai,
    arc: row.arc,
  }
}

export async function getUserData(): Promise<UserData> {
  let save = await prisma.saveData.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, level: true, currentExp: true, str: true, dex: true, end: true, int: true, fai: true, arc: true, hiddenStr: true, hiddenDex: true, hiddenEnd: true, hiddenInt: true, hiddenFai: true, hiddenArc: true, prefix: true, prestigeCount: true },
  })

  if (!save) {
    const created = await prisma.saveData.create({
      data: {
        id: DEFAULT_USER_ID,
        level: 1,
        currentExp: 0,
        stats: JSON.stringify(DEFAULT_STATS),
        hiddenExp: DEFAULT_HIDDEN_EXP,
        prefix: '',
        prestigeCount: 0,
      },
    })
    save = created
  }

  const stats = 'str' in save ? buildStatsFromRow(save) : { str: 10, dex: 10, end: 10, int: 10, fai: 10, arc: 10 }
  const hiddenExp = 'hiddenStr' in save
    ? { str: save.hiddenStr, dex: save.hiddenDex, end: save.hiddenEnd, int: save.hiddenInt, fai: save.hiddenFai, arc: save.hiddenArc }
    : { str: 0, dex: 0, end: 0, int: 0, fai: 0, arc: 0 }

  return {
    id: save.id,
    level: save.level,
    currentExp: save.currentExp,
    stats,
    hiddenExp,
    prefix: save.prefix ?? '',
    prestigeCount: save.prestigeCount ?? 0,
  }
}

export interface CompleteQuestResult {
  success: boolean
  error?: string
  userData?: UserData
  leveledUp?: boolean
}

/**
 * クエスト達成処理
 * QuestHistory に記録し、SaveData を Prisma increment で更新
 */
export async function completeQuest(questId: string): Promise<CompleteQuestResult> {
  try {
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
      select: { id: true, statsExp: true, primaryStat: true, period: true, difficulty: true },
    })

    if (!quest) {
      return { success: false, error: `クエストが見つかりません: ${questId}` }
    }

    const questStatsGain = parseQuestStatsExp(quest.statsExp)
    const primaryStat = quest.primaryStat as PrimaryStat
    const period = quest.period as 'daily' | 'weekly' | 'monthly'

    const result = await prisma.$transaction(async (tx) => {
      let save = await tx.saveData.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, level: true, currentExp: true, str: true, dex: true, end: true, int: true, fai: true, arc: true, hiddenStr: true, hiddenDex: true, hiddenEnd: true, hiddenInt: true, hiddenFai: true, hiddenArc: true, prefix: true, prestigeCount: true },
      })

      if (!save) {
        save = await tx.saveData.create({
          data: {
            id: DEFAULT_USER_ID,
            level: 1,
            currentExp: 0,
            stats: JSON.stringify(DEFAULT_STATS),
            hiddenExp: DEFAULT_HIDDEN_EXP,
            prefix: '',
            prestigeCount: 0,
          },
        })
      }

      const currentStats = buildStatsFromRow(save)
      const currentHiddenExp: QuestStats = {
        str: save.hiddenStr,
        dex: save.hiddenDex,
        end: save.hiddenEnd,
        int: save.hiddenInt,
        fai: save.hiddenFai,
        arc: save.hiddenArc,
      }

      const expGain = getExpFromQuest(save.level, period, quest.difficulty)
      const computed = applyQuestCompletion(
        save.level,
        save.currentExp,
        currentStats,
        currentHiddenExp,
        questStatsGain,
        primaryStat,
        period,
        expGain
      )

      const statDeltas = STAT_KEYS.map((k) => ({ key: k, delta: computed.stats[k] - currentStats[k] }))
      const hiddenDeltas = STAT_KEYS.map((k) => ({ key: k, delta: computed.hiddenExp[k] - currentHiddenExp[k] }))

      console.log(
        '[completeQuest] EXP加算:',
        statDeltas.filter((d) => d.delta !== 0).map((d) => `${d.key}+${d.delta}`).join(', ') || 'なし',
        '| hiddenExp:',
        hiddenDeltas.filter((d) => d.delta !== 0).map((d) => `${d.key}+${d.delta}`).join(', ') || 'なし'
      )

      await tx.questHistory.create({ data: { questId } })

      const updateData: Record<string, number | { increment: number }> = {
        level: computed.level,
        currentExp: computed.currentExp,
      }
      for (const k of STAT_KEYS) {
        const delta = computed.stats[k] - currentStats[k]
        if (delta !== 0) {
          updateData[k] = { increment: delta }
        }
      }
      for (const k of STAT_KEYS) {
        const key = `hidden${k.charAt(0).toUpperCase()}${k.slice(1)}` as 'hiddenStr' | 'hiddenDex' | 'hiddenEnd' | 'hiddenInt' | 'hiddenFai' | 'hiddenArc'
        const delta = computed.hiddenExp[k] - currentHiddenExp[k]
        if (delta !== 0) {
          updateData[key] = { increment: delta }
        }
      }

      await tx.saveData.update({
        where: { id: save.id },
        data: updateData,
      })

      return {
        save: { ...save, prefix: save.prefix ?? '', prestigeCount: save.prestigeCount ?? 0 },
        computed,
      }
    })

    revalidatePath('/')
    revalidatePath('/quest')
    revalidatePath('/history')

    const userData: UserData = {
      id: result.save.id,
      level: result.computed.level,
      currentExp: result.computed.currentExp,
      stats: result.computed.stats,
      hiddenExp: result.computed.hiddenExp,
      prefix: result.save.prefix,
      prestigeCount: result.save.prestigeCount,
    }

    return {
      success: true,
      userData,
      leveledUp: result.computed.leveledUp,
    }
  } catch (err) {
    console.error('completeQuest error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
