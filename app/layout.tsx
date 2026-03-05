import type { Metadata, Viewport } from 'next'

/** クエスト一覧の日付リセット対応：キャッシュを無効化し常に動的レンダリング */
export const dynamic = 'force-dynamic'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import { LayoutClient } from '@/components/layout-client'
import { SerwistProviderWrapper } from './serwist'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'ライフクエスト - 混沌ミッショントラッカー',
  description: 'あなたのタクティカル・リアルライフRPGクエストトラッカー',
  generator: 'v0.app',
  applicationName: 'ライフクエスト',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ライフクエスト',
  },
  icons: {
    apple: '/icon-192x192.png',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#1c1917',
  width: 'device-width',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <SerwistProviderWrapper>
          <LayoutClient>{children}</LayoutClient>
        </SerwistProviderWrapper>
      </body>
    </html>
  )
}
