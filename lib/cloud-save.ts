/**
 * クラウドセーブ同期ユーティリティ
 * localStorageのデータをサーバーDBと同期する
 */

const PLAYER_STATUS_KEY = 'quest-log:playerStatus'
const MISSION_RECORD_KEY = 'quest-log:missionRecord'
const TROPHY_KEY = 'quest-log:trophyAchieved'
const REBORN_KEY = 'quest-log:isReborn'
const STREAK_KEY = 'quest-log:streak'

export interface CloudSavePayload {
  level: number
  currentExp: number
  str: number
  dex: number
  end: number
  int: number
  fai: number
  arc: number
  hiddenStr: number
  hiddenDex: number
  hiddenEnd: number
  hiddenInt: number
  hiddenFai: number
  hiddenArc: number
  prefix: string
  prestigeCount: number
  isReborn: boolean
  missionRecord: string
  trophyAchieved: string
  streakData: string
  context: string
}

/** localStorageから全セーブデータを収集してクラウド用ペイロードに変換 */
function buildPayloadFromLocalStorage(): CloudSavePayload {
  const getJson = (key: string, fallback: unknown) => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }

  const status = getJson(PLAYER_STATUS_KEY, {})
  const stats = status?.stats ?? {}
  const hiddenExp = status?.hiddenExp ?? {}
  const context = status?.context ?? {}
  const streakData = getJson(STREAK_KEY, {})

  return {
    level: Number(status?.level) || 1,
    currentExp: Number(status?.exp) || 0,
    str: Number(stats?.str) || 10,
    dex: Number(stats?.dex) || 10,
    end: Number(stats?.end) || 10,
    int: Number(stats?.int) || 10,
    fai: Number(stats?.fai) || 10,
    arc: Number(stats?.arc) || 10,
    hiddenStr: Number(hiddenExp?.str) || 0,
    hiddenDex: Number(hiddenExp?.dex) || 0,
    hiddenEnd: Number(hiddenExp?.end) || 0,
    hiddenInt: Number(hiddenExp?.int) || 0,
    hiddenFai: Number(hiddenExp?.fai) || 0,
    hiddenArc: Number(hiddenExp?.arc) || 0,
    prefix: typeof status?.prefix === 'string' ? status.prefix : '',
    prestigeCount: Number(status?.prestigeCount) || 0,
    isReborn: localStorage.getItem(REBORN_KEY) === 'true',
    missionRecord: localStorage.getItem(MISSION_RECORD_KEY) ?? '[]',
    trophyAchieved: localStorage.getItem(TROPHY_KEY) ?? '[]',
    streakData: JSON.stringify(streakData),
    context: JSON.stringify(context),
  }
}

/** クラウドデータをlocalStorageに書き込む */
function applyCloudDataToLocalStorage(data: CloudSavePayload): void {
  const status = {
    level: data.level,
    exp: data.currentExp,
    prefix: data.prefix,
    prestigeCount: data.prestigeCount,
    stats: {
      str: data.str,
      dex: data.dex,
      end: data.end,
      int: data.int,
      fai: data.fai,
      arc: data.arc,
    },
    hiddenExp: {
      str: data.hiddenStr,
      dex: data.hiddenDex,
      end: data.hiddenEnd,
      int: data.hiddenInt,
      fai: data.hiddenFai,
      arc: data.hiddenArc,
    },
    context: (() => {
      try { return JSON.parse(data.context) } catch { return {} }
    })(),
  }

  localStorage.setItem(PLAYER_STATUS_KEY, JSON.stringify(status))
  localStorage.setItem(MISSION_RECORD_KEY, data.missionRecord)
  localStorage.setItem(TROPHY_KEY, data.trophyAchieved)
  localStorage.setItem(REBORN_KEY, data.isReborn ? 'true' : 'false')

  try {
    const streakData = JSON.parse(data.streakData)
    if (streakData && typeof streakData === 'object') {
      localStorage.setItem(STREAK_KEY, JSON.stringify(streakData))
    }
  } catch {
    // ignore
  }
}

/** localStorageのデータをクラウドにアップロード */
export async function uploadToCloud(): Promise<boolean> {
  try {
    const payload = buildPayloadFromLocalStorage()
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}

/** クラウドのデータをlocalStorageにダウンロード。データがなければnullを返す */
export async function downloadFromCloud(): Promise<'downloaded' | 'no_data' | 'error'> {
  try {
    const res = await fetch('/api/save')
    if (res.status === 401) return 'error'
    if (!res.ok) return 'error'

    const data = await res.json()
    if (!data || data.error) return 'no_data'

    applyCloudDataToLocalStorage(data as CloudSavePayload)
    return 'downloaded'
  } catch {
    return 'error'
  }
}

/**
 * ログイン直後の同期処理
 * - クラウドにデータがある → ダウンロードして上書き（クラウド優先）
 * - クラウドにデータがない → localStorageをアップロード
 */
export async function syncOnLogin(): Promise<'downloaded' | 'uploaded' | 'error'> {
  try {
    const res = await fetch('/api/save')
    if (!res.ok) return 'error'

    const data = await res.json()

    if (data && !data.error && data.level > 1) {
      applyCloudDataToLocalStorage(data as CloudSavePayload)
      return 'downloaded'
    } else {
      const ok = await uploadToCloud()
      return ok ? 'uploaded' : 'error'
    }
  } catch {
    return 'error'
  }
}
