import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

/**
 * 反転クエスト API
 * 通常は「何かをする」。反転は「何かをやめる」「習慣を断つ」「普段の行動を逆にする」
 */

const questItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  flavorText: z.string(),
})

const schema = z.object({
  quests: z.array(questItemSchema).length(1),
})

export async function POST() {
  try {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema,
      system: `あなたはユーザーの「コンフォートゾーン（快適領域）」を揺さぶる試練の導き手です。
【反転クエスト】通常の「何かをする」とは逆に、「何かをやめる」「習慣を断つ」「普段の行動を逆にする」クエストを**1つだけ**生成してください。
各クエストは必ず title / description / flavorText の3要素を出力すること。

## 反転クエストの定義:
- **やめる**: 普段無意識にやっていることを意図的にやめる（SNSを〇時間見ない、スマホを寝室に持っていかない、等）
- **断つ**: コンフォートな習慣を一時的に断つ（いつものルートを通らない、いつもの場所で働かない、等）
- **逆転**: 普段の行動パターンを逆にする（朝型なら夜に集中タイムを設ける、インドアなら短い外出を、等）
- 今日中に実行可能な規模。物理的・社会的に安全であること。
- ユーザーが「元々やりたかったこと」は避けること。

## 役割分担:
### title: ダークファンタジー風。「断絶の誓約」「逆転の儀式」等
### description: 具体的な行動指示。何をやめる／断つ／逆転するか明確に。
### flavorText: ダークソウル風の詩的テキスト。必須。`,
      prompt: '【反転クエスト】「何かをやめる」「習慣を断つ」「普段と逆の行動をする」— 通常の挑戦を逆転させた1日1回のクエストを1つ生成してください。',
    })
    return result.toJsonResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Invert quest generation error:', error)
    return new Response(
      JSON.stringify({ error: '反転クエストの生成に失敗しました', detail: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
