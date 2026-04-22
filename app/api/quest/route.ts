import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { sampleQuestsFromDb } from '@/lib/quest-catalog'
import type { PrimaryStat, QuestStats } from '@/lib/quest-types'

const PRIMARY_STAT_VALUES = ['str', 'dex', 'end', 'int', 'fai', 'arc'] as const

const questItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  flavorText: z.string(),
  /** クエスト内容と最も関連する1属性。AIは Enum 選択のみ行う（数値は出さない） */
  primaryStat: z.enum(PRIMARY_STAT_VALUES),
})

type DifficultyTier = 'beginner' | 'intermediate' | 'advanced' | 'abyss'

/** 難易度・期間ごとの報酬値（fixedQuests.ts と揃える: 初級+1, 中級+3, 上級+5） */
const STAT_VALUES: Record<'daily' | 'weekly' | 'monthly', Record<DifficultyTier, number>> = {
  daily: { beginner: 1, intermediate: 3, advanced: 5, abyss: 5 },
  weekly: { beginner: 5, intermediate: 10, advanced: 15, abyss: 15 },
  monthly: { beginner: 15, intermediate: 22, advanced: 30, abyss: 30 },
}

/** primaryStat と period・difficulty から stats オブジェクトを生成 */
function statsFromPrimaryStat(
  primaryStat: PrimaryStat,
  period: 'daily' | 'weekly' | 'monthly',
  difficulty: DifficultyTier = 'advanced'
): QuestStats {
  const value = STAT_VALUES[period][difficulty]
  return {
    str: primaryStat === 'str' ? value : 0,
    dex: primaryStat === 'dex' ? value : 0,
    end: primaryStat === 'end' ? value : 0,
    int: primaryStat === 'int' ? value : 0,
    fai: primaryStat === 'fai' ? value : 0,
    arc: primaryStat === 'arc' ? value : 0,
  }
}

/** 期間ごとのクエスト数: Daily=5, Weekly=7, Monthly=10 */
const QUEST_COUNTS = { daily: 5, weekly: 7, monthly: 10 } as const

/** ハイブリッド生成: 各期間で固定クエストから取得する数（Daily: 5枠中3枠 / Weekly・Monthly: 1〜2枠） */
const FIXED_COUNTS = { daily: 3, weekly: 2, monthly: 2 } as const

function getQuestSchema(count: number) {
  return z.object({
    quests: z.array(questItemSchema).length(count),
  })
}

/** 【階層ごとのスケール定義】DAILY と WEEKLY/MONTHLY の規模感を厳格に区別する絶対ルール */
const SCALE_DEFINITIONS = `
## 【絶対遵守】階層ごとのスケール定義（規模感の厳格区別）
時間指定（〇分間など）は引き続き一切禁止ですが、クエストの「規模（スケール）」によって Daily と Weekly/Monthly を厳格に分けてください。

1. **DAILY（初級・中級・上級）のスケール**
   - 「日常の中の点」。その場、またはその日のうちにすぐ実行できる行動。
   - 例：本を開く、1回スクワットする、スマホを別室に置くなど。

2. **WEEKLY（週末・週1回）のスケール**
   - 「日常からの逸脱」。その場ですぐにはできず、休日のまとまった時間や計画・移動を伴う「非日常」のアクション。
   - ※絶対禁止：「1回深呼吸する」「耳を澄ます」のような Daily でこなせる規模のタスクを WEEKLY に出力することは厳禁。
   - 例：行ったことのない店を開拓する、水回りを徹底的に大掃除する、全く新しいレシピの料理を作るなど。

3. **MONTHLY（月1回）のスケール**
   - 「記憶に残る特大の達成」。1ヶ月に1度しかできないレベルの大きな挑戦。
   - 例：専門書を1冊最後まで読み切る、普段行かない別の街・県へ遠征する、新しい作品や記事を完成させて公開するなど。
`

/** 【絶対遵守ルール】全AIクエスト生成で共有 */
const ABSOLUTE_RULES = `
## 【絶対遵守ルール】必ず厳守すること
1. **時間制約の完全禁止**: title や description に「〇分間」「〇時間」「〇秒」等の時間指定を絶対に含めない。プレイヤーの時間を拘束する指示は厳禁。
2. **スモールステップの徹底**:
   - 初級（beginner）: 絶対に「1アクション」のみで完結させる（例：本を開く、耳を塞ぐ、水を一口飲む、1手だけ回す）。継続時間や回数ノルマは禁止。
   - 中級・上級: 「キリの良いところまで」「限界まで」等の表現にとどめ、具体的な時間は指定しない。
3. **フレーバーテキスト**: 「〜の誓約」「〜する」等、プレイヤーが自発的に選ぶ重厚なダークファンタジー風の言い回しを維持する。
${SCALE_DEFINITIONS}
`

const TIER_DEFINITIONS: Record<string, { name: string; desc: string; promptHint: string }> = {
  beginner: {
    name: '初級 (Beginner)',
    desc: '物理・五感のノイズ（体を動かす、利き手を変える、感覚を研ぎ澄ます等）',
    promptHint: '1アクションのみで完結。身体的・感覚的な最小単位の変化でコンフォートゾーンにノイズを入れる。回数・時間のノルマは厳禁。',
  },
  intermediate: {
    name: '中級 (Intermediate)',
    desc: '社会・環境のノイズ（他人との関わり、普段と違う場所・ルート、小さな社会的挑戦等）',
    promptHint: '社会生活や環境に少し踏み込む。「キリの良いところまで」等、時間指定なし。知らない人に話しかける、いつもと違う道で帰る等。',
  },
  advanced: {
    name: '上級 (Advanced)',
    desc: '価値観・アイデンティティのノイズ（自己イメージの更新、価値観の揺さぶり、深い内省等）',
    promptHint: '自己の価値観やアイデンティティに触れる。「限界まで」等、時間指定なし。普段避けていることを認める、逆の立場で考える等。',
  },
  abyss: {
    name: '狂気 (Abyss)',
    desc: 'アイデンティティ・コンフォートゾーンの完全破壊（劇薬のような極限の挑戦）',
    promptHint: 'アイデンティティやコンフォートゾーンを完全に破壊する極限の行動。時間指定は禁止。「〜する」等の誓約形式で。物理的・社会的に安全であること。',
  },
}

/** 期間ごとのスケール補足（ABSOLUTE_RULES の階層定義に基づく） */
const PERIOD_HINTS: Record<string, string> = {
  daily: '【DAILY スケール】「日常の中の点」。その場または今日中にすぐ実行できる行動。時間指定は厳禁。',
  weekly: '【WEEKLY スケール】「日常からの逸脱」。休日のまとまった時間・計画・移動を要する非日常アクション。Daily で完結する規模（例：1回深呼吸、耳を澄ます）は絶対禁止。時間指定は厳禁。',
  monthly: '【MONTHLY スケール】「記憶に残る特大の達成」。1ヶ月に1度レベルの大きな挑戦。時間指定は厳禁。',
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
- 平日は難しいが週末なら取り組める規模。外出を伴う、リラックスした状態で内省する等。
- 中級〜上級レベルの難易度。物理的・社会的に安全であること。
${ABSOLUTE_RULES}

## 役割分担:
### title: ダークファンタジー風。「週末の〇〇」「休日の誓約」等
### description: 具体的な行動指示。週末ならではの要素を入れる。
### flavorText: ダークソウル風の詩的テキスト。必須。
### primaryStat: このクエスト内容と最も関連する1属性を、str/dex/end/int/fai/arc のいずれか1つだけ選ぶ。数値は出さず、属性名のみ。`,
      prompt: '【週末チャレンジ】土日限定の特別挑戦。週末の余暇を活かした、平日では難しい「コンフォートゾーンをはみ出る」クエストを1つ生成してください。必ず primaryStat を str / dex / end / int / fai / arc のいずれか1つ選んで出力すること。',
    })
    const data = result.object as { quests: Array<{ title: string; description: string; flavorText: string; primaryStat: PrimaryStat }> }
    const quests = data.quests.map((q) => ({ ...q, stats: statsFromPrimaryStat(q.primaryStat, 'weekly', 'advanced') }))
    return new Response(JSON.stringify({ quests }), { headers: { 'Content-Type': 'application/json' } })
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
- 今月のテーマ（${theme}）に基づいた、1ヶ月の間に取り組める規模のクエスト。
- 週末チャレンジより長いスパン。複数週に分けてもよい、ライフスタイルに触れる内容。
- 上級レベル。価値観や習慣に踏み込む。物理的・社会的に安全であること。
${ABSOLUTE_RULES}

## 役割分担:
### title: テーマを反映したダークファンタジー風の名前
### description: 具体的な行動指示。今月のテーマに沿っていること。
### flavorText: ダークソウル風の詩的テキスト。必須。
### primaryStat: このクエスト内容と最も関連する1属性を、str/dex/end/int/fai/arc のいずれか1つだけ選ぶ。数値は出さず、属性名のみ。`,
      prompt: `【月間テーマ】${monthNum}月のテーマ「${theme}」に沿った、1ヶ月かけて取り組む特別クエストを1つ生成してください。必ず primaryStat を str / dex / end / int / fai / arc のいずれか1つ選んで出力すること。`,
    })
    const data = result.object as { quests: Array<{ title: string; description: string; flavorText: string; primaryStat: PrimaryStat }> }
    const quests = data.quests.map((q) => ({ ...q, stats: statsFromPrimaryStat(q.primaryStat, 'monthly', 'advanced') }))
    return new Response(JSON.stringify({ quests }), { headers: { 'Content-Type': 'application/json' } })
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
- 1週間の間にじっくり取り組む規模。複数日に分けて内省しながら進められるもの。
- 物理的・社会的に安全であること。
- ユーザーが「元々やりたかったこと」は避けること。
${ABSOLUTE_RULES}

## 役割分担:
### title: ダークファンタジー風の荘厳な名前。例：「深淵への問い」「魂の秤」
### description: シンプルで具体的な行動指示。ダーク要素は入れない。
### flavorText: ダークソウル風の重厚な詩的テキスト。必須。
### primaryStat: このクエスト内容と最も関連する1属性を、str/dex/end/int/fai/arc のいずれか1つだけ選ぶ。数値は出さず、属性名のみ。`,
      prompt: '【試練】熟練者への挑戦状。価値観やアイデンティティの最深部に触れる、1週間かけて取り組む「試練」クエストを1つ生成してください。必ず primaryStat を str / dex / end / int / fai / arc のいずれか1つ選んで出力すること。',
    })
    const data = result.object as { quests: Array<{ title: string; description: string; flavorText: string; primaryStat: PrimaryStat }> }
    const quests = data.quests.map((q) => ({ ...q, stats: statsFromPrimaryStat(q.primaryStat, 'weekly', 'advanced') }))
    return new Response(JSON.stringify({ quests }), { headers: { 'Content-Type': 'application/json' } })
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
  const extraHint = extra
    ? `【重要】これは「エクストラクエスト」＝全クエストクリアの褒美です。通常よりやや挑戦的で、達成感の高い1つだけのクエストを生成してください。`
    : ''

  // エクストラはAIのみ（ハイブリッド対象外）
  if (extra) {
    const schema = getQuestSchema(1)
    try {
      const result = await generateObject({
        model: google('gemini-2.5-flash'),
        schema,
        system: `あなたはユーザーの「コンフォートゾーン（快適領域）」を少しだけはみ出させるガイドです。
${extraHint}
ユーザーが「えっ、ちょっと面倒くさい…でもやってみるか」と感じる絶妙な摩擦（Good Friction）を持ったクエストを**1つ**生成してください。
各クエストは必ず title / description / flavorText の3要素を出力すること。

## 今回の階層（難易度）: 【${def.name}】
**定義**: ${def.desc}

**期間**: ${period === 'daily' ? 'Daily（デイリー）' : period === 'weekly' ? 'Weekly（ウィークリー）' : 'Monthly（マンスリー）'}
**期間の制約**: ${periodHint}

## 役割分担（厳守）:
### title: 中二病・ダークファンタジー風の名前
### description: 具体的な行動指示。ダーク要素は絶対に入れない
### flavorText: ダークソウル風の詩的テキスト。必須。
### primaryStat: このクエスト内容と最も関連する1属性を、str/dex/end/int/fai/arc のいずれか1つだけ選ぶ。数値は出さず、属性名のみ。
${ABSOLUTE_RULES}`,
        prompt: `【エクストラ】${period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} × ${def.name}の全クリア達成者への褒美として、やや挑戦的で達成感の高い『少し嫌だけど脳が拡張する』クエストを**1つ**生成してください。必ず primaryStat を str / dex / end / int / fai / arc のいずれか1つ選んで出力すること。`,
      })
      const data = result.object as { quests: Array<{ title: string; description: string; flavorText: string; primaryStat: PrimaryStat }> }
      const quests = data.quests.map((q) => ({ ...q, stats: statsFromPrimaryStat(q.primaryStat, period, difficulty) }))
      return new Response(JSON.stringify({ quests }), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Extra quest generation error:', error)
      return new Response(
        JSON.stringify({ error: 'クエストの生成に失敗しました', detail: message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // ハイブリッド生成: DBカタログ + AI
  const fixedCount = Math.min(FIXED_COUNTS[period], questCount)
  const fixedQuests = await sampleQuestsFromDb(period, fixedCount, difficulty)
  const remainingCount = questCount - fixedQuests.length

  const mergeAndShuffle = (
    fixed: Array<{ title: string; description: string; flavorText?: string }>,
    ai: Array<{ title: string; description: string; flavorText: string }> | null
  ) => {
    const combined = ai ? [...fixed, ...ai] : fixed
    return combined
      .map((q) => ({ ...q, _r: Math.random() }))
      .sort((a, b) => (a._r as number) - (b._r as number))
      .map(({ _r, ...q }) => ({ ...q, flavorText: q.flavorText ?? '' }))
  }

  if (remainingCount <= 0) {
    const quests = mergeAndShuffle(fixedQuests.slice(0, questCount), null)
    return new Response(JSON.stringify({ quests }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const schema = getQuestSchema(remainingCount)
  try {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema,
      system: `あなたはユーザーの「コンフォートゾーン（快適領域）」を少しだけはみ出させるガイドです。
ユーザーが「えっ、ちょっと面倒くさい…でもやってみるか」と感じる絶妙な摩擦（Good Friction）を持ったクエストを**ちょうど${remainingCount}つ**生成してください。
各クエストは必ず title / description / flavorText の3要素を出力すること。全${remainingCount}つで必ず出力すること。

## 今回の階層（難易度）: 【${def.name}】
**定義**: ${def.desc}
**この階層に合う抽象度・難易度**: ${def.promptHint}

**期間**: ${period === 'daily' ? 'Daily（デイリー）' : period === 'weekly' ? 'Weekly（ウィークリー）' : 'Monthly（マンスリー）'}
**期間の制約**: ${periodHint}

上記の階層定義と期間制約に厳密に沿ったクエストを生成すること。

## 役割分担（厳守）:
### title: 中二病・ダークファンタジー風のカッコいい名前
### description: 具体的な行動指示。ダーク要素は絶対に入れない
### flavorText: ダークソウル風の詩的テキスト。必須。
### primaryStat: このクエスト内容と最も関連する1属性を、str/dex/end/int/fai/arc のいずれか1つだけ選ぶ。数値は出さず、属性名のみ。

## クエストの条件:
1. ユーザーが「元々やりたかったこと」は避ける
2. 少しの恥ずかしさ、手間、ルーティン崩し
3. 物理的・社会的に安全であること
${ABSOLUTE_RULES}`,
      prompt: `【${period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'} × ${def.name}】の組み合わせに合った『少し嫌だけど脳が拡張する』クエストを**ちょうど${remainingCount}つ**生成してください。各クエストに必ず primaryStat を str / dex / end / int / fai / arc のいずれか1つ選んで出力すること。`,
    })

    const data = result.object as { quests: Array<{ title: string; description: string; flavorText: string; primaryStat: PrimaryStat }> }
    const aiQuestsWithStats = data.quests.map((q) => ({ ...q, stats: statsFromPrimaryStat(q.primaryStat, period, difficulty) }))
    const quests = mergeAndShuffle(fixedQuests, aiQuestsWithStats)
    return new Response(JSON.stringify({ quests }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // フェイルセーフ: Gemini失敗時はDBカタログで埋める
    console.error('Quest generation error (fallback to catalog):', error)
    const fallback = await sampleQuestsFromDb(period, questCount, difficulty)
    const quests = fallback.map((q) => ({ ...q, flavorText: q.flavorText ?? '' }))
    return new Response(JSON.stringify({ quests }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
