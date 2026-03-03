'use server'

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
