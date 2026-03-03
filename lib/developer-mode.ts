/**
 * 開発者モード: デバッグパネルなどの表示を制御
 * LocalStorageで永続化。未設定時は開発環境ならON、本番ならOFF。
 */

const STORAGE_KEY = 'quest-log:developerMode'

function getDefault(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NODE_ENV === 'development'
}

/** 開発者モードが有効か */
export function getDeveloperMode(): boolean {
  if (typeof window === 'undefined') return getDefault()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return getDefault()
    return raw === 'true'
  } catch {
    return getDefault()
  }
}

/** 開発者モードのON/OFFを保存 */
export function setDeveloperMode(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
    window.dispatchEvent(new CustomEvent('developer-mode-change', { detail: value }))
  } catch {
    // ignore
  }
}
