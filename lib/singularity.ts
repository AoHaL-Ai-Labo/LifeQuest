/**
 * 特異点（Singularity）: 緊急ミッションのストレージとロジック
 * クエスト完了直後に10〜15%で突発発動。3時間制限の緊急ミッション。
 */

const STORAGE_KEY = 'quest-log:singularity'
const TRIGGER_CHANCE_MIN = 0.1
const TRIGGER_CHANCE_MAX = 0.15
const HOURS_LIMIT = 3

export interface SingularityState {
  /** 特異点クエスト（受諾後） */
  quest: { title: string; description: string; flavorText?: string } | null
  /** 制限時間の終了時刻（ms） */
  endTimeMs: number | null
  /** 制限時間切れで極小ステップに書き換わったか */
  isTimedOut: boolean
  /** 極小ステップの内容（timeout時） */
  minimalStep: { title: string; description: string } | null
  /** 極小ステップを完了したか（これを押すとUIロック解除） */
  minimalCleared: boolean
}

export const SINGULARITY_EXP_MULTIPLIER = 3
export const SINGULARITY_SPECIAL_TITLE = '特異点を征した'

/** 制限時間切れ時に書き換える極小ステップの候補 */
export const MINIMAL_STEP_QUESTS: Array<{ title: string; description: string }> = [
  { title: '水を1杯飲む', description: 'グラスに水を汲み、一気に飲み干す。' },
  { title: '深呼吸を1回する', description: '鼻から深く吸い、口からゆっくり吐く。' },
  { title: '顔を洗う', description: '水道の水で顔を濡らし、目を覚ます。' },
  { title: '窓を開けて空を見る', description: '窓を開け、空を5秒見上げる。' },
  { title: '背筋を伸ばす', description: '座ったまま背筋を5秒伸ばす。' },
]

function getRandomMinimalStep(): { title: string; description: string } {
  const i = Math.floor(Math.random() * MINIMAL_STEP_QUESTS.length)
  return MINIMAL_STEP_QUESTS[i]
}

export function loadSingularityState(): SingularityState {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultState()
    const parsed = JSON.parse(raw) as {
      quest?: { title: string; description: string; flavorText?: string } | null
      endTimeMs?: number | null
      isTimedOut?: boolean
      minimalStep?: { title: string; description: string } | null
      minimalCleared?: boolean
    }
    return {
      quest: parsed.quest ?? null,
      endTimeMs: parsed.endTimeMs ?? null,
      isTimedOut: parsed.isTimedOut ?? false,
      minimalStep: parsed.minimalStep ?? null,
      minimalCleared: parsed.minimalCleared ?? false,
    }
  } catch {
    return getDefaultState()
  }
}

function getDefaultState(): SingularityState {
  return {
    quest: null,
    endTimeMs: null,
    isTimedOut: false,
    minimalStep: null,
    minimalCleared: false,
  }
}

export function saveSingularityState(state: SingularityState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

/** 10〜15%の確率で特異点が発動するかチェック。force=true は常に発動 */
export function shouldTriggerSingularity(force?: boolean): boolean {
  if (force) return true
  const r = Math.random()
  const chance = TRIGGER_CHANCE_MIN + (TRIGGER_CHANCE_MAX - TRIGGER_CHANCE_MIN) * Math.random()
  return r < chance
}

/** 3時間後の終了時刻を算出 */
export function getSingularityEndTime(): number {
  return Date.now() + HOURS_LIMIT * 60 * 60 * 1000
}

/** 制限時間内か */
export function isWithinTimeLimit(endTimeMs: number): boolean {
  return Date.now() < endTimeMs
}

/** 制限時間切れ時に極小ステップを生成して状態を更新 */
export function createTimedOutState(current: SingularityState): SingularityState {
  const minimal = getRandomMinimalStep()
  const next: SingularityState = {
    ...current,
    isTimedOut: true,
    minimalStep: minimal,
  }
  saveSingularityState(next)
  return next
}

/** 極小ステップ完了で特異点をクリア（ストレージリセット） */
export function clearSingularity(): void {
  saveSingularityState(getDefaultState())
}

/** 特異点クエスト報酬EXP（通常の3倍）。呼び出し側で baseExp を渡す */
export function getSingularityExpReward(baseExp: number): number {
  return Math.floor(baseExp * SINGULARITY_EXP_MULTIPLIER)
}
