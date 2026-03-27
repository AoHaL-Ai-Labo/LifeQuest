'use client'

import { useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { DebugPanel } from './debug-panel'
import { SingularityModal } from './singularity-modal'
import { Toaster } from '@/components/ui/sonner'
import { isReborn } from '@/lib/reborn'
import { getCurrentSeason } from '@/lib/season'
import { getDeveloperMode } from '@/lib/developer-mode'

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [developerMode, setDeveloperModeState] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDeveloperModeState(getDeveloperMode())
    const onChange = () => setDeveloperModeState(getDeveloperMode())
    window.addEventListener('developer-mode-change', onChange as EventListener)
    return () => window.removeEventListener('developer-mode-change', onChange as EventListener)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isReborn()) {
      document.documentElement.classList.add('theme-reborn')
      document.documentElement.removeAttribute('data-season')
    } else {
      document.documentElement.classList.remove('theme-reborn')
      document.documentElement.setAttribute('data-season', getCurrentSeason())
    }
  }, [])

  return (
    <SessionProvider>
      {children}
      {developerMode && <DebugPanel />}
      <SingularityModal />
      <Toaster theme="dark" />
    </SessionProvider>
  )
}
