'use client'

import { useState, useEffect } from 'react'
import { Award, CheckCircle2, Feather } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  TROPHY_LIST,
  getAchievedTrophyIds,
  markTrophyAchieved,
  type TrophyItem,
} from '@/lib/trophy'
import { getMockApiEnabled, mockDelay, mockTrophyJudge } from '@/lib/mock-api'

export default function TrophyPage() {
  const [achievedIds, setAchievedIds] = useState<string[]>([])
  const [judgeModal, setJudgeModal] = useState<TrophyItem | null>(null)
  const [episodeInput, setEpisodeInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [judgeError, setJudgeError] = useState<string | null>(null)

  useEffect(() => {
    setAchievedIds(getAchievedTrophyIds())
  }, [])

  const handleOpenJudge = (item: TrophyItem) => {
    if (achievedIds.includes(item.id)) return
    setJudgeModal(item)
    setEpisodeInput('')
    setJudgeError(null)
  }

  const handleSubmitJudge = async () => {
    if (!judgeModal) return
    const episode = episodeInput.trim()
    if (episode.length < 10) {
      setJudgeError('少なくとも10文字以上、達成の熱量を刻んでください。')
      return
    }
    setIsSubmitting(true)
    setJudgeError(null)
    try {
      let result: { success: boolean; message: string }
      if (getMockApiEnabled()) {
        result = await mockDelay(mockTrophyJudge(episode))
      } else {
        const res = await fetch('/api/trophy-judge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ episode, trophyTitle: judgeModal.title }),
        })
        const data = await res.json().catch(() => ({}))
        result = { success: !!data.success, message: data.message || '審査の炎が消え入った…' }
      }
      if (result.success) {
        markTrophyAchieved(judgeModal.id)
        setAchievedIds((p) => [...p, judgeModal.id])
        setJudgeModal(null)
      } else {
        setJudgeError(result.message)
      }
    } catch (err) {
      setJudgeError(err instanceof Error ? err.message : '審査に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 pt-4 pb-nav-safe">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="p-4 bg-muted/50 border border-border rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[hsl(var(--neon-orange))]" />
            <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground">
              特級（Trophy）— 人生の実績
            </h1>
          </div>
          <p className="mt-2 text-xs text-muted-foreground/80 font-mono">
            期限なき、一度限りの大いなる試練。達成すれば、特別なバッジと称号が解放される。
          </p>
        </header>

        <div className="space-y-3">
          <h3 className="font-mono text-sm uppercase text-muted-foreground tracking-wider">
            実績一覧
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {TROPHY_LIST.map((item) => {
              const achieved = achievedIds.includes(item.id)
              return (
                <Card
                  key={item.id}
                  className={`relative overflow-hidden p-5 transition-all border-2 ${
                    achieved
                      ? 'border-[hsl(var(--neon-orange))] bg-[hsl(var(--neon-orange))]/5 shadow-[0_0_20px_hsl(var(--neon-orange)/0.2)]'
                      : 'border-border bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  {achieved && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-6 h-6 text-[hsl(var(--neon-orange))]" />
                    </div>
                  )}
                  <h4
                    className={`font-mono text-base font-bold ${
                      achieved ? 'text-[hsl(var(--neon-orange))]' : 'text-foreground'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  {achieved ? (
                    <div className="mt-4 space-y-1">
                      <p className="font-mono text-xs uppercase text-[hsl(var(--neon-orange))]">
                        ✓ バッジ解放: {item.badge}
                      </p>
                      {item.titleUnlock && (
                        <p className="font-mono text-xs text-muted-foreground">
                          称号: {item.titleUnlock}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleOpenJudge(item)}
                      size="sm"
                      className="mt-4 w-full font-mono gap-2"
                      style={{
                        backgroundColor: 'hsl(var(--neon-orange))',
                        color: 'hsl(var(--background))',
                      }}
                    >
                      <Award className="w-4 h-4" />
                      達成を報告する
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      <BottomNav />

      {/* 審査モーダル（AI Gatekeeper） */}
      {judgeModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !isSubmitting && setJudgeModal(null)}
        >
          <div
            className="relative max-w-md w-full p-6 rounded-lg border-2 bg-background/95 float-up border-red-900/80"
            style={{ boxShadow: '0 0 40px rgba(127, 29, 29, 0.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-xs uppercase text-muted-foreground mb-2">{judgeModal.title} — 達成報告</p>
            <p className="text-sm text-muted-foreground mb-3">貴公の偉業、その熱量をここに刻め…</p>
            <Textarea
              placeholder="記憶に刻み込め。外へ放つ言葉だけが、汝を成長させる。短くとも可。"
              value={episodeInput}
              onChange={(e) => setEpisodeInput(e.target.value)}
              className="min-h-[120px] font-mono text-sm resize-none mb-4 border-red-900/50 bg-stone-950/50 focus-visible:border-red-800 focus-visible:ring-red-800/50 placeholder:text-stone-600"
              disabled={isSubmitting}
            />
            {judgeError && (
              <p className="text-sm text-[hsl(var(--emergency-red))] mb-3 font-mono italic">「{judgeError}」</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 font-mono"
                onClick={() => !isSubmitting && setJudgeModal(null)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                className="flex-1 font-mono gap-2 bg-red-900 hover:bg-red-800 text-stone-100 border-0"
                onClick={handleSubmitJudge}
                disabled={isSubmitting}
              >
                <Feather className="w-4 h-4" />
                {isSubmitting ? '審査中...' : '誓約を果たす'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
