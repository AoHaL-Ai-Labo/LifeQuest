'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Flame, Sword, Crosshair, Shield, Eye, Moon, Circle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hasSaveData, hardResetSaveData } from '@/lib/save-data'
import { loadPlayerStatus, savePlayerStatus, getDisplayRank } from '@/lib/player-status'
import type { PlayerStats } from '@/lib/player-status'
import { getClassFromStats } from '@/lib/user-class'
import { DEBUG_EVENT } from '@/components/debug-panel'
import { completeQuest } from '@/app/actions/userActions'

const CONCEPT_TEXT =
  '新しい体験を手に入れる。人間は慣れる生き物。その場の安定を求め、魂は淀む。コンフォートゾーンから抜け出し、新しい自分を発見せよ。'

const STAT_ORDER = ['str', 'dex', 'end', 'int', 'fai', 'arc'] as const
const STAT_LABELS: Record<(typeof STAT_ORDER)[number], string> = {
  str: '筋力',
  dex: '技量',
  end: '持久力',
  int: '理力',
  fai: '信仰',
  arc: '神秘',
}

const AURA_BY_STAT: Record<(typeof STAT_ORDER)[number], string> = {
  str: 'bg-gradient-to-br from-red-900/40 to-black',
  dex: 'bg-gradient-to-br from-emerald-900/40 to-black',
  end: 'bg-gradient-to-br from-stone-700/40 to-black',
  int: 'bg-gradient-to-br from-blue-900/40 to-black',
  fai: 'bg-gradient-to-br from-yellow-900/40 to-black',
  arc: 'bg-gradient-to-br from-purple-900/40 to-black',
}
const AURA_NONE = 'bg-gradient-to-br from-zinc-800/40 to-black'

const EMBLEM_BY_STAT: Record<(typeof STAT_ORDER)[number], typeof Sword> = {
  str: Sword,
  dex: Crosshair,
  end: Shield,
  int: Eye,
  fai: Flame,
  arc: Moon,
}

const DEFAULT_STATS: PlayerStats = { str: 10, dex: 10, end: 10, int: 10, fai: 10, arc: 10 }

interface UnknownQuest {
  id: string
  title: string
  description: string
  flavorText: string
  difficulty: string
  stats: { str: number; dex: number; end: number; int: number; fai: number; arc: number }
  primaryStat: string
  /** QuestHistory から動的算出（API で付与） */
  isCompleted?: boolean
}

export default function TitlePage() {
  const router = useRouter()
  const [canContinue, setCanContinue] = useState(false)
  const [soulCount, setSoulCount] = useState(0)
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS)
  const [isHovering, setIsHovering] = useState(false)
  const [unknownQuests, setUnknownQuests] = useState<UnknownQuest[]>([])
  const [unknownLoading, setUnknownLoading] = useState(false)
  const [unknownCleared, setUnknownCleared] = useState<Set<string>>(new Set())
  const [unknownCompletingId, setUnknownCompletingId] = useState<string | null>(null)

  useEffect(() => {
    const refresh = () => {
      setCanContinue(hasSaveData())
      try {
        const status = loadPlayerStatus()
        setSoulCount(status.exp)
        setStats(status.stats ?? DEFAULT_STATS)
      } catch {
        setSoulCount(0)
        setStats(DEFAULT_STATS)
      }
    }
    refresh()
    window.addEventListener(DEBUG_EVENT, refresh)
    return () => window.removeEventListener(DEBUG_EVENT, refresh)
  }, [])

  useEffect(() => {
    if (!canContinue) return
    setUnknownLoading(true)
    fetch('/api/quest/unknown')
      .then((r) => (r.ok ? r.json() : { quests: [] }))
      .then((data: { quests?: UnknownQuest[] }) => {
        const quests = data.quests ?? []
        setUnknownQuests(quests)
        setUnknownCleared(new Set(quests.filter((q) => q.isCompleted).map((q) => q.id)))
      })
      .catch(() => setUnknownQuests([]))
      .finally(() => setUnknownLoading(false))
  }, [canContinue])

  const handleUnknownComplete = async (questId: string) => {
    setUnknownCompletingId(questId)
    try {
      const result = await completeQuest(questId)
      if (result.success && result.userData) {
        setUnknownCleared((p) => new Set(p).add(questId))
        savePlayerStatus({
          level: result.userData.level,
          exp: result.userData.currentExp,
          rank: getDisplayRank(result.userData.level),
          prefix: result.userData.prefix,
          prestigeCount: result.userData.prestigeCount,
          stats: result.userData.stats,
          hiddenExp: result.userData.hiddenExp,
        })
        setSoulCount(result.userData.currentExp)
        setStats(result.userData.stats)
        window.dispatchEvent(new CustomEvent(DEBUG_EVENT))
      }
    } finally {
      setUnknownCompletingId(null)
    }
  }

  const handleNewGame = () => {
    hardResetSaveData()
    router.push('/quest')
  }

  const handleContinue = () => {
    if (!canContinue) return
    router.push('/quest')
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-stone-950">
      {/* Background texture overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-30" />

      {/* Falling ash particles */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-stone-400/20"
            style={{
              left: `${(i * 5) % 100}%`,
              top: `-${(i * 4) % 20}%`,
              animation: `ash-fall ${10 + (i % 20)}s linear infinite`,
              animationDelay: `${(i % 10)}s`,
            }}
          />
        ))}
      </div>

      {/* Soul count - top right (when canContinue) */}
      {canContinue && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-sm border border-stone-700 bg-stone-900/90 px-4 py-2 backdrop-blur-sm">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-mono text-lg font-semibold text-stone-200">
            {soulCount}
          </span>
          <span className="text-xs text-stone-500">EXP</span>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        {/* Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1
            className="font-serif text-4xl font-bold tracking-wider text-stone-300 md:text-5xl"
            style={{
              textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
              fontVariant: 'small-caps',
              letterSpacing: '0.15em',
            }}
          >
            LIFE QUEST
          </h1>
          <p
            className="font-serif text-base tracking-widest text-stone-500 md:text-lg"
            style={{
              textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
              letterSpacing: '0.25em',
            }}
          >
            灰の試練
          </p>
          <p className="mt-2 max-w-md text-center font-serif text-sm italic leading-relaxed text-stone-600">
            {CONCEPT_TEXT}
          </p>

          {/* 特化称号（クラス名） */}
          {canContinue && (() => {
            const classResult = getClassFromStats(stats)
            const EmblemIcon = classResult.dominantStatForIcon ? EMBLEM_BY_STAT[classResult.dominantStatForIcon] : Circle
            return (
            <div
              className="mt-4 flex items-center justify-center gap-2 font-serif text-xl font-bold tracking-widest md:text-2xl"
              style={{
                color: 'rgba(180, 150, 100, 0.95)',
                textShadow: '0 0 16px rgba(180, 140, 90, 0.3), 1px 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              <EmblemIcon className="w-8 h-8 text-white shrink-0" />
              <span>{classResult.userClass}</span>
              <EmblemIcon className="w-8 h-8 text-white shrink-0" />
            </div>
            )
          })()}
        </div>

        {/* Cold Altar / Bonfire */}
        <div className="relative">
          <div
            className={`relative h-80 w-80 transition-all duration-700 md:h-96 md:w-96 ${
              isHovering ? 'scale-105' : 'scale-100'
            }`}
          >
            {/* Altar image */}
            <div className="relative h-full w-full overflow-hidden rounded-sm">
              <Image
                src="/altar.jpg"
                alt="Cold Altar"
                fill
                className="object-cover opacity-70"
                priority
                sizes="(max-width: 768px) 320px, 384px"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />
            </div>

            {/* Glow effect on hover */}
            {isHovering && (
              <>
                <div
                  className="absolute inset-0 animate-pulse rounded-sm"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)',
                    animationDuration: '2s',
                  }}
                />
                {/* Sparks */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-orange-500"
                    style={{
                      left: `${45 + (i % 10)}%`,
                      top: `${45 + (i % 10)}%`,
                      animation: `title-spark ${1 + (i % 3) * 0.5}s ease-out infinite`,
                      animationDelay: `${(i % 2)}s`,
                      boxShadow: '0 0 4px rgba(249, 115, 22, 0.8)',
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Ambient glow base */}
          <div
            className={`absolute inset-0 -z-10 blur-3xl transition-opacity duration-700 ${
              isHovering ? 'opacity-60' : 'opacity-20'
            }`}
            style={{
              background:
                'radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* 6ステータスパネル（石板風・テキストのみ・称号オーラ・透かし紋章） */}
        {canContinue && (() => {
          const classResult = getClassFromStats(stats)
          const dominant = classResult.dominantStatForIcon
          const auraClass = dominant ? AURA_BY_STAT[dominant] : AURA_NONE
          return (
          <div
            className={`relative overflow-hidden w-full max-w-xs rounded-sm border border-stone-700/80 px-6 py-4 transition-colors duration-1000 ${auraClass}`}
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            <div className="relative z-10">
            <div className="mb-3 border-b border-stone-600/50 pb-1 font-serif text-xs tracking-[0.3em] text-stone-500">
              ステータス
            </div>
            <div className="space-y-1.5 font-serif text-sm">
              {STAT_ORDER.map((key) => (
                <div
                  key={key}
                  className="flex justify-between border-b border-stone-700/40 pb-1.5"
                  style={{
                    color: 'rgba(160, 140, 100, 0.9)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                  }}
                >
                  <span className="tracking-wider">{STAT_LABELS[key]}</span>
                  <span
                    className="font-bold tabular-nums"
                    style={{
                      color: 'rgba(200, 175, 130, 0.95)',
                      textShadow: '0 0 6px rgba(180, 150, 100, 0.2)',
                    }}
                  >
                    {stats[key] ?? 10}
                  </span>
                </div>
              ))}
            </div>
            </div>
          </div>
          )
        })()}

        {/* 未知の試練（AI生成） */}
        {canContinue && (
          <div className="w-full max-w-md rounded-sm border border-stone-700/80 bg-stone-900/50 px-4 py-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2 border-b border-stone-600/50 pb-2 font-serif text-sm tracking-widest text-stone-400">
              <Sparkles className="h-4 w-4 text-amber-500/80" />
              未知の試練（AI生成）
            </div>
            {unknownLoading ? (
              <p className="py-4 text-center font-serif text-sm text-stone-500">試練を照らす…</p>
            ) : unknownQuests.length > 0 ? (
              <div className="space-y-3">
                {unknownQuests.map((q) => (
                  <div
                    key={q.id}
                    className={`rounded border px-3 py-2 ${
                      unknownCleared.has(q.id)
                        ? 'border-stone-600/40 bg-stone-800/30 opacity-70'
                        : 'border-stone-600/60 bg-stone-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-serif text-sm font-bold text-stone-200">{q.title}</div>
                        <div className="mt-0.5 text-xs text-stone-500">{q.description}</div>
                        {q.flavorText && (
                          <p className="mt-1 text-[10px] italic leading-relaxed text-stone-600">{q.flavorText}</p>
                        )}
                      </div>
                      {!unknownCleared.has(q.id) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 border-stone-600 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
                          onClick={() => void handleUnknownComplete(q.id)}
                          disabled={!!unknownCompletingId}
                        >
                          {unknownCompletingId === q.id ? '処理中...' : '達成'}
                        </Button>
                      ) : (
                        <span className="shrink-0 text-xs text-amber-600/90">達成済</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            className="group relative overflow-hidden rounded-sm border-2 border-orange-900/50 bg-stone-900 px-12 py-6 font-serif text-lg tracking-wider text-stone-300 transition-all duration-300 hover:border-orange-700 hover:bg-orange-950/50 hover:text-orange-200"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={handleNewGame}
          >
            {/* Ember glow effect */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background:
                  'radial-gradient(circle at center, rgba(249, 115, 22, 0.3) 0%, transparent 70%)',
              }}
            />
            <span className="relative z-10 flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  isHovering
                    ? 'animate-pulse bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                    : 'bg-orange-900/50'
                }`}
              />
              New Game
              <span className="text-sm">火を焚べる</span>
            </span>
          </Button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="font-mono text-sm tracking-wider text-stone-600 transition-colors hover:text-stone-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
            <span className="ml-2 text-xs">継続</span>
          </button>
        </div>
      </div>

      {/* Vignette effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.6) 100%)',
        }}
      />
    </div>
  )
}
