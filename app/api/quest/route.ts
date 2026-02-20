import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const questItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  flavorText: z.string(),
})

/** 期間ごとのクエスト数: Daily=5, Weekly=7, Monthly=10 */
const QUEST_COUNTS = { daily: 5, weekly: 7, monthly: 10 } as const

function getQuestSchema(count: number) {
  return z.object({
    quests: z.array(questItemSchema).length(count),
  })
}

const TIER_DEFINITIONS: Record<string, { name: string; desc: string; promptHint: string }> = {
  beginner: {
    name: '初級 (Beginner)',
    desc: '物理・五感のノイズ（体を動かす、利き手を変える、感覚を研ぎ澄ます等）',
    promptHint: '5〜15分で完了し、身体的・感覚的な小さな変化でコンフォートゾーンにノイズを入れるクエスト。誰でも今日からできる手軽さ。',
  },
  intermediate: {
    name: '中級 (Intermediate)',
    desc: '社会・環境のノイズ（他人との関わり、普段と違う場所・ルート、小さな社会的挑戦等）',
    promptHint: '社会生活や環境に少し踏み込むクエスト。知らない人に話しかける、いつもと違う道で帰る、自分から輪に入る等。',
  },
  advanced: {
    name: '上級 (Advanced)',
    desc: '価値観・アイデンティティのノイズ（自己イメージの更新、価値観の揺さぶり、深い内省等）',
    promptHint: '自己の価値観やアイデンティティに触れるクエスト。普段避けていることを認める、逆の立場で考える、自分への問いかけ等。',
  },
  abyss: {
    name: '狂気 (Abyss)',
    desc: 'アイデンティティ・コンフォートゾーンの完全破壊（劇薬のような極限の挑戦）',
    promptHint: 'ユーザーのアイデンティティやコンフォートゾーンを完全に破壊する、極めてハードルの高い劇薬のような行動。例：スマホの電源を1日切る、見知らぬ人に話しかけて会話を続ける、普段絶対やらないことを敢えて実行する等。物理的・社会的に安全であること。',
  },
}

const PERIOD_HINTS: Record<string, string> = {
  daily: '今日中に完了できる短いクエスト（5〜15分程度）。',
  weekly: '1週間をかけて取り組む中期クエスト。複数日に分けて実行可能。',
  monthly: '1ヶ月をかけて挑戦する大型クエスト。ライフスタイルに踏み込む規模。',
}

export async function GET() {
  return handleQuestGeneration('daily', 'beginner')
}

export async function POST(req: Request) {
  let period: 'daily' | 'weekly' | 'monthly' = 'daily'
  let difficulty: 'beginner' | 'intermediate' | 'advanced' | 'abyss' = 'beginner'
  let extra = false
  let trial = false
  let weekend = false
  let monthlyEvent = false
  try {
    const body = await req.json().catch(() => ({}))
    if (body?.period === 'weekly' || body?.period === 'monthly') period = body.period
    if (body?.difficulty === 'intermediate' || body?.difficulty === 'advanced' || body?.difficulty === 'abyss') difficulty = body.difficulty
    if (body?.extra === true) extra = true
    if (body?.trial === true) trial = true
    if (body?.weekend === true) weekend = true
    if (body?.monthlyEvent === true) monthlyEvent = true
  } catch {
    // ignore
  }
  return handleQuestGeneration(period, difficulty, extra, trial, weekend, monthlyEvent)
}

async function handleWeekendChallengeGeneration() {
  const schema = getQuestSchema(1)
  try {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema,
      system: `あなたはユーザーの「コンフォートゾーン（快適領域）」を揺さぶる試練の導き手です。
【週末チャレンジ】土日限定。週末にだけ解放される特別な挑戦を**1つだけ**生成してください。
各クエストは必ず title / description / flavorText の3要素を出力すること。

## 週末チャレンジの定義:
- 休日ならではの「時間的な余裕」や「ルーティンが崩れやすい」環境を活かしたクエスト。
- 平日は難しいが週末なら取り組める規模（半日かける、外出を伴う、リラックスした状態で内省する等）。
- 中級〜上級レベルの難易度。物理的・社会的に安全であること。

## 役割分担:
### title: ダークファンタジー風。「週末の〇〇」「休日の誓約」等
### description: 具体的な行動指示。週末ならではの要素を入れる。
### flavorText: ダークソウル風の詩的テキスト。必須。`,
      prompt: '【週末チャレンジ】土日限定の特別挑戦。週末の余暇を活かした、平日では難しい「コンフォートゾーンをはみ出る」クエストを1つ生成してください。',
    })
    return result.toJsonResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Weekend challenge generation error:', error)
    return new Response(
      JSON.stringify({ error: '週末チャレンジの生成に失敗しました', detail: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleMonthlyEventGeneration() {
  const schema = getQuestSchema(1)
  const now = new Date()
  const monthNum = now.getMonth() + 1
  const monthThemes: Record<number, string> = {
    1: '新年・始動', 2: '断捨離・整理', 3: '芽吹き・変化', 4: '出会い・新生活',
    5: '成長・学び', 6: '内省・振り返り', 7: '冒険・未知', 8: '休息・充電',
    9: '収穫・まとめ', 10: '感謝・絆', 11: '挑戦・突破', 12: '締めくくり・総括',
  }
  const theme = monthThemes[monthNum] ?? '今月のテーマ'
  try {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema,
      system: `あなたはユーザーの「コンフォートゾーン（快適領域）」を揺さぶる試練の導き手です。
【月間テーマイベント】今月（${monthNum}月）のテーマ「${theme}」に沿った特別クエストを**1つだけ**生成してください。
各クエストは必ず title / description / flavorText の3要素を出力すること。

## 月間テーマの定義:
- 今月のテーマ（${theme}）に基づいた、1ヶ月かけて取り組める規模のクエスト。
- 週末チャレンジより長いスパン。複数週に分けてもよい、ライフスタイルに触れる内容。
- 上級レベル。価値観や習慣に踏み込む。物理的・社会的に安全であること。

## 役割分担:
### title: テーマを反映したダークファンタジー風の名前
### description: 具体的な行動指示。今月のテーマに沿っていること。
### flavorText: ダークソウル風の詩的テキスト。必須。`,
      prompt: `【月間テーマ】${monthNum}月のテーマ「${theme}」に沿った、1ヶ月かけて取り組む特別クエストを1つ生成してください。`,
    })
    return result.toJsonResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Monthly event generation error:', error)
    return new Response(
      JSON.stringify({ error: '月間テーマイベントの生成に失敗しました', detail: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleTrialGeneration() {
  const schema = getQuestSchema(1)
  try {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema,
      system: `あなたはユーザーの「コンフォートゾーン（快適領域）」を揺さぶる試練の導き手です。
【試練モード】Lv25以上の熟練者向け。1週間に1度、価値観・アイデンティティの最深部に触れる「試練」を**1つだけ**生成してください。
各クエストは必ず title / description / flavorText の3要素を出力すること。

## 試練の定義:
- 上級（Advanced）以上。普段避けていること、自分への問いかけ、逆の立場で考える等、自己の価値観を揺さぶる内容。
- 1週間かけてじっくり取り組む規模。できれば複数日に分けて内省しながら進められるもの。
- 物理的・社会的に安全であること。
- ユーザーが「元々やりたかったこと」は避けること。

## 役割分担:
### title: ダークファンタジー風の荘厳な名前。例：「深淵への問い」「魂の秤」
### description: シンプルで具体的な行動指示。ダーク要素は入れない。
### flavorText: ダークソウル風の重厚な詩的テキスト。必須。`,
      prompt: '【試練】熟練者への挑戦状。価値観やアイデンティティの最深部に触れる、1週間かけて取り組む「試練」クエストを1つ生成してください。',
    })
    return result.toJsonResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Trial generation error:', error)
    return new Response(
      JSON.stringify({ error: '試練の生成に失敗しました', detail: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleQuestGeneration(period: 'daily' | 'weekly' | 'monthly', difficulty: 'beginner' | 'intermediate' | 'advanced' | 'abyss', extra = false, trial = false, weekend = false, monthlyEvent = false) {
  if (trial) return handleTrialGeneration()
  if (weekend) return handleWeekendChallengeGeneration()
  if (monthlyEvent) return handleMonthlyEventGeneration()
  const def = TIER_DEFINITIONS[difficulty] ?? TIER_DEFINITIONS.beginner
  const periodHint = PERIOD_HINTS[period] ?? PERIOD_HINTS.daily
  const questCount = extra ? 1 : QUEST_COUNTS[period]
  const schema = getQuestSchema(questCount)
  const extraHint = extra
    ? `【重要】これは「エクストラクエスト」＝全クエストクリアの褒美です。通常よりやや挑戦的で、達成感の高い1つだけのクエストを生成してください。`
    : ''
  try {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema,
      system: `あなたはユーザーの「コンフォートゾーン（快適領域）」を少しだけはみ出させるガイドです。
${extraHint}
ユーザーが「えっ、ちょっと面倒くさい…でもやってみるか」と感じる絶妙な摩擦（Good Friction）を持ったクエストを**ちょうど${questCount}つ**生成してください。
各クエストは必ず title / description / flavorText の3要素を出力すること。全${questCount}つで必ず出力すること。

## 今回の階層（難易度）: 【${def.name}】
**定義**: ${def.desc}
**この階層に合う抽象度・難易度**: ${def.promptHint}

**期間**: ${period === 'daily' ? 'Daily（デイリー）' : period === 'weekly' ? 'Weekly（ウィークリー）' : 'Monthly（マンスリー）'}
**期間の制約**: ${periodHint}

上記の階層定義と期間制約に厳密に沿ったクエストを生成すること。初級なら身体的・感覚的なノイズ、中級なら社会的・環境的なノイズ、上級なら価値観・アイデンティティに触れるノイズに焦点を当てること。

## 役割分担（厳守）:

### title（タイトル）:
中二病・ダークファンタジー風のカッコいい名前。
例：「左腕の誓約」「黄昏の瞑想」「無名の路地」

### description（説明）:
誰でもすぐに理解できる、シンプルで具体的な行動指示。ダーク要素は絶対に入れない。
例：「利き手ではない方の手を使って、歯磨きをするかドアノブを回してみましょう。完了まで5分以内。」

### flavorText（フレーバーテキスト）: 【必須・必ず出力】
ダークソウル（フロム・ソフトウェア）のNPCのような、重厚で詩的なフレーバーテキスト。空文字や省略は禁止。全${questCount}つのクエストすべてで必ず生成すること。
例：「火の無き灰よ、己の利き腕を封じよ。不便という名の枷が、淀んだ瞳を開くやもしれぬのだから…」

## クエストの条件:
1. ユーザーが「元々やりたかったこと（単なる消費や趣味）」は絶対に避けること。
2. 少しの恥ずかしさ、少しの手間、あるいは普段の無意識のルーティンを意図的に崩す行動であること。
3. 物理的・社会的に安全であること。`,
      prompt: extra
        ? `【エクストラ】${period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} × ${def.name}の全クリア達成者への褒美として、やや挑戦的で達成感の高い『少し嫌だけど脳が拡張する』クエストを**1つ**生成してください。`
        : `【${period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} × ${def.name}】の組み合わせに合った『少し嫌だけど脳が拡張する』クエストを**ちょうど${questCount}つ**生成してください。`,
    })

    return result.toJsonResponse()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const cause = error instanceof Error && error.cause ? String(error.cause) : ''
    console.error('Quest generation error:', error)
    return new Response(
      JSON.stringify({
        error: 'クエストの生成に失敗しました',
        detail: message,
        ...(cause && { cause }),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
