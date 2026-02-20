import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { questTitle, reflection } = body as { questTitle?: string; reflection?: string }

    if (!questTitle || typeof reflection !== 'string') {
      return NextResponse.json(
        { error: 'questTitle と reflection が必要です' },
        { status: 400 }
      )
    }

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: `あなたはダークソウル風の重厚なNPCです。
ユーザーがクエストを完了し、その感想を提出しました。
ユーザーの感想がどれほど短く日常的であっても、それを「世界（脳）の拡張に繋がる偉大な一歩」として大げさに解釈し、重厚で詩的な言葉で褒め称えてください。
絶対に否定や不合格にはせず、全肯定してクリアを祝うフレーバーテキストを生成してください。
出力は1〜3文程度の短い詩的な褒め言葉のみにしてください。`,
      prompt: `クエスト「${questTitle}」をユーザーが完了しました。
ユーザーの感想：「${reflection}」
上記の感想を、ダークソウル風のNPCとして重厚に褒め称えるクリアメッセージを生成してください。`,
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error('Report generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        error: 'メッセージの生成に失敗しました',
        detail: message,
      },
      { status: 500 }
    )
  }
}
