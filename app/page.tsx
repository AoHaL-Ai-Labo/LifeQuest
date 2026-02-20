'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, Sword, Skull, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { hasSaveData, hardResetSaveData } from '@/lib/save-data'
import { loadPlayerStatus } from '@/lib/player-status'
import { DEBUG_EVENT } from '@/components/debug-panel'

const CONCEPT_TEXT =
  '新しい体験を手に入れる。人間は慣れる生き物。その場の安定を求め、魂は淀む。コンフォートゾーンから抜け出し、新しい自分を発見せよ。'

export default function TitlePage() {
  const router = useRouter()
  const [canContinue, setCanContinue] = useState(false)
  const [soulCount, setSoulCount] = useState(0)

  useEffect(() => {
    const refresh = () => {
      setCanContinue(hasSaveData())
      try {
        const status = loadPlayerStatus()
        setSoulCount(status.exp)
      } catch {
        setSoulCount(0)
      }
    }
    refresh()
    window.addEventListener(DEBUG_EVENT, refresh)
    return () => window.removeEventListener(DEBUG_EVENT, refresh)
  }, [])

  const handleNewGame = () => {
    hardResetSaveData()
    router.push('/quest')
  }

  const handleContinue = () => {
    if (!canContinue) return
    router.push('/quest')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-end">
            {canContinue && (
              <div className="flex items-center gap-2 rounded-sm border border-slate-800 bg-slate-900 px-4 py-2">
                <Flame className="h-5 w-5 text-red-500" />
                <span className="font-mono text-lg font-semibold text-slate-100">
                  {soulCount}
                </span>
                <span className="text-xs text-slate-500">EXP</span>
              </div>
            )}
          </div>
        </header>

        {/* Soul Core Area */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-slate-400">
              <Skull className="h-4 w-4" />
              Soul Core
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 pulse-glow">
                <Flame className="w-12 h-12 text-[hsl(var(--neon-orange))]" />
              </div>
              <h1 className="ml-3 font-mono text-2xl md:text-3xl font-bold tracking-wider text-foreground">
                LIFE QUEST
              </h1>
            </div>
          </CardContent>
        </Card>

        {/* Fog Wall - Main CTA */}
        <Card className="border-red-900/50 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-red-400">
              <Target className="h-4 w-4" />
              Fog Wall - 特異点の門
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-full max-w-md rounded-none border-2 border-red-900/50 bg-slate-950 p-6">
                <div className="space-y-2 text-center">
                  <div className="font-mono text-xs uppercase tracking-widest text-red-500">
                    WARNING
                  </div>
                  <div className="font-serif text-xl font-bold text-slate-200">
                    今日の挑戦
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed italic">
                    {CONCEPT_TEXT}
                  </p>
                </div>
                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    onClick={handleNewGame}
                    className="w-full rounded-sm border border-red-900 bg-red-950/50 text-red-100 hover:bg-red-900/50"
                    size="lg"
                  >
                    <Sword className="mr-2 h-4 w-4" />
                    戦術開始 (New Game)
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!canContinue}
                    className="w-full rounded-sm border border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
