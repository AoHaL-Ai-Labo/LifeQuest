'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Swords, ScrollText, Award } from 'lucide-react'

/** ボトムタブナビゲーション - 片手操作で親指が届く下部固定、Safe Area対応 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-muted/95 backdrop-blur-sm pb-safe">
      <div className="max-w-2xl mx-auto grid grid-cols-3">
        <Link
          href="/quest"
          className={`flex flex-col items-center justify-center gap-1 py-3 min-h-[44px] font-mono text-xs uppercase ${
            pathname === '/quest'
              ? 'text-[hsl(var(--neon-orange))] bg-[hsl(var(--neon-orange))]/10'
              : 'text-muted-foreground hover:text-foreground active:bg-muted/50'
          }`}
        >
          <Swords className="w-5 h-5 shrink-0" />
          <span>クエスト</span>
        </Link>
        <Link
          href="/history"
          className={`flex flex-col items-center justify-center gap-1 py-3 min-h-[44px] font-mono text-xs uppercase ${
            pathname === '/history'
              ? 'text-[hsl(var(--cyber-blue))] bg-[hsl(var(--cyber-blue))]/10'
              : 'text-muted-foreground hover:text-foreground active:bg-muted/50'
          }`}
        >
          <ScrollText className="w-5 h-5 shrink-0" />
          <span>記録</span>
        </Link>
        <Link
          href="/trophy"
          className={`flex flex-col items-center justify-center gap-1 py-3 min-h-[44px] font-mono text-xs uppercase ${
            pathname === '/trophy'
              ? 'text-[hsl(var(--emergency-red))] bg-[hsl(var(--emergency-red))]/10'
              : 'text-muted-foreground hover:text-foreground active:bg-muted/50'
          }`}
        >
          <Award className="w-5 h-5 shrink-0" />
          <span>Trophy</span>
        </Link>
      </div>
    </nav>
  )
}
