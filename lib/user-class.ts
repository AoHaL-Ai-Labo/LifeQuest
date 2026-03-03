/**
 * 称号（クラス名）判定ロジック
 * 最大値が複数同点の場合に複合称号を動的生成する
 */
import type { PlayerStats } from './player-status'

export const STAT_KEYS = ['str', 'dex', 'end', 'int', 'fai', 'arc'] as const
export type StatKey = (typeof STAT_KEYS)[number]

/** 複合称号用キーワード（2つ・3つ同値時の連結に使用） */
export const STAT_KEYWORDS: Record<StatKey, string> = {
  str: '剛腕',
  dex: '技巧',
  end: '不屈',
  int: '叡智',
  fai: '信仰',
  arc: '神秘',
}

/** 単一ステータス時の称号 */
export const CLASS_BY_STAT: Record<StatKey, string> = {
  str: '歪みし剛腕の灰',
  dex: '影を歩む技量の灰',
  end: '不朽なる持久の灰',
  int: '深淵を覗く魔術の灰',
  fai: '沈黙を誓う祈祷の灰',
  arc: '未知に触れし神秘の灰',
}

/** 最大値を持つ全ステータスを配列で返す */
export function getMaxStats(stats: PlayerStats): StatKey[] {
  const vals = STAT_KEYS.map((k) => stats[k] ?? 10)
  const maxVal = Math.max(...vals)
  return STAT_KEYS.filter((k) => (stats[k] ?? 10) === maxVal)
}

export interface ClassResult {
  /** 表示する称号文字列 */
  userClass: string
  /** アイコン表示用。複数同値の場合は先頭、6つ同値の場合は null */
  dominantStatForIcon: StatKey | null
}

/**
 * ステータスから称号を動的生成する
 */
export function getClassFromStats(stats: PlayerStats): ClassResult {
  const maxStats = getMaxStats(stats)
  const count = maxStats.length
  const baseVal = stats[maxStats[0]] ?? 10

  if (count === 6) {
    if (baseVal <= 10) {
      return { userClass: '持たざる灰', dominantStatForIcon: null }
    }
    return { userClass: '超越せし万能の灰', dominantStatForIcon: null }
  }

  if (count === 1) {
    return {
      userClass: CLASS_BY_STAT[maxStats[0]],
      dominantStatForIcon: maxStats[0],
    }
  }

  if (count === 2) {
    const k1 = STAT_KEYWORDS[maxStats[0]]
    const k2 = STAT_KEYWORDS[maxStats[1]]
    return {
      userClass: `${k1}と${k2}の灰`,
      dominantStatForIcon: maxStats[0],
    }
  }

  if (count === 3) {
    const keywords = maxStats.map((k) => STAT_KEYWORDS[k])
    return {
      userClass: `${keywords[0]}・${keywords[1]}・${keywords[2]}の灰`,
      dominantStatForIcon: maxStats[0],
    }
  }

  if (count === 4 || count === 5) {
    return {
      userClass: '混沌なる多才の灰',
      dominantStatForIcon: maxStats[0],
    }
  }

  return { userClass: '持たざる灰', dominantStatForIcon: null }
}
