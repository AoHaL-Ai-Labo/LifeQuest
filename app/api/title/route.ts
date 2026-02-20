import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const titleSchema = z.object({
  prefix: z.string().describe('ダークソウル風の二つ名。例：「忌まわしき味覚の」「左腕を封じし」'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { recentClears } = body as { recentClears?: string[] }

    const titles = Array.isArray(recentClears)
      ? recentClears.filter((x): x is string => typeof x === 'string').slice(-10)
      : []

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: titleSchema,
      system: `あなたはダークソウル（フロム・ソフトウェア）の世界観を熟知したNPCです。
ユーザーが直近でクリアしたクエスト（行動）のタイトル一覧を受け取り、その行動を象徴する「二つ名」を1つだけ生成してください。
- 重厚で詩的、ダークファンタジー風の短いフレーズ（「〇〇の」「〇〇し」など、後に階位が続く形式）
- 例：「忌まわしき味覚の」「左腕を封じし」「無名の路地を往く」
- 日本語で、10文字前後〜20文字程度
- 出力は prefix フィールドに1つだけ入れる`,
      prompt:
        titles.length > 0
          ? `直近でクリアしたクエストタイトル：\n${titles.map((t) => `・${t}`).join('\n')}\n\n上記の行動を象徴する二つ名を1つ生成してください。`
          : 'クリア履歴がありません。デフォルトの二つ名として「魂を燃やしし」を返してください。',
    })

    return NextResponse.json({ prefix: object.prefix || '魂を燃やしし' })
  } catch (error) {
    console.error('Title generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: '二つ名の生成に失敗しました', detail: message },
      { status: 500 }
    )
  }
}
