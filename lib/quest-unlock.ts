/**
 * クエスト解放ロジック: 期間 × 難易度のマトリクス
 * v0 UI保護のため、既存カラースキーム・Tailwindクラスは維持
 */

export type QuestPeriod = 'daily' | 'weekly' | 'monthly'
export type QuestDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'abyss'

/** 試練モードの解放レベル */
export const TRIAL_UNLOCK_LEVEL = 25

/** 試練モードが解放されているか */
export function isTrialUnlocked(level: number): boolean {
  return level >= TRIAL_UNLOCK_LEVEL
}

/** 月間テーマイベントの解放レベル */
export const MONTHLY_EVENT_UNLOCK_LEVEL = 10

/** 月間テーマイベントが解放されているか */
export function isMonthlyEventUnlocked(level: number): boolean {
  return level >= MONTHLY_EVENT_UNLOCK_LEVEL
}

/** 反転クエストの解放レベル */
export const INVERTED_QUEST_UNLOCK_LEVEL = 8

/** 反転クエストが解放されているか */
export function isInvertedQuestUnlocked(level: number): boolean {
  return level >= INVERTED_QUEST_UNLOCK_LEVEL
}

/** 狂気（Abyss）: 転生者のみ解放。通常のUNLOCK_MATRIXには含めない */
export function isAbyssUnlocked(isRebornUser: boolean): boolean {
  return isRebornUser
}

/** 各（期間, 難易度）の解放レベル。abyssは転生者のみ（isAbyssUnlockedで判定） */
export const UNLOCK_MATRIX: Record<QuestPeriod, Partial<Record<QuestDifficulty, number>>> = {
  daily: {
    beginner: 1,
    intermediate: 3,
    advanced: 12,
  },
  weekly: {
    beginner: 3,
    intermediate: 8,
    advanced: 15,
  },
  monthly: {
    beginner: 5,
    intermediate: 15,
    advanced: 20,
  },
}

/** 指定の（期間, 難易度）が解放されているか */
export function isQuestComboUnlocked(
  level: number,
  period: QuestPeriod,
  difficulty: QuestDifficulty,
  isRebornUser?: boolean
): boolean {
  if (difficulty === 'abyss') return isAbyssUnlocked(isRebornUser ?? false)
  const lv = UNLOCK_MATRIX[period]?.[difficulty as 'beginner' | 'intermediate' | 'advanced']
  return lv !== undefined && level >= lv
}

/** 解放に必要なレベルを取得。abyssは転生時解放のため0を返す */
export function getUnlockLevel(period: QuestPeriod, difficulty: QuestDifficulty): number {
  if (difficulty === 'abyss') return 0
  return UNLOCK_MATRIX[period]?.[difficulty as 'beginner' | 'intermediate' | 'advanced'] ?? 99
}

/** 期間タブ（Daily/Weekly/Monthly）の解放レベル。その期間で最低1つ難易度が解放されるレベル */
export const PERIOD_UNLOCK_LEVELS: Record<QuestPeriod, number> = {
  daily: 1,
  weekly: 3,
  monthly: 5,
}

/** 期間が解放されているか（その期間で最低1難易度が解放可能） */
export function isPeriodUnlocked(level: number, period: QuestPeriod): boolean {
  return level >= PERIOD_UNLOCK_LEVELS[period]
}

/** 期間の解放に必要なレベル */
export function getPeriodUnlockLevel(period: QuestPeriod): number {
  return PERIOD_UNLOCK_LEVELS[period]
}

/** 現在の難易度の次に解放される難易度の情報。既に全解放ならnull */
export function getNextUnlockForDifficulty(
  level: number,
  period: QuestPeriod,
  currentDifficulty: QuestDifficulty
): { level: number; label: string } | null {
  const order: QuestDifficulty[] = ['beginner', 'intermediate', 'advanced']
  const idx = order.indexOf(currentDifficulty)
  if (idx >= 2 || currentDifficulty === 'abyss') return null
  const next = order[idx + 1] as 'beginner' | 'intermediate' | 'advanced'
  const unlockLv = UNLOCK_MATRIX[period]?.[next] ?? 99
  if (level >= unlockLv) return null
  const labels: Record<string, string> = { beginner: '初級', intermediate: '中級', advanced: '上級' }
  return { level: unlockLv, label: labels[next] }
}
