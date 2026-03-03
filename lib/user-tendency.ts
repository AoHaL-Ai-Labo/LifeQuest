/**
 * ユーザーのステータス傾向をプロンプト用文字列に変換
 */
import { getMaxStats } from './user-class'
import { STAT_KEYWORDS } from './user-class'
import type { QuestStats } from './quest-types'

/** PlayerStats 相当の型（str, dex, end, int, fai, arc） */
type StatsLike = Record<string, number>

/**
 * ステータスから「傾向」文字列を生成
 * 例: "筋力特化", "技量と理力の複合", "持たざる灰"
 */
export function getTendencyForPrompt(stats: QuestStats | StatsLike): string {
  const s = stats as Record<string, number>
  const maxStats = getMaxStats(s)
  const count = maxStats.length
  const baseVal = s[maxStats[0]] ?? 10

  if (count === 6) {
    if (baseVal <= 10) return '持たざる灰（全ステータス均等）'
    return '超越せし万能の灰（全ステータス高水準）'
  }

  if (count === 1) {
    return `${STAT_KEYWORDS[maxStats[0]]}特化`
  }

  if (count === 2) {
    return `${STAT_KEYWORDS[maxStats[0]]}と${STAT_KEYWORDS[maxStats[1]]}の複合`
  }

  if (count === 3) {
    const k = maxStats.map((x) => STAT_KEYWORDS[x])
    return `${k[0]}・${k[1]}・${k[2]}の複合`
  }

  if (count === 4 || count === 5) {
    return '混沌なる多才の灰（複数ステータス突出）'
  }

  return '持たざる灰'
}
