/**
 * Prisma Client シングルトン
 * アプリ全体で共有し、開発時の Hot Reload で複数インスタンス化を防ぐ
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
