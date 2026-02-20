import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const judgeSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { episode, trophyTitle } = body as { episode?: string; trophyTitle?: string }

    if (!episode || typeof episode !== 'string') {
      return NextResponse.json(
        { success: false, message: '灰よ、何も刻まずして審査など叶わぬ…' },
        { status: 400 }
      )
    }

    const trimmed = episode.trim()
    if (trimmed.length < 50) {
      return NextResponse.json(
        {
          success: false,
          message: '灰よ、嘘をつくでない。熱量が足りぬ…少なくとも50文字は刻むのだ。',
        },
        { status: 200 }
      )
    }

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: judgeSchema,
      system: `あなたはダークソウル風の「門番（Gatekeeper）」として、ユーザーが提出した実績達成報告を審査する。
ユーザーは「${trophyTitle || '人生の実績'}」の達成エピソードを入力する。
あなたの役割:
1. 内容が薄い・文字数が少なすぎる・適当な短文（「できた」「やった」程度）の場合は success: false とする。
2. しっかりとしたエピソード、具体的なエピソード、熱量が伝わる記述の場合は success: true とする。
3. 日本語で50文字以上の具体的な記述があれば、概ね success: true とする。
4. message は必ずダークソウル（フロム・ソフトウェア）のNPCのような重厚で詩的なフレーバーテキストで返す。
   - 失敗時例:「灰よ、嘘をつくでない。熱量が足りぬ…」「淀んだ瞳では、真実は見えぬ。もっと己の歩みを刻め。」
   - 成功時例:「見事だ。貴公の歩みは確かに世界を拡張した…」「火の無き灰よ、汝は己を超えた。その刻印を認める。」`,
      prompt: `以下の達成報告を審査し、success（true/false）とダークソウル風のmessageを返してください。

【実績】${trophyTitle || '人生の実績'}
【報告内容】
${trimmed}`,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error('Trophy judge error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        message: '審査の炎が消え入った…しばらく経ってから再び試すのだ。',
        detail: message,
      },
      { status: 500 }
    )
  }
}
