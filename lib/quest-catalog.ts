/**
 * クエストカタログ
 * サーバー: Prisma経由でDBから取得
 * クライアント: APIで取得したデータをキャッシュして同期 lookup
 */
import { prisma } from './prisma'
import type { PrimaryStat, QuestStats } from './quest-types'

export type { PrimaryStat, QuestStats }

/** 期間・難易度フィルタに一致するクエストを抽出 */
function matchesDifficulty(period: string, difficulty: string | undefined, qPeriod: string, qDifficulty: string): boolean {
  if (qPeriod !== period) return false
  if (!difficulty) return true
  if (period === 'weekly') return qDifficulty === 'weekly'
  if (period === 'monthly') return qDifficulty === 'monthly'
  return qDifficulty === difficulty
}

/** statsExp をパースして QuestStats に復元 */
function parseStats(statsExp: string): QuestStats {
  try {
    const parsed = JSON.parse(statsExp) as Record<string, number>
    const n = (v: unknown) => Math.max(0, Number(v) || 0)
    return {
      str: n(parsed.str),
      dex: n(parsed.dex),
      end: n(parsed.end),
      int: n(parsed.int),
      fai: n(parsed.fai),
      arc: n(parsed.arc),
    }
  } catch {
    return { str: 0, dex: 0, end: 0, int: 0, fai: 0, arc: 0 }
  }
}

/** フレーバーテキストから1つをランダム選択 */
function pickFlavorText(flavorTextsJson: string): string {
  try {
    const arr = JSON.parse(flavorTextsJson) as string[]
    if (Array.isArray(arr) && arr.length > 0) {
      return arr[Math.floor(Math.random() * arr.length)] ?? ''
    }
  } catch {
    // ignore
  }
  return ''
}

export interface CatalogQuestItem {
  id: string
  title: string
  description: string
  flavorText: string
  period: string
  difficulty: string
  stats: QuestStats
  primaryStat: PrimaryStat
}

/**
 * DBから期間・難易度に合うクエストをランダムに指定件数取得
 * sampleFixedQuests の代替（サーバー専用）
 */
export async function sampleQuestsFromDb(
  period: 'daily' | 'weekly' | 'monthly',
  count: number,
  difficulty?: string
): Promise<CatalogQuestItem[]> {
  const all = await prisma.quest.findMany()
  const pool = all.filter((q) => !q.id.startsWith('ai-') && matchesDifficulty(period, difficulty, q.period, q.difficulty))
  if (pool.length === 0) return []

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))

  return selected.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description ?? '',
    flavorText: pickFlavorText(q.flavorTexts),
    period: q.period,
    difficulty: q.difficulty,
    stats: parseStats(q.statsExp),
    primaryStat: q.primaryStat as PrimaryStat,
  }))
}

/**
 * タイトルで stats を取得（サーバー専用・Prisma使用）
 */
export async function getQuestStatsByTitleFromDb(title: string): Promise<QuestStats | null> {
  const q = await prisma.quest.findFirst({ where: { title } })
  return q ? parseStats(q.statsExp) : null
}

/**
 * タイトルで primaryStat を取得（サーバー専用・Prisma使用）
 */
export async function getQuestPrimaryStatByTitleFromDb(title: string): Promise<PrimaryStat | null> {
  const q = await prisma.quest.findFirst({ where: { title }, select: { primaryStat: true } })
  return q ? (q.primaryStat as PrimaryStat) : null
}

/**
 * 全クエストカタログを取得（API用・クライアントキャッシュ用）
 */
export async function getFullQuestCatalog(): Promise<
  Array<{ id: string; title: string; description: string; period: string; difficulty: string; stats: QuestStats; primaryStat: PrimaryStat }>
> {
  const all = await prisma.quest.findMany()
  return all.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description ?? '',
    period: q.period,
    difficulty: q.difficulty,
    stats: parseStats(q.statsExp),
    primaryStat: q.primaryStat as PrimaryStat,
  }))
}

// --- クライアント用: キャッシュによる同期 lookup ---

type CachedEntry = { stats: QuestStats; primaryStat: PrimaryStat }
let catalogCache: Map<string, CachedEntry> | null = null

/** API から取得したカタログでキャッシュを初期化（クライアント用） */
export function initializeQuestCatalog(
  quests: Array<{ title: string; stats: QuestStats; primaryStat: PrimaryStat }>
): void {
  const map = new Map<string, CachedEntry>()
  for (const q of quests) {
    map.set(q.title, { stats: q.stats, primaryStat: q.primaryStat })
  }
  catalogCache = map
}

/** タイトルで stats を取得（キャッシュ・同期） */
export function getQuestStatsByTitle(title: string): QuestStats | null {
  const entry = catalogCache?.get(title)
  return entry ? entry.stats : null
}

/** タイトルで primaryStat を取得（キャッシュ・同期） */
export function getQuestPrimaryStatByTitle(title: string): PrimaryStat | null {
  const entry = catalogCache?.get(title)
  return entry ? entry.primaryStat : null
}
