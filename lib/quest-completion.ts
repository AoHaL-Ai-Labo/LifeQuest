/**
 * クエスト完了状態の動的算出（QuestHistory を Single Source of Truth とするバッチレス設計）
 * リセット境界日時は必ず日本時間（Asia/Tokyo）の深夜0時を基準に算出。
 * Vercel等のUTC環境でも正しく動作するよう、明示的にAsia/Tokyoで計算する。
 */
import { prisma } from './prisma'

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 現在の日本時間の日付文字列 (YYYY-MM-DD) を取得
 * toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' }) でUTC環境でも正しくJST日付を取得
 */
function getJSTDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' })
}

/**
 * 日本時間 (y,m,d) 00:00:00 を UTC の Date に変換
 * JST = UTC+9 のため、JST 00:00 = UTC 前日 15:00
 * Prisma の DateTime は DB で UTC として保存されるため、比較用に UTC Date を返す
 */
function jstMidnightToUTC(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d - 1, 15, 0, 0, 0))
}

/**
 * 日本時間での曜日を取得（0=日, 1=月, ..., 6=土）
 * 12:00 UTC の時点で JST は 21:00 同日となるため、その getUTCDay() で正しい JST 曜日を得られる
 */
function getJSTDayOfWeek(y: number, m: number, d: number): number {
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
  return utcNoon.getUTCDay()
}

/**
 * リセット境界日時を算出（日本時間 Asia/Tokyo 基準、UTC Date で返却）
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

  const jstDayOfWeek = getJSTDayOfWeek(y, m, d)
  const daysSinceMonday = (jstDayOfWeek - 1 + 7) % 7
  const mondayTimestamp = startOfToday.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000
  const mondayPlusOffset = new Date(mondayTimestamp + JST_OFFSET_MS)
  const mY = mondayPlusOffset.getUTCFullYear()
  const mM = mondayPlusOffset.getUTCMonth() + 1
  const mD = mondayPlusOffset.getUTCDate()
  const startOfWeek = jstMidnightToUTC(mY, mM, mD)

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
