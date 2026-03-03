/**
 * クエスト完了状態の動的算出（QuestHistory を Single Source of Truth とするバッチレス設計）
 * リセット境界日時は JST（Asia/Tokyo）で算出し、DB の UTC と比較する
 */
import { prisma } from './prisma'

/** JST の現在日付文字列 (YYYY-MM-DD) を取得 */
function getJSTDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })
}

/** JST (y,m,d) 00:00:00 を UTC の Date に変換（Prisma DateTime 比較用） */
function jstMidnightToUTC(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d - 1, 15, 0, 0, 0))
}

/**
 * リセット境界日時を算出（JST 基準、UTC で返却）
 * - startOfToday: 今日 00:00:00 JST
 * - startOfWeek: 今週月曜 00:00:00 JST（週の始まりを月曜とする）
 * - startOfMonth: 今月1日 00:00:00 JST
 */
export function getResetBoundaries(): {
  startOfToday: Date
  startOfWeek: Date
  startOfMonth: Date
} {
  const jstStr = getJSTDateString()
  const [y, m, d] = jstStr.split('-').map(Number)

  const startOfToday = jstMidnightToUTC(y, m, d)

  const jstMidnight = jstMidnightToUTC(y, m, d)
  const jstDayOfWeek = new Date(jstMidnight.getTime() + 9 * 60 * 60 * 1000).getUTCDay()
  const daysSinceMonday = (jstDayOfWeek - 1 + 7) % 7
  const mondayTimestamp = jstMidnight.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000
  const mondayInJST = new Date(mondayTimestamp + 9 * 60 * 60 * 1000)
  const startOfWeek = jstMidnightToUTC(
    mondayInJST.getUTCFullYear(),
    mondayInJST.getUTCMonth() + 1,
    mondayInJST.getUTCDate()
  )

  const startOfMonth = jstMidnightToUTC(y, m, 1)

  return { startOfToday, startOfWeek, startOfMonth }
}

/** クエストIDのプレフィックスから期間を判定 */
function getPeriodFromQuestId(questId: string): 'daily' | 'weekly' | 'monthly' | null {
  if (questId.startsWith('d_') || questId.startsWith('ai-')) return 'daily'
  if (questId.startsWith('w_')) return 'weekly'
  if (questId.startsWith('m_')) return 'monthly'
  return null
}

/**
 * 指定クエストIDのうち、現在期間内に完了済みのものを返す
 * QuestHistory を都度検索して動的計算
 */
export async function getCompletedQuestIds(
  questIds: string[]
): Promise<Set<string>> {
  if (questIds.length === 0) return new Set()

  const { startOfToday, startOfWeek, startOfMonth } = getResetBoundaries()
  const oldestBoundary = startOfMonth

  const histories = await prisma.questHistory.findMany({
    where: {
      questId: { in: questIds },
      completedAt: { gte: oldestBoundary },
    },
    select: { questId: true, completedAt: true },
    orderBy: { completedAt: 'desc' },
  })

  const completed = new Set<string>()
  for (const h of histories) {
    const period = getPeriodFromQuestId(h.questId)
    if (!period) continue
    const boundary =
      period === 'daily'
        ? startOfToday
        : period === 'weekly'
          ? startOfWeek
          : startOfMonth
    if (h.completedAt >= boundary) {
      completed.add(h.questId)
    }
  }
  return completed
}

/**
 * クエストID → 完了状態のマップを返す（UI 用）
 */
export async function getQuestCompletionStatus(
  questIds: string[]
): Promise<Record<string, boolean>> {
  const completed = await getCompletedQuestIds(questIds)
  return Object.fromEntries(questIds.map((id) => [id, completed.has(id)]))
}
