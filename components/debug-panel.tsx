'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SINGULARITY_FORCE_EVENT } from './singularity-modal'
import {
  loadPlayerStatus,
  savePlayerStatus,
  addExpAndLevelUp,
  setLevelForDebug,
} from '@/lib/player-status'
import { hardResetSaveData } from '@/lib/save-data'
import { getMockApiEnabled, setMockApiEnabled } from '@/lib/mock-api'

const DEBUG_EVENT = 'quest-debug-update'

function dispatchDebugUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEBUG_EVENT))
  }
}

export function DebugPanel() {
  const router = useRouter()
  const [mockApiEnabled, setMockApiEnabledState] = useState(true)
  useEffect(() => {
    setMockApiEnabledState(getMockApiEnabled())
    const onUpdate = () => setMockApiEnabledState(getMockApiEnabled())
    window.addEventListener(DEBUG_EVENT, onUpdate)
    return () => window.removeEventListener(DEBUG_EVENT, onUpdate)
  }, [])

  const handleLvPlus1 = () => {
    const current = loadPlayerStatus()
    if (current.level >= 99) return
    const { newStatus } = addExpAndLevelUp(current, current.expToNext)
    savePlayerStatus(newStatus)
    console.log('[Debug: Cheat] Lv+1 applied', { level: newStatus.level, rank: newStatus.rank })
    dispatchDebugUpdate()
  }

  const handleSetLevel = (level: number) => {
    const newStatus = setLevelForDebug(level)
    console.log('[Debug: Cheat] Level set', { level: newStatus.level, rank: newStatus.rank })
    dispatchDebugUpdate()
  }

  const handleReset = () => {
    hardResetSaveData()
    console.log('[Debug: Cheat] Full reset to Lv.1')
    dispatchDebugUpdate()
    router.push('/')
  }

  const handleMockApiToggle = (checked: boolean) => {
    setMockApiEnabled(checked)
    setMockApiEnabledState(checked)
    console.log('[Debug] Mock API', checked ? 'ON' : 'OFF')
    dispatchDebugUpdate()
  }

  const handleForceSingularity = () => {
    window.dispatchEvent(new CustomEvent(SINGULARITY_FORCE_EVENT))
    console.log('[Debug] 特異点強制発動')
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-1 rounded-lg border border-border bg-background/70 backdrop-blur-sm p-1.5 font-mono text-[10px]"
      aria-label="デバッグパネル"
    >
      <div className="text-muted-foreground px-1 pb-0.5 text-[9px] uppercase">Debug</div>
      <label className="flex items-center gap-2 px-1 py-0.5 cursor-pointer hover:bg-muted/50 rounded">
        <Switch checked={mockApiEnabled} onCheckedChange={handleMockApiToggle} className="scale-75 origin-left" />
        <span className="text-[9px] text-foreground">Mock API (開発用)</span>
      </label>
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" className="h-6 px-2 text-[9px]" onClick={handleLvPlus1}>
          Lv+1
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[9px]" onClick={() => handleSetLevel(20)}>
          Lv.20
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[9px]" onClick={() => handleSetLevel(50)}>
          Lv.50
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[9px]" onClick={() => handleSetLevel(99)}>
          Lv.99
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[9px] text-destructive hover:text-destructive" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[9px] text-red-500 hover:text-red-400" onClick={handleForceSingularity} title="クエストページで発動">
          特異点強制発動
        </Button>
      </div>
    </div>
  )
}

export { DEBUG_EVENT }
