/**
 * ミッション記録（クリアしたクエストの履歴）
 * タイトル・ユーザー感想・AIクリアメッセージを保存し、/history で表示する
 */

import type { QuestStats } from './quest-types'

const STORAGE_KEY = 'quest-log:missionRecord'

export interface MissionRecordItem {
  questTitle: string
  reflection: string
  clearMessage: string
  /** 記録日時（表示用） */
  clearedAt: string
  /** クエストクリアで得たステータス（6属性）。AI生成クエスト用。任意。 */
  stats?: QuestStats
}

export function getMissionRecord(): MissionRecordItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (x): x is MissionRecordItem =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as MissionRecordItem).questTitle === 'string' &&
        typeof (x as MissionRecordItem).reflection === 'string' &&
        typeof (x as MissionRecordItem).clearMessage === 'string'
    )
  } catch {
    return []
  }
}

export function pushMissionRecord(item: Omit<MissionRecordItem, 'clearedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const prev = getMissionRecord()
    const clearedAt = new Date().toISOString()
    const next = [...prev, { ...item, clearedAt }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function clearMissionRecord(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
