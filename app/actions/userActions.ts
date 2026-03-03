'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  parseStatsJson,
  parseHiddenExpJson,
  getExpFromQuest,
  applyQuestCompletion,
} from '@/lib/save-data-utils'
import type { PrimaryStat, QuestStats } from '@/lib/quest-types'

/** シングルユーザー想定の固定ID */
const DEFAULT_USER_ID = 'default'

const DEFAULT_STATS: QuestStats = { str: 10, dex: 10, end: 10, int: 10, fai: 10, arc: 10 }
const DEFAULT_HIDDEN_EXP = '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":0}'

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
export async function getUserData(): Promise<UserData> {
  let save = await prisma.saveData.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (!save) {
    save = await prisma.saveData.create({
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

  return {
    id: save.id,
    level: save.level,
    currentExp: save.currentExp,
    stats: parseStatsJson(save.stats),
    hiddenExp: parseHiddenExpJson(save.hiddenExp),
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
 * QuestHistory に記録し、SaveData を更新するトランザクション
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

    const questStatsGain = parseStatsJson(quest.statsExp)
    const primaryStat = quest.primaryStat as PrimaryStat
    const period = quest.period as 'daily' | 'weekly' | 'monthly'

    let save = await prisma.saveData.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!save) {
      save = await prisma.saveData.create({
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

    const expGain = getExpFromQuest(save.level, period, quest.difficulty)
    const result = applyQuestCompletion(
      save.level,
      save.currentExp,
      parseStatsJson(save.stats),
      parseHiddenExpJson(save.hiddenExp),
      questStatsGain,
      primaryStat,
      period,
      expGain
    )

    await prisma.$transaction([
      prisma.questHistory.create({
        data: { questId },
      }),
      prisma.saveData.update({
        where: { id: save.id },
        data: {
          level: result.level,
          currentExp: result.currentExp,
          stats: JSON.stringify(result.stats),
          hiddenExp: JSON.stringify(result.hiddenExp),
        },
      }),
    ])

    revalidatePath('/')
    revalidatePath('/quest')
    revalidatePath('/history')

    const userData: UserData = {
      id: save.id,
      level: result.level,
      currentExp: result.currentExp,
      stats: result.stats,
      hiddenExp: result.hiddenExp,
      prefix: save.prefix ?? '',
      prestigeCount: save.prestigeCount ?? 0,
    }

    return {
      success: true,
      userData,
      leveledUp: result.leveledUp,
    }
  } catch (err) {
    console.error('completeQuest error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
