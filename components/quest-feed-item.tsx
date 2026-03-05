'use client'

import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import { Sword, Zap, Shield, BookOpen, Heart, Sparkles, Feather, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { PrimaryStat } from '@/lib/quest-types'
import type { QuestStats } from '@/lib/quest-types'

/** primaryStat ごとのアイコンとテーマカラー */
const STAT_CONFIG: Record<
  PrimaryStat,
  { icon: React.ComponentType<{ className?: string }>; label: string; colorClass: string; borderClass: string; bgClass: string }
> = {
  str: {
    icon: Sword,
    label: '筋力',
    colorClass: 'text-red-400',
    borderClass: 'border-red-500/60',
    bgClass: 'bg-red-950/50',
  },
  dex: {
    icon: Zap,
    label: '技量',
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/60',
    bgClass: 'bg-emerald-950/50',
  },
  end: {
    icon: Shield,
    label: '持久力',
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/60',
    bgClass: 'bg-amber-950/50',
  },
  int: {
    icon: BookOpen,
    label: '理力',
    colorClass: 'text-blue-400',
    borderClass: 'border-blue-500/60',
    bgClass: 'bg-blue-950/50',
  },
  fai: {
    icon: Heart,
    label: '信仰',
    colorClass: 'text-pink-400',
    borderClass: 'border-pink-500/60',
    bgClass: 'bg-pink-950/50',
  },
  arc: {
    icon: Sparkles,
    label: '神秘',
    colorClass: 'text-indigo-400',
    borderClass: 'border-indigo-500/60',
    bgClass: 'bg-indigo-950/50',
  },
}

const DEFAULT_STAT_CONFIG = STAT_CONFIG.str

function getStatConfig(primaryStat: PrimaryStat | null) {
  return primaryStat ? STAT_CONFIG[primaryStat] ?? DEFAULT_STAT_CONFIG : DEFAULT_STAT_CONFIG
}

function getPrimaryStatValue(stats: QuestStats | null | undefined, primaryStat: PrimaryStat | null): number {
  if (!stats || !primaryStat) return 0
  return stats[primaryStat] ?? 0
}

export interface QuestFeedItemProps {
  id: string
  title: string
  badge: string
  badgeColor: string
  /** @deprecated アコーディオン廃止のため未使用。後方互換で残す */
  isExpanded?: boolean
  /** @deprecated アコーディオン廃止のため未使用。後方互換で残す */
  onToggle?: () => void
  flavorText?: string
  description?: string
  isCleared: boolean
  clearedMessage?: string
  reflection?: string
  onReflectionChange?: (v: string) => void
  onSubmit?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  onReroll?: () => void
  canReroll?: boolean
  /** 右スワイプで完了（Todoist風）。未指定時はボタンのみ */
  onSwipeComplete?: () => void
  /** 獲得EXP（バッジ表示用） */
  expGain?: number
  /** 主属性（アイコン・カラー用） */
  primaryStat?: PrimaryStat | null
  /** ステータス加算値（バッジ表示用） */
  stats?: QuestStats | null
}

export function QuestFeedItem({
  id,
  title,
  badge,
  badgeColor,
  isExpanded: _isExpanded,
  onToggle: _onToggle,
  flavorText,
  description,
  isCleared,
  clearedMessage,
  reflection = '',
  onReflectionChange,
  onSubmit,
  isSubmitting,
  submitLabel = '報告を提出',
  onReroll,
  canReroll,
  onSwipeComplete,
  expGain = 0,
  primaryStat = null,
  stats,
}: QuestFeedItemProps) {
  const statConfig = getStatConfig(primaryStat)
  const StatIcon = statConfig.icon
  const primaryStatValue = getPrimaryStatValue(stats, primaryStat)
  const hasStats = primaryStatValue > 0 || expGain > 0
  const [swipeOffset, setSwipeOffset] = useState(0)
  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (!onSwipeComplete || isCleared) return
      if (e.deltaX > 0) setSwipeOffset(Math.min(e.deltaX, 80))
    },
    onSwiped: () => setSwipeOffset(0),
    onSwipedRight: () => {
      if (onSwipeComplete && !isCleared) onSwipeComplete()
    },
    delta: 50,
    trackTouch: true,
    preventDefaultTouchmoveEvent: false,
  })
  const canSwipe = !!onSwipeComplete && !isCleared

  return (
    <div
      {...(canSwipe ? handlers : {})}
      className={`relative overflow-hidden rounded-md border-l-4 transition-all duration-200 ${
        isCleared ? 'opacity-75' : ''
      } ${statConfig.borderClass} ${statConfig.bgClass} border border-stone-700/60 bg-stone-950/80 shadow-md`}
    >
      {/* スワイプ時に左から表示する「完了」インジケータ（Todoist風） */}
      {canSwipe && (
        <div className="absolute inset-y-0 left-0 w-16 flex flex-col items-center justify-center gap-0.5 bg-emerald-600/90 text-white rounded-l" style={{ opacity: swipeOffset > 10 ? 1 : 0 }}>
          <Check className="w-6 h-6" />
          <span className="text-[10px] font-mono">完了</span>
        </div>
      )}
      <div
        className="relative z-10 rounded-md transition-shadow"
        style={swipeOffset > 0 ? { transform: `translateX(${swipeOffset}px)` } : undefined}
      >
      {/* ギルドボード風：カードヘッダー */}
      <div className="flex items-start gap-2 p-3">
        <div className={`mt-0.5 shrink-0 rounded p-1 ${statConfig.bgClass} ${statConfig.colorClass}`}>
          <StatIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-mono text-sm font-semibold ${isCleared ? 'text-stone-500 line-through' : 'text-stone-200'}`}>
              {title}
            </h3>
            <span className={`shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded border ${badgeColor}`}>
              {badge}
            </span>
          </div>
          {/* description を表面に表示（line-clamp-2） */}
          {description && (
            <p className={`mt-1.5 text-xs leading-relaxed line-clamp-2 ${isCleared ? 'text-stone-600' : 'text-stone-400'}`}>
              {description}
            </p>
          )}
          {/* EXP・ステータスバッジ */}
          {hasStats && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {expGain > 0 && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-600/40">
                  +{expGain} EXP
                </span>
              )}
              {primaryStatValue > 0 && primaryStat && (
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded border ${statConfig.bgClass} ${statConfig.colorClass} ${statConfig.borderClass}`}
                >
                  <StatIcon className="h-3 w-3" />
                  {statConfig.label} +{primaryStatValue}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* flavorText（控えめに） */}
      {flavorText && (
        <blockquote className="mx-3 mb-2 text-[10px] italic text-stone-600 border-l-2 border-stone-600/40 pl-2 py-0.5">
          {flavorText}
        </blockquote>
      )}

      {/* クリア済みメッセージ */}
      {isCleared && clearedMessage && (
        <div className="mx-3 mb-3 px-2 py-1.5 rounded bg-stone-800/30">
          <p className="text-xs italic text-stone-500">「{clearedMessage}」</p>
        </div>
      )}

      {/* 未クリア：報告入力・送信 */}
      {!isCleared && (
        <div className="border-t border-stone-700/50 bg-stone-900/30 px-3 py-3 space-y-2">
          {canReroll && onReroll && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-stone-500 hover:text-stone-300" onClick={onReroll}>
              代替案を求める
            </Button>
          )}
          {onReflectionChange && onSubmit && (
            <>
              <Textarea
                placeholder="記憶に刻み込め。外へ放つ言葉だけが、汝を成長させる。短くとも可。"
                value={reflection}
                onChange={(e) => onReflectionChange(e.target.value)}
                className="min-h-[48px] font-mono text-xs resize-none py-2 border-stone-700 bg-stone-950/80 focus-visible:border-amber-600/60 focus-visible:ring-amber-600/30 placeholder:text-stone-600"
                disabled={isSubmitting}
              />
              <Button
                size="sm"
                className="w-full font-mono text-xs min-h-[44px] min-w-[44px] py-3 gap-1.5 bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600/50 touch-manipulation"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                <Feather className="w-3.5 h-3.5" />
                {isSubmitting ? '送信中...' : submitLabel}
              </Button>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
