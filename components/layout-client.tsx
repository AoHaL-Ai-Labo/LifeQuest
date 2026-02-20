'use client'

import { useEffect } from 'react'
import { DebugPanel } from './debug-panel'
import { SingularityModal } from './singularity-modal'
import { Toaster } from '@/components/ui/sonner'
import { isReborn } from '@/lib/reborn'
import { getCurrentSeason } from '@/lib/season'

export function LayoutClient({ children }: { children: React.ReactNode }) {
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
    <>
      {children}
      <DebugPanel />
      <SingularityModal />
      <Toaster theme="dark" />
    </>
  )
}
