const STORAGE_KEY_PREFIX = 'quest-log:lastFetch_'
const QUESTS_STORAGE_KEY_PREFIX = 'quest-log:fetchedQuests_'
const CLEARED_QUESTS_STORAGE_KEY_PREFIX = 'quest-log:clearedQuests_'
const EXTRA_QUEST_STORAGE_KEY_PREFIX = 'quest-log:extraQuest_'
const EXTRA_CLEARED_STORAGE_KEY_PREFIX = 'quest-log:extraCleared_'
const TRIAL_QUEST_STORAGE_KEY = 'quest-log:trialQuest'
const TRIAL_CLEARED_STORAGE_KEY = 'quest-log:trialCleared'
const WEEKEND_CHALLENGE_KEY = 'quest-log:weekendChallenge'
const WEEKEND_CHALLENGE_CLEARED_KEY = 'quest-log:weekendChallengeCleared'
const MONTHLY_EVENT_KEY = 'quest-log:monthlyEventQuest'
const MONTHLY_EVENT_CLEARED_KEY = 'quest-log:monthlyEventCleared'
const INVERTED_QUEST_KEY = 'quest-log:invertedQuest'
const INVERTED_QUEST_CLEARED_KEY = 'quest-log:invertedQuestCleared'

export type QuestTier = 'beginner' | 'intermediate' | 'advanced' | 'abyss'
export type QuestPeriod = 'daily' | 'weekly' | 'monthly'
export type QuestDifficulty = QuestTier

/** 期間+難易度の複合キー（後方互換: tierのみの呼び出しは daily_<tier> にマップ） */
function getStorageSuffix(period: QuestPeriod, difficulty: QuestDifficulty): string {
  return `${period}_${difficulty}`
}

/** 全9組み合わせ + abyss（転生者のみ） + 旧3組み合わせをクリア（後方互換） */
const ALL_COMBOS: Array<{ period: QuestPeriod; difficulty: QuestDifficulty }> = (() => {
  const periods: QuestPeriod[] = ['daily', 'weekly', 'monthly']
  const difficulties: QuestDifficulty[] = ['beginner', 'intermediate', 'advanced', 'abyss']
  return periods.flatMap((p) => difficulties.map((d) => ({ period: p, difficulty: d })))
})()

/** デバッグ用: クエスト履歴とロック状態をリセット */
export function clearQuestCache(): void {
  if (typeof window === 'undefined') return
  try {
    ALL_COMBOS.forEach(({ period, difficulty }) => {
      const key = getStorageSuffix(period, difficulty)
      localStorage.removeItem(QUESTS_STORAGE_KEY_PREFIX + key)
      localStorage.removeItem(STORAGE_KEY_PREFIX + key)
      localStorage.removeItem(CLEARED_QUESTS_STORAGE_KEY_PREFIX + key)
      localStorage.removeItem(EXTRA_QUEST_STORAGE_KEY_PREFIX + key)
      localStorage.removeItem(EXTRA_CLEARED_STORAGE_KEY_PREFIX + key)
    })
    localStorage.removeItem(TRIAL_QUEST_STORAGE_KEY)
    localStorage.removeItem(TRIAL_CLEARED_STORAGE_KEY)
    localStorage.removeItem(WEEKEND_CHALLENGE_KEY)
    localStorage.removeItem(WEEKEND_CHALLENGE_CLEARED_KEY)
    localStorage.removeItem(MONTHLY_EVENT_KEY)
    localStorage.removeItem(MONTHLY_EVENT_CLEARED_KEY)
    localStorage.removeItem(INVERTED_QUEST_KEY)
    localStorage.removeItem(INVERTED_QUEST_CLEARED_KEY)
    window.location.reload()
  } catch {
    // ignore
  }
}

type TimePeriod = 'morning' | 'afternoon'

function getJSTNow(): { dateStr: string; period: TimePeriod; weekStr: string; monthStr: string } {
  const now = new Date()
  const jstStr = now.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo' })
  const datePart = jstStr.split(',')[0].trim()
  const timePart = jstStr.split(',')[1]?.trim() ?? ''
  const hour = parseInt(timePart.split(':')[0] ?? '0', 10)
  const period: TimePeriod = hour < 12 ? 'morning' : 'afternoon'
  const [y, m, d] = datePart.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const jan1 = new Date(y, 0, 1)
  const weekNum = Math.ceil(((date.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  const weekStr = `${y}-W${String(weekNum).padStart(2, '0')}`
  const monthStr = `${y}-${String(m).padStart(2, '0')}`
  return { dateStr: datePart, period, weekStr, monthStr }
}

/** 期間に応じた有効期限キーを取得（Daily=日, Weekly=週, Monthly=月） */
function getValidityKey(questPeriod: QuestPeriod): string {
  const { dateStr, weekStr, monthStr } = getJSTNow()
  if (questPeriod === 'daily') return dateStr
  if (questPeriod === 'weekly') return weekStr
  return monthStr
}

/** JSTで土日かどうか。週末チャレンジの表示・取得可否に使用 */
export function isWeekend(): boolean {
  const { dateStr } = getJSTNow()
  const [y, m, d] = dateStr.split('-').map(Number)
  const utcNoonJST = Date.UTC(y, m - 1, d) + 3 * 60 * 60 * 1000
  const dayOfWeek = new Date(utcNoonJST).getUTCDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

export interface QuestLockStatus {
  canFetch: boolean
  nextUpdateMessage: string
}

export function getQuestLockStatus(
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): QuestLockStatus {
  if (typeof window === 'undefined') {
    return { canFetch: true, nextUpdateMessage: '' }
  }

  const key = getStorageSuffix(period, difficulty)
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    const now = getJSTNow()
    const validityKey = getValidityKey(period)

    if (!stored) {
      return { canFetch: true, nextUpdateMessage: '' }
    }

    const parsed = JSON.parse(stored) as { dateStr?: string; period?: TimePeriod; weekStr?: string; monthStr?: string; validityKey?: string }
    const lastValidity = parsed.validityKey ?? parsed.dateStr ?? ''

    if (period === 'daily') {
      const { dateStr: currentDate, period: currentPeriod } = now
      const lastDate = parsed.dateStr ?? ''
      const lastPeriod = parsed.period ?? 'morning'

      if (currentDate !== lastDate) return { canFetch: true, nextUpdateMessage: '' }
      if (currentPeriod !== lastPeriod) return { canFetch: true, nextUpdateMessage: '' }
      if (currentPeriod === 'morning') {
        return { canFetch: false, nextUpdateMessage: '次の更新は午後です' }
      }
      return { canFetch: false, nextUpdateMessage: '次の更新は明日です' }
    }

    if (period === 'weekly') {
      if (validityKey !== lastValidity) return { canFetch: true, nextUpdateMessage: '' }
      return { canFetch: false, nextUpdateMessage: '次の更新は来週です' }
    }

    if (period === 'monthly') {
      if (validityKey !== lastValidity) return { canFetch: true, nextUpdateMessage: '' }
      return { canFetch: false, nextUpdateMessage: '次の更新は来月です' }
    }

    return { canFetch: true, nextUpdateMessage: '' }
  } catch {
    return { canFetch: true, nextUpdateMessage: '' }
  }
}

/** 試練モードのロック状態（週1回、Weeklyと同様） */
export function getTrialLockStatus(): QuestLockStatus {
  if (typeof window === 'undefined') return { canFetch: true, nextUpdateMessage: '' }
  try {
    const raw = localStorage.getItem(TRIAL_QUEST_STORAGE_KEY)
    if (!raw) return { canFetch: true, nextUpdateMessage: '' }
    const parsed = JSON.parse(raw) as { validityKey?: string }
    const validityKey = getValidityKey('weekly')
    if (parsed?.validityKey !== validityKey) return { canFetch: true, nextUpdateMessage: '' }
    return { canFetch: false, nextUpdateMessage: '次の試練は来週です' }
  } catch {
    return { canFetch: true, nextUpdateMessage: '' }
  }
}

/** 試練クエストを読み込み */
export function loadTrialQuest(): { title: string; description: string; flavorText?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(TRIAL_QUEST_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; quest?: { title: string; description: string; flavorText?: string } }
    const validityKey = getValidityKey('weekly')
    if (parsed?.validityKey !== validityKey || !parsed.quest) return null
    return parsed.quest
  } catch {
    return null
  }
}

/** 試練クエストを保存 */
export function saveTrialQuest(quest: { title: string; description: string; flavorText?: string }): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey('weekly')
    localStorage.setItem(TRIAL_QUEST_STORAGE_KEY, JSON.stringify({ validityKey, quest }))
  } catch {
    // ignore
  }
}

/** 試練のクリア状態を読み込み */
export function loadTrialCleared(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(TRIAL_CLEARED_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; message?: string }
    const validityKey = getValidityKey('weekly')
    if (parsed?.validityKey !== validityKey || typeof parsed.message !== 'string') return null
    return parsed.message
  } catch {
    return null
  }
}

/** 試練のクリア状態を保存 */
export function saveTrialCleared(message: string): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey('weekly')
    localStorage.setItem(TRIAL_CLEARED_STORAGE_KEY, JSON.stringify({ validityKey, message }))
  } catch {
    // ignore
  }
}

/** 週末チャレンジ: ロック状態（週1回、週末のみ。validityKey=weekStr） */
export function getWeekendChallengeLockStatus(): QuestLockStatus {
  if (typeof window === 'undefined') return { canFetch: true, nextUpdateMessage: '' }
  if (!isWeekend()) return { canFetch: false, nextUpdateMessage: '週末（土日）のみ解放' }
  try {
    const raw = localStorage.getItem(WEEKEND_CHALLENGE_KEY)
    if (!raw) return { canFetch: true, nextUpdateMessage: '' }
    const parsed = JSON.parse(raw) as { validityKey?: string }
    const validityKey = getValidityKey('weekly')
    if (parsed?.validityKey !== validityKey) return { canFetch: true, nextUpdateMessage: '' }
    return { canFetch: false, nextUpdateMessage: '次の週末チャレンジは来週です' }
  } catch {
    return { canFetch: true, nextUpdateMessage: '' }
  }
}

/** 週末チャレンジを読み込み */
export function loadWeekendChallenge(): { title: string; description: string; flavorText?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(WEEKEND_CHALLENGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; quest?: { title: string; description: string; flavorText?: string } }
    const validityKey = getValidityKey('weekly')
    if (parsed?.validityKey !== validityKey || !parsed.quest) return null
    return parsed.quest
  } catch {
    return null
  }
}

/** 週末チャレンジを保存 */
export function saveWeekendChallenge(quest: { title: string; description: string; flavorText?: string }): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey('weekly')
    localStorage.setItem(WEEKEND_CHALLENGE_KEY, JSON.stringify({ validityKey, quest }))
  } catch {
    // ignore
  }
}

/** 週末チャレンジのクリア状態 */
export function loadWeekendChallengeCleared(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(WEEKEND_CHALLENGE_CLEARED_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; message?: string }
    const validityKey = getValidityKey('weekly')
    if (parsed?.validityKey !== validityKey || typeof parsed.message !== 'string') return null
    return parsed.message
  } catch {
    return null
  }
}

export function saveWeekendChallengeCleared(message: string): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey('weekly')
    localStorage.setItem(WEEKEND_CHALLENGE_CLEARED_KEY, JSON.stringify({ validityKey, message }))
  } catch {
    // ignore
  }
}

/** 月間テーマイベント: ロック状態（月1回、validityKey=monthStr） */
export function getMonthlyEventLockStatus(): QuestLockStatus {
  if (typeof window === 'undefined') return { canFetch: true, nextUpdateMessage: '' }
  try {
    const raw = localStorage.getItem(MONTHLY_EVENT_KEY)
    if (!raw) return { canFetch: true, nextUpdateMessage: '' }
    const parsed = JSON.parse(raw) as { validityKey?: string }
    const validityKey = getValidityKey('monthly')
    if (parsed?.validityKey !== validityKey) return { canFetch: true, nextUpdateMessage: '' }
    return { canFetch: false, nextUpdateMessage: '次の月間テーマは来月です' }
  } catch {
    return { canFetch: true, nextUpdateMessage: '' }
  }
}

/** 月間テーマイベントを読み込み */
export function loadMonthlyEventQuest(): { title: string; description: string; flavorText?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(MONTHLY_EVENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; quest?: { title: string; description: string; flavorText?: string } }
    const validityKey = getValidityKey('monthly')
    if (parsed?.validityKey !== validityKey || !parsed.quest) return null
    return parsed.quest
  } catch {
    return null
  }
}

/** 月間テーマイベントを保存 */
export function saveMonthlyEventQuest(quest: { title: string; description: string; flavorText?: string }): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey('monthly')
    localStorage.setItem(MONTHLY_EVENT_KEY, JSON.stringify({ validityKey, quest }))
  } catch {
    // ignore
  }
}

/** 月間テーマイベントのクリア状態 */
export function loadMonthlyEventCleared(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(MONTHLY_EVENT_CLEARED_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; message?: string }
    const validityKey = getValidityKey('monthly')
    if (parsed?.validityKey !== validityKey || typeof parsed.message !== 'string') return null
    return parsed.message
  } catch {
    return null
  }
}

export function saveMonthlyEventCleared(message: string): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey('monthly')
    localStorage.setItem(MONTHLY_EVENT_CLEARED_KEY, JSON.stringify({ validityKey, message }))
  } catch {
    // ignore
  }
}

/** 反転クエスト: ロック状態（日1回、validityKey=dateStr） */
export function getInvertedQuestLockStatus(): QuestLockStatus {
  if (typeof window === 'undefined') return { canFetch: true, nextUpdateMessage: '' }
  try {
    const raw = localStorage.getItem(INVERTED_QUEST_KEY)
    if (!raw) return { canFetch: true, nextUpdateMessage: '' }
    const parsed = JSON.parse(raw) as { validityKey?: string }
    const validityKey = getValidityKey('daily')
    if (parsed?.validityKey !== validityKey) return { canFetch: true, nextUpdateMessage: '' }
    return { canFetch: false, nextUpdateMessage: '次の反転クエストは明日です' }
  } catch {
    return { canFetch: true, nextUpdateMessage: '' }
  }
}

/** 反転クエストを読み込み */
export function loadInvertedQuest(): { title: string; description: string; flavorText?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(INVERTED_QUEST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; quest?: { title: string; description: string; flavorText?: string } }
    const validityKey = getValidityKey('daily')
    if (parsed?.validityKey !== validityKey || !parsed.quest) return null
    return parsed.quest
  } catch {
    return null
  }
}

/** 反転クエストを保存 */
export function saveInvertedQuest(quest: { title: string; description: string; flavorText?: string }): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey('daily')
    localStorage.setItem(INVERTED_QUEST_KEY, JSON.stringify({ validityKey, quest }))
  } catch {
    // ignore
  }
}

/** 反転クエストのクリア状態 */
export function loadInvertedQuestCleared(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(INVERTED_QUEST_CLEARED_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; message?: string }
    const validityKey = getValidityKey('daily')
    if (parsed?.validityKey !== validityKey || typeof parsed.message !== 'string') return null
    return parsed.message
  } catch {
    return null
  }
}

export function saveInvertedQuestCleared(message: string): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey('daily')
    localStorage.setItem(INVERTED_QUEST_CLEARED_KEY, JSON.stringify({ validityKey, message }))
  } catch {
    // ignore
  }
}

export function saveQuestFetch(
  quests: Array<{ title: string; description: string; flavorText?: string }>,
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): void {
  if (typeof window === 'undefined') return

  try {
    const now = getJSTNow()
    const validityKey = getValidityKey(period)
    const key = getStorageSuffix(period, difficulty)
    const lockPayload = period === 'daily'
      ? { dateStr: now.dateStr, period: now.period, validityKey }
      : { validityKey }
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(lockPayload))
    localStorage.setItem(QUESTS_STORAGE_KEY_PREFIX + key, JSON.stringify({ dateStr: now.dateStr, validityKey, quests }))
  } catch {
    // localStorage が使えない環境
  }
}

/** フォールバック用: クエストのみ保存し、fetchロックは更新しない（再試行可能のまま） */
export function saveQuestsToCacheOnly(
  quests: Array<{ title: string; description: string; flavorText?: string }>,
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): void {
  if (typeof window === 'undefined') return
  try {
    const now = getJSTNow()
    const validityKey = getValidityKey(period)
    const key = getStorageSuffix(period, difficulty)
    localStorage.setItem(QUESTS_STORAGE_KEY_PREFIX + key, JSON.stringify({ dateStr: now.dateStr, validityKey, quests }))
  } catch {
    // ignore
  }
}

export function loadFetchedQuests(
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): Array<{ title: string; description: string; flavorText?: string }> | null {
  if (typeof window === 'undefined') return null

  try {
    const key = getStorageSuffix(period, difficulty)
    const stored = localStorage.getItem(QUESTS_STORAGE_KEY_PREFIX + key)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    const { validityKey: storedValidity, quests } =
      parsed && Array.isArray(parsed.quests)
        ? { validityKey: parsed.validityKey ?? parsed.dateStr, quests: parsed.quests }
        : { validityKey: '', quests: [] }

    const currentValidity = getValidityKey(period)
    if (storedValidity !== currentValidity) return null

    const valid = quests.filter(
      (q: unknown): q is { title: string; description: string; flavorText?: string } =>
        typeof q === 'object' &&
        q !== null &&
        typeof (q as { title?: unknown }).title === 'string' &&
        typeof (q as { description?: unknown }).description === 'string'
    )
    return valid.length > 0 ? valid : null
  } catch {
    return null
  }
}

/** クリア済みクエスト（index → クリアメッセージ）を復元。有効期限は期間に応じて判定 */
export function loadClearedQuests(
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): Record<number, string> {
  if (typeof window === 'undefined') return {}
  try {
    const key = getStorageSuffix(period, difficulty)
    const raw = localStorage.getItem(CLEARED_QUESTS_STORAGE_KEY_PREFIX + key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as { validityKey?: string; dateStr?: string; cleared?: Record<string, string> }
    const currentValidity = getValidityKey(period)
    const storedValidity = parsed?.validityKey ?? parsed?.dateStr ?? ''
    if (storedValidity !== currentValidity || !parsed.cleared || typeof parsed.cleared !== 'object') return {}
    const cleared: Record<number, string> = {}
    for (const [k, v] of Object.entries(parsed.cleared)) {
      if (typeof v === 'string') cleared[Number(k)] = v
    }
    return cleared
  } catch {
    return {}
  }
}

/** エクストラクエストを読み込み（全クリア時に出現。有効期限はメインと同じ） */
export function loadExtraQuest(
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): { title: string; description: string; flavorText?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const key = getStorageSuffix(period, difficulty)
    const raw = localStorage.getItem(EXTRA_QUEST_STORAGE_KEY_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; quest?: { title: string; description: string; flavorText?: string } }
    const currentValidity = getValidityKey(period)
    if (parsed?.validityKey !== currentValidity || !parsed.quest) return null
    return parsed.quest
  } catch {
    return null
  }
}

/** エクストラクエストを保存 */
export function saveExtraQuest(
  quest: { title: string; description: string; flavorText?: string },
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): void {
  if (typeof window === 'undefined') return
  try {
    const key = getStorageSuffix(period, difficulty)
    const validityKey = getValidityKey(period)
    localStorage.setItem(EXTRA_QUEST_STORAGE_KEY_PREFIX + key, JSON.stringify({ validityKey, quest }))
  } catch {
    // ignore
  }
}

/** エクストラクエストのクリア状態を読み込み */
export function loadExtraQuestCleared(
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): string | null {
  if (typeof window === 'undefined') return null
  try {
    const key = getStorageSuffix(period, difficulty)
    const raw = localStorage.getItem(EXTRA_CLEARED_STORAGE_KEY_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { validityKey?: string; message?: string }
    const currentValidity = getValidityKey(period)
    if (parsed?.validityKey !== currentValidity || typeof parsed.message !== 'string') return null
    return parsed.message
  } catch {
    return null
  }
}

/** エクストラクエストのクリア状態を保存 */
export function saveExtraQuestCleared(
  message: string,
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): void {
  if (typeof window === 'undefined') return
  try {
    const key = getStorageSuffix(period, difficulty)
    const validityKey = getValidityKey(period)
    localStorage.setItem(EXTRA_CLEARED_STORAGE_KEY_PREFIX + key, JSON.stringify({ validityKey, message }))
  } catch {
    // ignore
  }
}

/** クリア済みクエストを保存（報告提出時などに呼ぶ） */
export function saveClearedQuests(
  cleared: Record<number, string>,
  period: QuestPeriod = 'daily',
  difficulty: QuestDifficulty = 'beginner'
): void {
  if (typeof window === 'undefined') return
  try {
    const validityKey = getValidityKey(period)
    const { dateStr } = getJSTNow()
    const key = getStorageSuffix(period, difficulty)
    localStorage.setItem(CLEARED_QUESTS_STORAGE_KEY_PREFIX + key, JSON.stringify({ dateStr, validityKey, cleared }))
  } catch {
    // ignore
  }
}
