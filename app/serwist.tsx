'use client'

import { SerwistProvider } from '@serwist/turbopack/react'

/**
 * 開発時は Service Worker を登録しない（Server Action の "unexpected response" エラー回避）
 * 本番でのみ PWA オフラインキャッシュを有効化
 */
export function SerwistProviderWrapper({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'development') {
    return <>{children}</>
  }
  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
}
