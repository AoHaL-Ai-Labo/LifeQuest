import { NextResponse } from 'next/server'
import { getFullQuestCatalog } from '@/lib/quest-catalog'

export const dynamic = 'force-dynamic'

/**
 * GET /api/quest/catalog
 * 全クエストカタログを返す（クライアントのキャッシュ初期化用）
 */
export async function GET() {
  try {
    const catalog = await getFullQuestCatalog()
    return NextResponse.json(catalog)
  } catch (error) {
    console.error('Quest catalog fetch error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'カタログの取得に失敗しました', detail: message },
      { status: 500 }
    )
  }
}
