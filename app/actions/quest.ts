'use server'

import { prisma } from '@/lib/prisma'
import { getQuestCompletionStatus as getCompletionStatus } from '@/lib/quest-completion'

/**
 * QuestHistory から現在期間内の完了状態を動的算出
 * バッチレス設計：Cron ではなく都度計算
 */
export async function getQuestCompletionStatus(
  questIds: string[]
): Promise<Record<string, boolean>> {
  return getCompletionStatus(questIds)
}

/**
 * デバッグ用: QuestHistory を全件削除（クエスト履歴リセット時にサーバー側もクリア）
 */
export async function clearQuestHistoryForDebug(): Promise<{ success: boolean; deleted: number }> {
  try {
    const result = await prisma.questHistory.deleteMany({})
    return { success: true, deleted: result.count }
  } catch (err) {
    console.error('[clearQuestHistoryForDebug]', err)
    return { success: false, deleted: 0 }
  }
}
