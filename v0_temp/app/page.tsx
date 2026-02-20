'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Sword, Flame, Skull, Brain, Target, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const missions = {
  beginner: [
    { id: 1, title: '瞑想', desc: '5分間の瞑想', souls: 10, status: 'active', image: '/images/meditation.jpg' },
    { id: 2, title: '水分補給', desc: 'コップ8杯の水', souls: 8, status: 'active', image: '/images/water.jpg' },
    { id: 3, title: '歩行', desc: '7000歩', souls: 12, status: 'completed', image: '/images/walking.jpg' },
  ],
  intermediate: [
    { id: 4, title: '読書', desc: '30分間の読書', souls: 20, status: 'active', image: '/images/reading.jpg' },
    { id: 5, title: '運動', desc: '筋トレ20分', souls: 25, status: 'active', image: '/images/exercise.jpg' },
    { id: 6, title: 'コード', desc: '1時間の学習', souls: 30, status: 'failed', image: '/images/coding.jpg' },
  ],
  advanced: [
    { id: 7, title: 'プロジェクト', desc: '重要案件2時間', souls: 50, status: 'active', image: '/images/project.jpg' },
    { id: 8, title: '断食', desc: '16時間断食', souls: 40, status: 'active', image: '/images/fasting.jpg' },
  ],
}

export default function Page() {
  const [soulCount, setSoulCount] = useState(2847)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2 rounded-sm border border-slate-800 bg-slate-900 px-4 py-2">
              <Flame className="h-5 w-5 text-red-500" />
              <span className="font-mono text-lg font-semibold text-slate-100">
                {soulCount}
              </span>
              <span className="text-xs text-slate-500">SOULS</span>
            </div>
          </div>
        </header>

        {/* Soul Core Area - Placeholder */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-slate-400">
              <Skull className="h-4 w-4" />
              Soul Core
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-slate-500">設計中...</p>
            </div>
          </CardContent>
        </Card>

        {/* Fog Wall Area */}
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
                  <div className="text-sm text-slate-400">
                    全ミッションクリアで深淵へ
                  </div>
                </div>
                <Button
                  className="mt-6 w-full rounded-sm border border-red-900 bg-red-950/50 text-red-100 hover:bg-red-900/50"
                  size="lg"
                >
                  <Sword className="mr-2 h-4 w-4" />
                  戦術開始
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mission List */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-slate-400">
              <Brain className="h-4 w-4" />
              Tactical Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* Beginner Section */}
              <div className="mb-4 border-l-2 border-slate-600 pl-3">
                <div className="mb-2 font-mono text-xs uppercase tracking-wider text-slate-500">
                  初級作戦 - Steel Tier
                </div>
                {missions.beginner.map((mission) => (
                  <AccordionItem
                    key={mission.id}
                    value={`mission-${mission.id}`}
                    className="border-b border-slate-800"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full items-center justify-between pr-4 text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              mission.status === 'completed'
                                ? 'bg-slate-500'
                                : mission.status === 'failed'
                                  ? 'bg-slate-700'
                                  : 'bg-slate-400'
                            }`}
                          />
                          <span className="text-sm font-medium text-slate-200">
                            {mission.title}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-slate-500">
                          +{mission.souls} souls
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-5 pr-4 pb-2">
                        <div className="relative h-32 w-full overflow-hidden rounded-sm">
                          <Image
                            src={mission.image}
                            alt={mission.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm text-slate-400">{mission.desc}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-sm border-slate-700 text-xs"
                          >
                            完了
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-sm text-xs text-slate-500"
                          >
                            詳細
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>

              {/* Intermediate Section */}
              <div className="mb-4 border-l-2 border-amber-700 pl-3">
                <div className="mb-2 font-mono text-xs uppercase tracking-wider text-amber-700">
                  中級作戦 - Amber Tier
                </div>
                {missions.intermediate.map((mission) => (
                  <AccordionItem
                    key={mission.id}
                    value={`mission-${mission.id}`}
                    className="border-b border-slate-800"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full items-center justify-between pr-4 text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              mission.status === 'completed'
                                ? 'bg-amber-500'
                                : mission.status === 'failed'
                                  ? 'bg-amber-900'
                                  : 'bg-amber-600'
                            }`}
                          />
                          <span className="text-sm font-medium text-slate-200">
                            {mission.title}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-amber-700">
                          +{mission.souls} souls
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-5 pr-4 pb-2">
                        <div className="relative h-32 w-full overflow-hidden rounded-sm">
                          <Image
                            src={mission.image}
                            alt={mission.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm text-slate-400">{mission.desc}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-sm border-amber-700 text-xs"
                          >
                            完了
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-sm text-xs text-slate-500"
                          >
                            詳細
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>

              {/* Advanced Section */}
              <div className="border-l-2 border-red-800 pl-3">
                <div className="mb-2 font-mono text-xs uppercase tracking-wider text-red-700">
                  上級作戦 - Blood Tier
                </div>
                {missions.advanced.map((mission) => (
                  <AccordionItem
                    key={mission.id}
                    value={`mission-${mission.id}`}
                    className="border-b border-slate-800 last:border-b-0"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full items-center justify-between pr-4 text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              mission.status === 'completed'
                                ? 'bg-red-500'
                                : mission.status === 'failed'
                                  ? 'bg-red-950'
                                  : 'bg-red-600'
                            }`}
                          />
                          <span className="text-sm font-medium text-slate-200">
                            {mission.title}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-red-700">
                          +{mission.souls} souls
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-5 pr-4 pb-2">
                        <div className="relative h-32 w-full overflow-hidden rounded-sm">
                          <Image
                            src={mission.image}
                            alt={mission.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="text-sm text-slate-400">{mission.desc}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-sm border-red-800 text-xs"
                          >
                            完了
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-sm text-xs text-slate-500"
                          >
                            詳細
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-10px) scale(1.2);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  )
}
