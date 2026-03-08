import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const saveData = await prisma.saveData.findMany({
      orderBy: { createdAt: 'asc' },
    })
    const questHistoryCount = await prisma.questHistory.count()
    const recentHistory = await prisma.questHistory.findMany({
      orderBy: { completedAt: 'desc' },
      take: 20,
    })
    return NextResponse.json({
      saveDataCount: saveData.length,
      saveData,
      questHistoryCount,
      recentHistory,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const deleted = await prisma.saveData.deleteMany({})
    const deletedHistory = await prisma.questHistory.deleteMany({})
    return NextResponse.json({
      success: true,
      deletedSaveData: deleted.count,
      deletedHistory: deletedHistory.count,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
