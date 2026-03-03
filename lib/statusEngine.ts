/**
 * ステータス計算エンジン
 * クエストクリア履歴からユーザーの総ステータスと「尖り」属性を算出。
 * 努力値（hiddenExp）の蓄積とレベルアップ時の特化ステータス+1判定を担当。
 * ダークソウル風6属性: str, dex, end, int, fai, arc
 */

import { getQuestStatsByTitle } from './quest-catalog'
import type { QuestStats, PrimaryStat } from './quest-types'

export type StatKey = 'str' | 'dex' | 'end' | 'int' | 'fai' | 'arc'

/** 6属性のオブジェクト型（stats / hiddenExp 共通） */
export type StatBlock = QuestStats

/** 総ステータスと最も尖った属性 */
export interface CalculatedUserStats {
  /** 6属性の合計値 */
  total: QuestStats
  /** 最も数値が高いステータス属性。同点なら1つ。全て0なら null */
  dominantStat: StatKey | null
}

const STAT_KEYS: StatKey[] = ['str', 'dex', 'end', 'int', 'fai', 'arc']

/** 同点時の優先順位: str > dex > end > int > fai > arc */
const STAT_PRIORITY: StatKey[] = ['str', 'dex', 'end', 'int', 'fai', 'arc']

/** 空のステータス */
const ZERO_STATS: QuestStats = { str: 0, dex: 0, end: 0, int: 0, fai: 0, arc: 0 }

/** 期間ごとの hiddenExp 加算値（Daily: +1, Weekly: +3, Monthly: +6） */
const HIDDEN_EXP_PER_PERIOD: Record<'daily' | 'weekly' | 'monthly', number> = {
  daily: 1,
  weekly: 3,
  monthly: 6,
}

/**
 * クエストクリア時に primaryStat に対応する hiddenExp を加算する量を返す。
 * @param period クエストの期間（Daily/Weekly/Monthly）
 * @returns 加算する hiddenExp の値
 */
export function addQuestHiddenExp(primaryStat: PrimaryStat, period: 'daily' | 'weekly' | 'monthly'): number {
  return HIDDEN_EXP_PER_PERIOD[period] ?? 1
}

/**
 * クエストクリア時の処理: 全体 exp に加え、primaryStat に応じた hiddenExp を加算した結果を返す。
 * @param currentHiddenExp 現在の hiddenExp
 * @param primaryStat クエストの主属性
 * @param period クエストの期間
 * @returns 加算後の hiddenExp（新規オブジェクト）
 */
export function addQuestExp(
  currentHiddenExp: StatBlock,
  primaryStat: PrimaryStat,
  period: 'daily' | 'weekly' | 'monthly'
): StatBlock {
  const gain = addQuestHiddenExp(primaryStat, period)
  return {
    ...currentHiddenExp,
    [primaryStat]: (currentHiddenExp[primaryStat] ?? 0) + gain,
  }
}

/**
 * レベルアップ時の処理: hiddenExp の最大属性を特定し、その stats を +1、hiddenExp を 0 にリセットする。
 * 同点の場合は str > dex > end > int > fai > arc の優先順位で 1 つ決定。
 *
 * @param stats 現在の実際のステータス
 * @param hiddenExp 現在の裏の努力値
 * @returns 成長後の stats、リセット後の hiddenExp、選ばれた成長ステータス
 */
export function processLevelUp(stats: StatBlock, hiddenExp: StatBlock): { stats: StatBlock; hiddenExp: StatBlock; selectedStat: StatKey } {
  let dominantStat: StatKey = 'str'
  let maxVal = hiddenExp.str ?? 0

  for (const k of STAT_PRIORITY) {
    const v = hiddenExp[k] ?? 0
    if (v > maxVal) {
      maxVal = v
      dominantStat = k
    }
  }

  const newStats: StatBlock = {
    ...stats,
    [dominantStat]: (stats[dominantStat] ?? 0) + 1,
  }

  return {
    stats: newStats,
    hiddenExp: { ...ZERO_STATS },
    selectedStat: dominantStat,
  }
}

/**
 * hiddenExp から次に成長する属性を判定（同点時は優先順位適用）。
 * processLevelUp の内部判定と同じロジック。
 */
export function getDominantHiddenStat(hiddenExp: StatBlock): StatKey {
  let dominant: StatKey = 'str'
  let maxVal = hiddenExp.str ?? 0
  for (const k of STAT_PRIORITY) {
    const v = hiddenExp[k] ?? 0
    if (v > maxVal) {
      maxVal = v
      dominant = k
    }
  }
  return dominant
}

/**
 * クリアしたクエストの履歴から、現在の総ステータスと最も尖っている属性を算出する。
 * 固定クエストDBに存在するクエストのみ stats に加算。AI生成クエストは stats が渡されていれば加算。
 *
 * @param clearedQuests クリア済みクエストの配列。各要素は title を持つオブジェクトか、タイトル文字列。stats が含まれていればそれを使用
 * @returns 総ステータスと dominantStat（尖り属性）
 */
export function calculateUserStats(
  clearedQuests: Array<{ title: string; stats?: QuestStats }> | string[]
): CalculatedUserStats {
  const total: QuestStats = { ...ZERO_STATS }

  const items = Array.isArray(clearedQuests) && typeof clearedQuests[0] === 'string'
    ? (clearedQuests as string[]).map((t) => ({ title: t }))
    : (clearedQuests as Array<{ title: string; stats?: QuestStats }>)

  for (const item of items) {
    const title = typeof item === 'string' ? item : item.title
    let questStats: QuestStats | null =
      typeof item === 'object' && 'stats' in item && item.stats
        ? (item as { title: string; stats: QuestStats }).stats
        : null
    if (!questStats) questStats = getQuestStatsByTitle(title)
    if (questStats) {
      total.str += questStats.str
      total.dex += questStats.dex
      total.end += questStats.end
      total.int += questStats.int
      total.fai += questStats.fai
      total.arc += questStats.arc
    }
  }

  const maxVal = Math.max(total.str, total.dex, total.end, total.int, total.fai, total.arc)
  const dominantStat: StatKey | null =
    maxVal > 0
      ? (STAT_KEYS.filter((k) => total[k] === maxVal)[0] ?? null)
      : null

  return { total, dominantStat }
}
