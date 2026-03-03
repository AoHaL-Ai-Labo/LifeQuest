/**
 * SaveData 用ユーティリティ
 * Server Actions で使用する EXP 計算・ stats パース
 */
import { addQuestExp, processLevelUp } from './statusEngine'
import type { PrimaryStat, QuestStats } from './quest-types'

const DEFAULT_STATS: QuestStats = { str: 10, dex: 10, end: 10, int: 10, fai: 10, arc: 10 }
const DEFAULT_HIDDEN_EXP: QuestStats = { str: 0, dex: 0, end: 0, int: 0, fai: 0, arc: 0 }

const EXP_MATRIX: Record<string, Record<string, number>> = {
  daily: { beginner: 7, intermediate: 11, advanced: 16, abyss: 20 },
  weekly: { beginner: 14, intermediate: 22, advanced: 32, abyss: 40 },
  monthly: { beginner: 21, intermediate: 33, advanced: 48, abyss: 60 },
}

/** difficulty が weekly/monthly の場合のフォールバック */
function resolveDifficultyForExp(period: string, difficulty: string): string {
  if (difficulty === 'weekly') return 'intermediate'
  if (difficulty === 'monthly') return 'advanced'
  return difficulty
}

export function parseStatsJson(json: string): QuestStats {
  try {
    const o = JSON.parse(json) as Record<string, number>
    const n = (v: unknown) => Math.max(0, Number(v) || 0)
    return {
      str: n(o.str),
      dex: n(o.dex),
      end: n(o.end),
      int: n(o.int),
      fai: n(o.fai),
      arc: n(o.arc),
    }
  } catch {
    return { ...DEFAULT_STATS }
  }
}

export function parseHiddenExpJson(json: string): QuestStats {
  try {
    const o = JSON.parse(json) as Record<string, number>
    const n = (v: unknown) => Math.max(0, Number(v) || 0)
    return {
      str: n(o.str),
      dex: n(o.dex),
      end: n(o.end),
      int: n(o.int),
      fai: n(o.fai),
      arc: n(o.arc),
    }
  } catch {
    return { ...DEFAULT_HIDDEN_EXP }
  }
}

export function getExpToNextLevel(level: number): number {
  if (level >= 50) return 0
  if (level < 20) return 7 + level * 2
  return 50 + (level - 20) * 15
}

export function getExpFromQuest(
  level: number,
  period: string,
  difficulty: string
): number {
  const d = resolveDifficultyForExp(period, difficulty)
  const base = EXP_MATRIX[period]?.[d] ?? EXP_MATRIX.daily.beginner
  return base + (level < 20 ? 2 : 0)
}

export interface LevelUpResult {
  level: number
  currentExp: number
  stats: QuestStats
  hiddenExp: QuestStats
  leveledUp: boolean
}

/**
 * クエストクリア結果を反映してレベルアップまで計算
 */
export function applyQuestCompletion(
  currentLevel: number,
  currentExp: number,
  currentStats: QuestStats,
  currentHiddenExp: QuestStats,
  questStatsGain: QuestStats,
  primaryStat: PrimaryStat,
  period: 'daily' | 'weekly' | 'monthly',
  expGain: number
): LevelUpResult {
  let level = currentLevel
  let exp = currentExp
  let stats = { ...currentStats }
  let hiddenExp = addQuestExp(currentHiddenExp, primaryStat, period)

  // ステータス加算
  const statKeys = ['str', 'dex', 'end', 'int', 'fai', 'arc'] as const
  for (const k of statKeys) {
    stats[k] = (stats[k] ?? 0) + (questStatsGain[k] ?? 0)
  }

  // EXP 加算とレベルアップ
  let remaining = exp + expGain
  let expToNext = getExpToNextLevel(level)
  let leveledUp = false

  while (level < 50 && remaining >= expToNext) {
    remaining -= expToNext
    level += 1
    leveledUp = true
    const processed = processLevelUp(stats, hiddenExp)
    stats = processed.stats
    hiddenExp = processed.hiddenExp
    expToNext = getExpToNextLevel(level)
  }

  const finalExp = level >= 50 ? 0 : remaining
  return {
    level,
    currentExp: finalExp,
    stats,
    hiddenExp,
    leveledUp,
  }
}
