'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { loadPlayerStatus } from '@/lib/player-status'
import { isReborn } from '@/lib/reborn'
import { hardResetSaveData } from '@/lib/save-data'
import { DEBUG_EVENT } from '@/components/debug-panel'
import type { PlayerStatus } from '@/lib/player-status'

export default function SettingsPage() {
  const router = useRouter()
  const [status, setStatus] = useState<PlayerStatus | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    const refresh = () => setStatus(loadPlayerStatus())
    refresh()
    window.addEventListener(DEBUG_EVENT, refresh)
    return () => window.removeEventListener(DEBUG_EVENT, refresh)
  }, [])

  const handleHardReset = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    hardResetSaveData()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-lg backdrop-blur-sm">
          <Link href="/quest">
            <Button variant="ghost" size="icon" className="hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground">
            設定
          </h1>
          <div className="w-10" />
        </header>

        <Card className="p-5 space-y-4 border border-border bg-muted/30">
          <h2 className="font-mono text-xs uppercase text-muted-foreground tracking-wider">
            現在のステータス
          </h2>
          {status && (
            <div className="space-y-2 font-mono text-sm">
              <p>
                <span className="text-muted-foreground">レベル:</span>{' '}
                <span className="text-[hsl(var(--neon-orange))]">{status.level}</span>
              </p>
              <p>
                <span className="text-muted-foreground">階位・二つ名:</span>{' '}
                <span className="text-[hsl(var(--cyber-blue))]">
                  {status.prefix ? `【${status.prefix}】 ${status.rank}` : status.rank}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">{isReborn() ? '業' : 'EXP'}:</span> {status.exp} / {status.expToNext}
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5 space-y-4 border border-border bg-muted/30">
          <h2 className="font-mono text-xs uppercase text-muted-foreground tracking-wider">
            セーブデータ
          </h2>
          <p className="text-sm text-muted-foreground">
            全データ（レベル・称号・クエスト・ミッション記録）を削除し、タイトル画面に戻ります。
          </p>
          <Button
            variant="outline"
            size="sm"
            className="font-mono border-[hsl(var(--emergency-red))] text-[hsl(var(--emergency-red))] hover:bg-[hsl(var(--emergency-red))]/10"
            onClick={handleHardReset}
          >
            {confirmReset ? '本当にリセット（タイトルへ）' : 'ハードリセット'}
          </Button>
          {confirmReset && (
            <Button variant="ghost" size="sm" className="font-mono" onClick={() => setConfirmReset(false)}>
              キャンセル
            </Button>
          )}
        </Card>
      </div>
    </div>
  )
}
