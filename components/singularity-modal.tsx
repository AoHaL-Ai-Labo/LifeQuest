'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Feather } from 'lucide-react'
import { toast } from 'sonner'
import {
  loadSingularityState,
  saveSingularityState,
  getSingularityEndTime,
  isWithinTimeLimit,
  createTimedOutState,
  clearSingularity,
  getSingularityExpReward,
  SINGULARITY_SPECIAL_TITLE,
} from '@/lib/singularity'
import {
  loadPlayerStatus,
  savePlayerStatus,
  addExpAndLevelUp,
  updatePrefix,
  getExpPerQuestClear,
  pushClearHistory,
} from '@/lib/player-status'
import { getMockApiEnabled, mockDelay, MOCK_SINGULARITY_QUEST } from '@/lib/mock-api'
import { pushMissionRecord } from '@/lib/mission-record'

export const SINGULARITY_FORCE_EVENT = 'singularity-force-trigger'
export const SINGULARITY_TRIGGER_EVENT = 'singularity-trigger'
export const SINGULARITY_FLED_EVENT = 'singularity-fled'
export const SINGULARITY_OPEN_EVENT = 'singularity-open'
export const SINGULARITY_RETURNED_EVENT = 'singularity-returned'

export interface SingularityTriggerPayload {
  pendingClearModal: { message: string; questTitle: string; leveledUp?: boolean; newLevel?: number } | null
  sourcePeriod?: 'daily' | 'weekly' | 'monthly'
  sourceDifficulty?: 'beginner' | 'intermediate' | 'advanced' | 'abyss'
}

export function SingularityModal() {
  const [phase, setPhase] = useState<'hidden' | 'choice' | 'active' | 'timeout' | 'cleared'>('hidden')
  const [payload, setPayload] = useState<SingularityTriggerPayload | null>(null)
  const [quest, setQuest] = useState<{ title: string; description: string; flavorText?: string } | null>(null)
  const [endTimeMs, setEndTimeMs] = useState<number | null>(null)
  const [remainingSec, setRemainingSec] = useState<number | null>(null)
  const [minimalStep, setMinimalStep] = useState<{ title: string; description: string } | null>(null)
  const [reflection, setReflection] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const closeAndClear = useCallback(() => {
    clearSingularity()
    setPhase('hidden')
    setPayload(null)
    setQuest(null)
    setEndTimeMs(null)
    setRemainingSec(null)
    setMinimalStep(null)
    setReflection('')
  }, [])

  /** モーダルを非表示にするだけで状態は保持（クエスト画面に戻る） */
  const hideAndKeepState = useCallback(() => {
    setPhase('hidden')
    window.dispatchEvent(new CustomEvent(SINGULARITY_RETURNED_EVENT))
  }, [])

  // タイマー更新
  useEffect(() => {
    if (phase !== 'active' || !endTimeMs) return
    const tick = () => {
      if (!isWithinTimeLimit(endTimeMs!)) {
        const state = loadSingularityState()
        const updated = createTimedOutState(state)
        setMinimalStep(updated.minimalStep)
        setPhase('timeout')
        setRemainingSec(0)
      } else {
        setRemainingSec(Math.max(0, Math.floor((endTimeMs! - Date.now()) / 1000)))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [phase, endTimeMs])

  // 既存の特異点状態を復元（リロード時）
  useEffect(() => {
    const state = loadSingularityState()
    if (state.quest && state.endTimeMs) {
      if (state.minimalCleared) {
        closeAndClear()
        return
      }
      if (state.isTimedOut && state.minimalStep) {
        setQuest(null)
        setMinimalStep(state.minimalStep)
        setPhase('timeout')
      } else {
        setQuest(state.quest)
        setEndTimeMs(state.endTimeMs)
        setPhase(isWithinTimeLimit(state.endTimeMs) ? 'active' : 'timeout')
        if (!isWithinTimeLimit(state.endTimeMs) && !state.minimalStep) {
          const updated = createTimedOutState(state)
          setMinimalStep(updated.minimalStep)
        }
      }
    }
  }, [closeAndClear])

  // イベントリスナー
  useEffect(() => {
    const onForce = () => {
      setPayload({ pendingClearModal: null })
      setPhase('choice')
    }
    const onTrigger = (e: CustomEvent<SingularityTriggerPayload>) => {
      setPayload(e.detail)
      setPhase('choice')
    }
    const onOpen = () => {
      const state = loadSingularityState()
      if (state.quest && state.endTimeMs && !state.minimalCleared) {
        if (state.isTimedOut && state.minimalStep) {
          setQuest(null)
          setMinimalStep(state.minimalStep)
          setPhase('timeout')
        } else {
          setQuest(state.quest)
          setEndTimeMs(state.endTimeMs)
          setPhase(isWithinTimeLimit(state.endTimeMs) ? 'active' : 'timeout')
          if (!isWithinTimeLimit(state.endTimeMs) && !state.minimalStep) {
            const updated = createTimedOutState(state)
            setMinimalStep(updated.minimalStep)
          }
        }
      }
    }
    window.addEventListener(SINGULARITY_FORCE_EVENT, onForce as EventListener)
    window.addEventListener(SINGULARITY_TRIGGER_EVENT, onTrigger as EventListener)
    window.addEventListener(SINGULARITY_OPEN_EVENT, onOpen as EventListener)
    return () => {
      window.removeEventListener(SINGULARITY_FORCE_EVENT, onForce as EventListener)
      window.removeEventListener(SINGULARITY_TRIGGER_EVENT, onTrigger as EventListener)
      window.removeEventListener(SINGULARITY_OPEN_EVENT, onOpen as EventListener)
    }
  }, [])

  const handleFlee = () => {
    toast('……そうか。ならば泥濘（でいでい）を歩み続けるが良い', {
      duration: 4000,
      className: 'font-mono text-sm',
    })
    const p = payload
    closeAndClear()
    window.dispatchEvent(new CustomEvent(SINGULARITY_FLED_EVENT, { detail: p }))
  }

  /** クエスト画面に戻る（choice時はFLEDを発火してクリアモーダル表示、受諾後は状態保持） */
  const handleReturnToQuest = () => {
    if (phase === 'choice') {
      const p = payload
      closeAndClear()
      window.dispatchEvent(new CustomEvent(SINGULARITY_FLED_EVENT, { detail: p }))
    } else {
      hideAndKeepState()
    }
  }

  const handleAccept = async () => {
    setIsFetching(true)
    try {
      let q: { title: string; description: string; flavorText?: string }
      if (getMockApiEnabled()) {
        q = await mockDelay(MOCK_SINGULARITY_QUEST)
      } else {
        const res = await fetch('/api/quest/singularity', { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data as { detail?: string }).detail ?? 'API error')
        const quests = (data as { quests?: Array<{ title: string; description: string; flavorText?: string }> }).quests
        if (!quests?.length) throw new Error('Invalid format')
        q = quests[0]
      }
      const endMs = getSingularityEndTime()
      setQuest(q)
      setEndTimeMs(endMs)
      saveSingularityState({
        quest: q,
        endTimeMs: endMs,
        isTimedOut: false,
        minimalStep: null,
        minimalCleared: false,
      })
      setPhase('active')
    } catch (err) {
      console.error('[Singularity] fetch failed', err)
      toast.error('特異点クエストの取得に失敗しました')
    } finally {
      setIsFetching(false)
    }
  }

  const handleCompleteInTime = async () => {
    if (!reflection.trim() || !quest) return
    setIsSubmitting(true)
    try {
      const msg = '特異点を征した。貴公の一歩は、日常を超えた。'
      pushMissionRecord({ questTitle: quest.title, reflection, clearMessage: msg })
      const status = loadPlayerStatus()
      const period = payload?.sourcePeriod ?? 'daily'
      const difficulty = payload?.sourceDifficulty ?? 'beginner'
      const baseExp = getExpPerQuestClear(status.level, period, difficulty)
      const expGain = getSingularityExpReward(baseExp)
      const { newStatus } = addExpAndLevelUp(status, expGain)
      pushClearHistory(quest.title)
      savePlayerStatus(newStatus)
      updatePrefix(SINGULARITY_SPECIAL_TITLE)
      setPhase('cleared')
      window.dispatchEvent(new CustomEvent('quest-debug-update'))
      setTimeout(closeAndClear, 2500)
    } catch (err) {
      console.error('[Singularity] complete failed', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMinimalComplete = () => {
    const state = loadSingularityState()
    saveSingularityState({ ...state, minimalCleared: true })
    closeAndClear()
    window.dispatchEvent(new CustomEvent('quest-debug-update'))
  }

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (phase === 'hidden') return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95"
      style={{
        backgroundImage: `radial-gradient(ellipse at center, rgba(120,0,0,0.15) 0%, transparent 70%),
                          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`,
      }}
    >
      {/* 赤黒ノイズオーバーレイ */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-black/50 pointer-events-none" />

      <div
        className="relative max-w-md w-full rounded-lg border-2 border-red-900/80 bg-black/90 p-6 shadow-[0_0_60px_rgba(127,0,0,0.3)] float-up"
        style={{ boxShadow: '0 0 80px rgba(120,0,0,0.2), inset 0 0 60px rgba(0,0,0,0.5)' }}
      >
        {phase === 'choice' && (
          <div className="space-y-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-red-500/90">
              【警告：特異点を観測。日常の崩壊が始まります】
            </p>
            <p className="text-red-200/80 text-sm leading-relaxed">
              3時間の制限時間を持つ緊急ミッションが発動した。今すぐ、一切の準備なしで実行できるが、心理的摩擦が極めて強い行動が課される。
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleAccept}
                disabled={isFetching}
                className="w-full font-mono font-bold bg-red-900 hover:bg-red-800 text-red-100 border border-red-700"
              >
                {isFetching ? '特異点を受信中...' : '受諾する'}
              </Button>
              <Button
                variant="outline"
                onClick={handleFlee}
                disabled={isFetching}
                className="w-full font-mono border-red-900/60 text-red-200/80 hover:bg-red-950/30"
              >
                今は逃げる
              </Button>
              <button
                type="button"
                onClick={handleReturnToQuest}
                disabled={isFetching}
                className="text-xs text-slate-500 hover:text-slate-400 font-mono mt-2"
              >
                クエスト画面に戻る
              </button>
            </div>
          </div>
        )}

        {(phase === 'active' || phase === 'cleared') && quest && (
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase text-red-500/90">特異点 — 緊急ミッション（3時間制限）</p>
            <h3 className="font-mono text-lg font-bold text-red-400">{quest.title}</h3>
            <p className="text-muted-foreground text-sm">{quest.description}</p>
            {remainingSec !== null && phase === 'active' && (
              <div className="font-mono text-2xl font-bold text-red-500 tabular-nums">
                {formatTime(remainingSec)}
              </div>
            )}
            {phase === 'active' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="記憶に刻み込め。外へ放つ言葉だけが、汝を成長させる。短くとも可。"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="min-h-[60px] font-mono text-sm resize-none bg-stone-950/50 border-red-900/50 focus-visible:border-red-800 focus-visible:ring-red-800/50 placeholder:text-stone-600"
                  disabled={isSubmitting}
                />
                <Button
                  onClick={handleCompleteInTime}
                  disabled={!reflection.trim() || isSubmitting}
                  className="w-full font-mono gap-2 bg-red-900 hover:bg-red-800 text-red-100"
                >
                  <Feather className="w-4 h-4" />
                  {isSubmitting ? '送信中...' : '誓約を果たす'}
                </Button>
                <button
                  type="button"
                  onClick={handleReturnToQuest}
                  className="text-xs text-slate-500 hover:text-slate-400 font-mono mt-2 block w-full"
                >
                  クエスト画面に戻る
                </button>
              </div>
            )}
            {phase === 'cleared' && (
              <p className="font-mono text-sm text-red-300/90">莫大な業を獲得した。特別な二つ名が解禁された。</p>
            )}
          </div>
        )}

        {phase === 'timeout' && (
          <div className="space-y-4">
            <p className="font-mono text-sm text-red-400/90 italic">
              その重圧に潰されたか。顔を洗い、またLv.1の日常から積み上げよ
            </p>
            {minimalStep && (
              <>
                <h3 className="font-mono text-lg font-bold text-muted-foreground">{minimalStep.title}</h3>
                <p className="text-muted-foreground text-sm">{minimalStep.description}</p>
                <Button onClick={handleMinimalComplete} className="w-full font-mono bg-muted hover:bg-muted/80">
                  完了する
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={handleReturnToQuest}
              className="text-xs text-slate-500 hover:text-slate-400 font-mono mt-2 block w-full"
            >
              クエスト画面に戻る
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
