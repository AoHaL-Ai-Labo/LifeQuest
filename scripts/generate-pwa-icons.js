/**
 * PWA用プレースホルダーアイコン生成
 * 実行: node scripts/generate-pwa-icons.js
 * 後で実際の画像に差し替えてください
 */
const fs = require('fs')
const path = require('path')

// 最小限の有効なPNG (1x1 グレー) を192x192/512x512用に繰り返し
// base64 の 67 bytes PNG (1x1 transparent)
const base1x1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const buf = Buffer.from(base1x1, 'base64')
const publicDir = path.join(__dirname, '..', 'public')
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

// 1x1 をそのまま使う（スケールはブラウザに任せる）
fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), buf)
fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), buf)
console.log('PWA placeholder icons created: icon-192x192.png, icon-512x512.png')
console.log('※後で適切な画像に差し替えてください')
