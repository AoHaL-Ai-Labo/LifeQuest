/**
 * セーブデータの有無判定とフルリセット（New Game用）
 */

import { loadFetchedQuests } from '@/lib/quest-lock'
import { loadPlayerStatus } from '@/lib/player-status'
import { getMissionRecord } from '@/lib/mission-record'

/** Continue が有効か（データが1件でもあるか） */
export function hasSaveData(): boolean {
  if (typeof window === 'undefined') return false
  const status = loadPlayerStatus()
  if (status.level > 1 || status.exp > 0 || status.prefix !== '') return true
  const periods = ['daily', 'weekly', 'monthly'] as const
  const difficulties = ['beginner', 'intermediate', 'advanced'] as const
  for (const p of periods) {
    for (const d of difficulties) {
      if (loadFetchedQuests(p, d)?.length) return true
    }
  }
  if (getMissionRecord().length > 0) return true
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('quest-log:')) return true
    }
  } catch {
    // ignore
  }
  return false
}

/** New Game: 全セーブデータを削除して /quest へ（呼び出し側で router.push） */
export function hardResetSaveData(): void {
  if (typeof window === 'undefined') return
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('quest-log:')) keys.push(key)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
