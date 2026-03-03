/**
 * 輪廻の転生（Rebirth / 火を継ぐ）: Lv50到達後の強くてニューゲーム。
 * prestigeCount を加算し、レベル・EXPをリセット。トロフィーデータは絶対に引き継ぐ。
 */

import { loadPlayerStatus, savePlayerStatus } from './player-status'

const REBORN_KEY = 'quest-log:isReborn'

/** 転生者かどうか（prestigeCount > 0 のときも true。executePrestige で setReborn(true) を呼ぶ） */
export function isReborn(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(REBORN_KEY)
    return raw === 'true'
  } catch {
    return false
  }
}

/** 転生フラグを保存 */
export function setReborn(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(REBORN_KEY, value ? 'true' : 'false')
  } catch {
    // ignore
  }
}

/** 転生を実行。トロフィーデータは保持し、レベルを1にリセット */
export function executeRebirth(): void {
  executePrestige()
}

/**
 * 火を継ぐ（転生）: Lv50到達時に実行。
 * level=1, exp=0 にリセットし、prestigeCount を +1。
 * クエストデータはクリアするが、強くてニューゲームとして全難易度解放を維持。
 */
export function executePrestige(): void {
  if (typeof window === 'undefined') return
  try {
    const current = loadPlayerStatus()
    const prestigeCount = (current.prestigeCount ?? 0) + 1

    const keepKeys = ['quest-log:trophyAchieved', REBORN_KEY]
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('quest-log:') && !keepKeys.includes(key)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    setReborn(true)
    savePlayerStatus({
      level: 1,
      exp: 0,
      rank: '死人',
      prefix: current.prefix,
      prestigeCount,
      stats: { str: 10, dex: 10, end: 10, int: 10, fai: 10, arc: 10 },
      hiddenExp: { str: 0, dex: 0, end: 0, int: 0, fai: 0, arc: 0 },
      context: current.context,
    })
    window.dispatchEvent(new CustomEvent('quest-debug-update'))
    window.location.reload()
  } catch {
    // ignore
  }
}
