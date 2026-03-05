'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getMissionRecord } from '@/lib/mission-record'
import type { MissionRecordItem } from '@/lib/mission-record'

export default function HistoryPage() {
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

      <BottomNav />
    </div>
  )
}
