import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const questSchema = z.object({
  quests: z.array(z.object({
    title: z.string(),
    description: z.string(),
    flavorText: z.string(),
  })).length(1),
})

/**
 * 特異点（Singularity）: 緊急ミッション用クエスト生成
 * 「今すぐ、一切の準備なしで実行できるが、心理的摩擦が極めて強い行動」を1つ提案
 */
export async function POST() {
  try {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: questSchema,
      system: `あなたはユーザーの「コンフォートゾーン（快適領域）」を破壊する試練の導き手です。
【特異点（Singularity）】予定調和を壊す緊急ミッション用のクエストを**1つだけ**生成してください。
各クエストは必ず title / description / flavorText の3要素を出力すること。

## 特異点の定義:
- 今すぐ、一切の準備なしで実行できること。
- 心理的摩擦（コンフォートゾーンの破壊）が極めて強い行動であること。
- 例：スマホのアドレス帳を適当にスクロールして止まった人に連絡する、今から1時間一切の電子機器を断つ、普段話さない人に一声かける、など。
- 物理的・社会的に安全であること。

## 役割分担:
### title: 禍々しいダークファンタジー風の名前
### description: 具体的な行動指示。今すぐ実行できる内容であること。
### flavorText: ダークソウル風の重厚な詩的テキスト。日常の崩壊を示唆する。`,
      prompt: `【特異点】今すぐ、一切の準備なしで実行できるが、心理的摩擦（コンフォートゾーンの破壊）が極めて強い行動を1つ提案せよ。
例: スマホのアドレス帳を適当にスクロールして止まった人に連絡する、今から1時間一切の電子機器を断つ、普段避けている人に一声かける 等。
そのようなクエストを1つ生成してください。`,
    })

    const obj = result.object as { quests: Array<{ title: string; description: string; flavorText: string }> }
    return NextResponse.json({ quests: obj.quests })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Singularity quest generation error:', error)
    return NextResponse.json(
      { error: '特異点クエストの生成に失敗しました', detail: message },
      { status: 500 }
    )
  }
}
