/**
 * 輪廻の転生（Rebirth）: Lv99到達後の強くてニューゲーム。
 * トロフィーデータは絶対に引き継ぐ。
 */

const REBORN_KEY = 'quest-log:isReborn'

/** 転生者かどうか */
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
  if (typeof window === 'undefined') return
  try {
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
    const resetStatus = {
      level: 1,
      exp: 0,
      rank: '死人',
      prefix: '',
      context: undefined as { environment?: string; weaknesses?: string } | undefined,
    }
    localStorage.setItem('quest-log:playerStatus', JSON.stringify(resetStatus))
    window.dispatchEvent(new CustomEvent('quest-debug-update'))
    window.location.reload()
  } catch {
    // ignore
  }
}
