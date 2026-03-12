import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const saveData = await prisma.saveData.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(saveData)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    level?: number
    currentExp?: number
    str?: number
    dex?: number
    end?: number
    int?: number
    fai?: number
    arc?: number
    hiddenStr?: number
    hiddenDex?: number
    hiddenEnd?: number
    hiddenInt?: number
    hiddenFai?: number
    hiddenArc?: number
    prefix?: string
    prestigeCount?: number
    isReborn?: boolean
    missionRecord?: string
    trophyAchieved?: string
    streakData?: string
    context?: string
  }

  const data = {
    level: body.level ?? 1,
    currentExp: body.currentExp ?? 0,
    str: body.str ?? 10,
    dex: body.dex ?? 10,
    end: body.end ?? 10,
    int: body.int ?? 10,
    fai: body.fai ?? 10,
    arc: body.arc ?? 10,
    hiddenStr: body.hiddenStr ?? 0,
    hiddenDex: body.hiddenDex ?? 0,
    hiddenEnd: body.hiddenEnd ?? 0,
    hiddenInt: body.hiddenInt ?? 0,
    hiddenFai: body.hiddenFai ?? 0,
    hiddenArc: body.hiddenArc ?? 0,
    prefix: body.prefix ?? '',
    prestigeCount: body.prestigeCount ?? 0,
    isReborn: body.isReborn ?? false,
    missionRecord: body.missionRecord ?? '[]',
    trophyAchieved: body.trophyAchieved ?? '[]',
    streakData: body.streakData ?? '{}',
    context: body.context ?? '{}',
  }

  const saveData = await prisma.saveData.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  })

  return NextResponse.json(saveData)
}
