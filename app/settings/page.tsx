'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, signOut, useSession } from 'next-auth/react'
import { ArrowLeft, Cloud, CloudOff, LogIn, LogOut, RefreshCw, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { loadPlayerStatus } from '@/lib/player-status'
import { isReborn } from '@/lib/reborn'
import { hardResetSaveData } from '@/lib/save-data'
import { getDeveloperMode, setDeveloperMode } from '@/lib/developer-mode'
import { DEBUG_EVENT } from '@/components/debug-panel'
import { hardResetServerData } from '@/app/actions/quest'
import { uploadToCloud, syncOnLogin } from '@/lib/cloud-save'
import type { PlayerStatus } from '@/lib/player-status'

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  google: { label: 'Google', color: 'text-blue-400' },
  discord: { label: 'Discord', color: 'text-indigo-400' },
  twitter: { label: 'X (Twitter)', color: 'text-sky-400' },
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [developerMode, setDeveloperModeState] = useState(false)
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [hasSynced, setHasSynced] = useState(false)

  useEffect(() => {
    const refresh = () => setPlayerStatus(loadPlayerStatus())
    refresh()
    window.addEventListener(DEBUG_EVENT, refresh)
    return () => window.removeEventListener(DEBUG_EVENT, refresh)
  }, [])

  useEffect(() => {
    setDeveloperModeState(getDeveloperMode())
    const onChange = () => setDeveloperModeState(getDeveloperMode())
    window.addEventListener('developer-mode-change', onChange as EventListener)
    return () => window.removeEventListener('developer-mode-change', onChange as EventListener)
  }, [])

  // ログイン時に自動同期（初回のみ）
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !hasSynced) {
      setHasSynced(true)
      setSyncState('syncing')
      syncOnLogin().then((result) => {
        setSyncState(result === 'error' ? 'error' : 'success')
        if (result !== 'error') {
          setLastSyncedAt(new Date())
          setPlayerStatus(loadPlayerStatus())
        }
      })
    }
  }, [sessionStatus, hasSynced])

  const handleManualSync = useCallback(async () => {
    if (syncState === 'syncing') return
    setSyncState('syncing')
    const ok = await uploadToCloud()
    setSyncState(ok ? 'success' : 'error')
    if (ok) setLastSyncedAt(new Date())
  }, [syncState])

  const handleHardReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    await hardResetServerData()
    hardResetSaveData()
    router.push('/')
  }

  const syncIcon = syncState === 'syncing'
    ? <RefreshCw className="w-4 h-4 animate-spin" />
    : syncState === 'success'
    ? <Cloud className="w-4 h-4 text-emerald-400" />
    : syncState === 'error'
    ? <CloudOff className="w-4 h-4 text-red-400" />
    : <Cloud className="w-4 h-4" />

  const providerKey = session?.user?.provider ?? 'google'

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

        {/* 現在のステータス */}
        <Card className="p-5 space-y-4 border border-border bg-muted/30">
          <h2 className="font-mono text-xs uppercase text-muted-foreground tracking-wider">
            現在のステータス
          </h2>
          {playerStatus && (
            <div className="space-y-2 font-mono text-sm">
              <p>
                <span className="text-muted-foreground">レベル:</span>{' '}
                <span className="text-[hsl(var(--neon-orange))]">{playerStatus.level}</span>
              </p>
              <p>
                <span className="text-muted-foreground">階位・二つ名:</span>{' '}
                <span className="text-[hsl(var(--cyber-blue))]">
                  {playerStatus.prefix ? `【${playerStatus.prefix}】 ${playerStatus.rank}` : playerStatus.rank}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">{isReborn() ? '業' : 'EXP'}:</span> {playerStatus.exp} / {playerStatus.expToNext}
              </p>
            </div>
          )}
        </Card>

        {/* アカウント連携・クラウドセーブ */}
        <Card className="p-5 space-y-4 border border-border bg-muted/30">
          <h2 className="font-mono text-xs uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5" />
            クラウドセーブ
          </h2>

          {sessionStatus === 'loading' && (
            <p className="text-sm text-muted-foreground font-mono animate-pulse">確認中...</p>
          )}

          {sessionStatus === 'unauthenticated' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                アカウントでログインすると、セーブデータが複数のデバイスで同期されます。
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-mono border-border hover:bg-muted justify-start gap-2"
                  onClick={() => signIn('google')}
                >
                  <LogIn className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">Google</span>
                  <span className="text-muted-foreground ml-auto text-xs">でログイン</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-mono border-border hover:bg-muted justify-start gap-2"
                  onClick={() => signIn('discord')}
                >
                  <LogIn className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-400">Discord</span>
                  <span className="text-muted-foreground ml-auto text-xs">でログイン</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-mono border-border hover:bg-muted justify-start gap-2"
                  onClick={() => signIn('twitter')}
                >
                  <LogIn className="w-4 h-4 text-sky-400" />
                  <span className="text-sky-400">X (Twitter)</span>
                  <span className="text-muted-foreground ml-auto text-xs">でログイン</span>
                </Button>
              </div>
            </div>
          )}

          {sessionStatus === 'authenticated' && session && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm truncate">{session.user?.name ?? '名無し'}</p>
                  <p className={`font-mono text-xs ${PROVIDER_LABELS[providerKey]?.color ?? 'text-muted-foreground'}`}>
                    {PROVIDER_LABELS[providerKey]?.label ?? 'アカウント'} でログイン中
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono border-border hover:bg-muted flex items-center gap-2"
                  onClick={handleManualSync}
                  disabled={syncState === 'syncing'}
                >
                  {syncIcon}
                  {syncState === 'syncing' ? '同期中...' : '今すぐ同期'}
                </Button>
                {lastSyncedAt && (
                  <span className="text-xs text-muted-foreground font-mono">
                    最終同期: {lastSyncedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {syncState === 'success' && (
                <p className="text-xs text-emerald-400 font-mono">同期完了</p>
              )}
              {syncState === 'error' && (
                <p className="text-xs text-red-400 font-mono">同期に失敗しました</p>
              )}

              <div className="pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-muted-foreground hover:text-foreground flex items-center gap-2"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* セーブデータ */}
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

        {process.env.NODE_ENV === 'development' && (
          <Card className="p-5 space-y-4 border border-border bg-muted/30">
            <h2 className="font-mono text-xs uppercase text-muted-foreground tracking-wider">
              開発者向け
            </h2>
            <p className="text-sm text-muted-foreground">
              デバッグパネル（Lv+1、Mock API、リセット等）の表示を切り替えます。
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={developerMode}
                onCheckedChange={(checked) => {
                  setDeveloperMode(checked)
                  setDeveloperModeState(checked)
                }}
              />
              <span className="font-mono text-sm">開発者モード</span>
            </label>
          </Card>
        )}
      </div>
    </div>
  )
}
