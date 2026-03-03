/**
 * クエスト関連の共有型定義
 * fixedQuests / quest-catalog / API で共通利用
 */
export type QuestPeriod = 'daily' | 'weekly' | 'monthly'
export type QuestDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'weekly' | 'monthly'
export type PrimaryStat = 'str' | 'dex' | 'end' | 'int' | 'fai' | 'arc'

/** ステータス: ダークソウル風6属性 */
export interface QuestStats {
  str: number
  dex: number
  end: number
  int: number
  fai: number
  arc: number
}
