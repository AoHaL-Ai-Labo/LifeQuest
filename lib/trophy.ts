/**
 * Trophy（特級実績）: 人生の超大型ミッション。期限なし、1回限り。
 * localStorage で達成状態を永続化。
 */

const STORAGE_KEY = 'quest-log:trophyAchieved'

export interface TrophyItem {
  id: string
  title: string
  description: string
  /** 達成時にアンロックするバッジ名（UI表示用） */
  badge: string
  /** 達成時に得られる称号（オプション） */
  titleUnlock?: string
}

export const TROPHY_LIST: TrophyItem[] = [
  {
    id: 'marathon',
    title: 'フルマラソン完走',
    description: '42.195kmを己の足で踏破せよ。魂の炎は、終わりのない路をも照らす。',
    badge: '🏃 炎のランナー',
    titleUnlock: '『炎を纏う』',
  },
  {
    id: 'overseas',
    title: '海外旅行に行く',
    description: '未知の地へ足を踏み入れよ。境界を超える者にだけ、新たな地平が開かれる。',
    badge: '✈️ 境界の渡り手',
    titleUnlock: '『国境を越えた』',
  },
  {
    id: 'public_speak',
    title: '大勢の前でスピーチする',
    description: '群衆の前に立ち、己の声を届けよ。沈黙を破る者は、世界を動かす。',
    badge: '🎤 声の継承者',
    titleUnlock: '『演壇を制する』',
  },
  {
    id: 'book_publish',
    title: '一冊の本を書き上げる',
    description: '言葉を紡ぎ、形にせよ。記録されることで、魂は永続する。',
    badge: '📜 記録の守り手',
    titleUnlock: '『物語を紡ぐ』',
  },
  {
    id: 'skill_master',
    title: '一つの技能を極める',
    description: '何かを極めよ。達人の一歩は、凡人千歩に勝る。',
    badge: '⚔️ 達人の印',
    titleUnlock: '『技を極めた』',
  },
]

/** 達成済みのTrophy ID一覧を取得 */
export function getAchievedTrophyIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Trophyを達成として記録 */
export function markTrophyAchieved(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const current = getAchievedTrophyIds()
    if (current.includes(id)) return
    const next = [...current, id]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

/** 指定Trophyが達成済みか */
export function isTrophyAchieved(id: string): boolean {
  return getAchievedTrophyIds().includes(id)
}
