/**
 * 季節判定（JST）。イベントモードのUIテーマに使用。
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** JSTで現在の季節を取得。3-5:春, 6-8:夏, 9-11:秋, 12-2:冬 */
export function getCurrentSeason(): Season {
  const now = new Date()
  const jstStr = now.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo' })
  const month = parseInt(jstStr.split(',')[0]?.split('-')[1] ?? '1', 10)
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

/** 季節の表示名 */
export const SEASON_LABELS: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}
