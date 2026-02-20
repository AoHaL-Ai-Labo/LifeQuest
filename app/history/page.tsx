'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Swords, ScrollText, Award, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getMissionRecord } from '@/lib/mission-record'
import type { MissionRecordItem } from '@/lib/mission-record'

export default function HistoryPage() {
  const pathname = usePathname()
  const [records, setRecords] = useState<MissionRecordItem[]>([])

  useEffect(() => {
    setRecords(getMissionRecord())
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 pt-16 pb-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="p-4 bg-muted/50 border border-border rounded-lg backdrop-blur-sm">
          <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground">
            ミッション記録
          </h1>
        </header>

        {records.length === 0 ? (
          <Card className="p-12 text-center space-y-2 border-dashed">
            <p className="font-mono text-muted-foreground">まだクリアしたクエストがありません</p>
            <p className="text-sm text-muted-foreground/80">デイリークエストをクリアするとここに記録されます</p>
            <Link href="/quest">
              <Button variant="outline" size="sm" className="mt-4 font-mono">
                クエストへ
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            <h3 className="font-mono text-sm uppercase text-muted-foreground tracking-wider">
              クリア履歴
            </h3>
            <div className="space-y-3">
              {[...records].reverse().map((item, i) => (
                <Card
                  key={`${item.questTitle}-${item.clearedAt}-${i}`}
                  className="p-4 bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <h4 className="font-mono text-sm font-semibold text-foreground">
                        {item.questTitle}
                      </h4>
                      {item.reflection && (
                        <p className="text-xs text-muted-foreground">
                          あなたの感想: 「{item.reflection}」
                        </p>
                      )}
                      <blockquote className="text-sm italic text-muted-foreground/90 border-l-2 border-[hsl(var(--cyber-blue))] pl-3 py-1">
                        「{item.clearMessage}」
                      </blockquote>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-muted/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto grid grid-cols-3">
          <Link href="/quest" className={`flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase ${pathname === '/quest' ? 'text-[hsl(var(--neon-orange))] bg-[hsl(var(--neon-orange))]/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <Swords className="w-4 h-4" /> クエスト
          </Link>
          <Link href="/history" className={`flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase ${pathname === '/history' ? 'text-[hsl(var(--cyber-blue))] bg-[hsl(var(--cyber-blue))]/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <ScrollText className="w-4 h-4" /> 記録
          </Link>
          <Link href="/trophy" className={`flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase ${pathname === '/trophy' ? 'text-[hsl(var(--emergency-red))] bg-[hsl(var(--emergency-red))]/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <Award className="w-4 h-4" /> Trophy
          </Link>
        </div>
      </nav>
    </div>
  )
}
