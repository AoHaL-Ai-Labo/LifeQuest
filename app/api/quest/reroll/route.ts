import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const rerollSchema = z.object({
  title: z.string(),
  description: z.string(),
  flavorText: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      constraints,
      originalQuest,
    } = body as {
      constraints?: string
      originalQuest?: { title?: string; description?: string; flavorText?: string }
    }

    if (!constraints || typeof constraints !== 'string' || !originalQuest?.title) {
      return NextResponse.json(
        { error: 'constraints と originalQuest.title が必要です' },
        { status: 400 }
      )
    }

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: rerollSchema,
      system: `あなたはユーザーの「コンフォートゾーン」を少しはみ出させるガイドです。
ユーザーが「時間・お金・家族」などの制約で元のクエストを実行できない場合、**本質（Goal）はそのままに**スケールダウンした代替案を1つだけ生成してください。
- title: 中二病・ダークファンタジー風の名前（代替版であることが分かってもよい）
- description: 誰でも理解できる具体的な行動指示。制約内でできる範囲に縮小すること。
- flavorText: ダークソウル風の重厚な詩的フレーバー（1〜2文）`,
      prompt: `元のクエスト：
タイトル：${originalQuest.title}
説明：${originalQuest.description || ''}

ユーザーの制約：${constraints}

上記の制約を満たしつつ、元のクエストの「本質」を保った代替クエストを1つ生成してください。`,
    })

    return NextResponse.json({ quest: result.object })
  } catch (error) {
    console.error('Quest reroll error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: '代替クエストの生成に失敗しました', detail: message },
      { status: 500 }
    )
  }
}
