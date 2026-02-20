/**
 * Mock API モード: 開発時にAPI Rate Limitを回避するため、API通信をバイパスしてダミーデータを返す。
 * デバッグパネルのトグルでON/OFF。デフォルトはON。
 */

const STORAGE_KEY = 'quest-log:mockApi'

/** Mock APIが有効か（LocalStorageから読み取り。デフォルト true = ON） */
export function getMockApiEnabled(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

/** Mock APIのON/OFFを保存 */
export function setMockApiEnabled(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // ignore
  }
}

/** 約500msの擬似ロード後、Promiseを解決するヘルパー */
export function mockDelay<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 500)
  })
}

/** クエスト生成のモックレスポンス */
export const MOCK_QUEST = {
  title: '[テスト] 左手で歯を磨く',
  description: 'これはモックデータです。APIを消費していません。',
  flavorText: '火の無き灰よ、己の利き腕を封じよ…',
}

const QUEST_COUNTS = { daily: 5, weekly: 7, monthly: 10 } as const

/** 期間に応じたモッククエスト（Daily=5, Weekly=7, Monthly=10） */
export function getMockQuestsForPeriod(period: 'daily' | 'weekly' | 'monthly') {
  const count = QUEST_COUNTS[period] ?? 3
  return Array.from({ length: count }, (_, i) =>
    i === 0 ? MOCK_QUEST : { ...MOCK_QUEST, title: `[テスト] 左手で歯を磨く（${i + 1}）` }
  )
}

/** 後方互換: 3件のモック（Daily用） */
export const MOCK_QUESTS = getMockQuestsForPeriod('daily')

/** 報告のモックレスポンス */
export const MOCK_REPORT_MESSAGE = '【テストクリア】貴公の歩みは、確かなノイズとなって世界を拡張した！'

/** 二つ名のモックレスポンス */
export const MOCK_TITLE_PREFIX = '『モックテストの』'

/** リロール（代替案）のモックレスポンス */
export const MOCK_REROLL_QUEST = {
  title: '[テスト] 代替案（モック）',
  description: 'これはモックの代替案です。APIを消費していません。',
  flavorText: '火の無き灰よ、己の利き腕を封じよ…',
}

/** 試練クエスト（Lv25以上、週1回）のモック */
export const MOCK_TRIAL_QUEST = {
  title: '[試練] 深淵への問い',
  description: '自分が最も避けている・苦手としている「1つの行動」を紙に書き、今週中にそれを1回だけ実行して記録せよ。',
  flavorText: '灰よ、己の影と向き合え。逃げ続ける者に、真の光は届かぬ。',
}

/** 週末チャレンジ（土日のみ、週1回）のモック */
export const MOCK_WEEKEND_CHALLENGE = {
  title: '[週末] 休日の誓約',
  description: '週末に普段のルーティンを壊す小さな挑戦を1つ実行せよ。例：いつもより1時間早く起きる、普段行かない場所へ出かける。',
  flavorText: '怠惰の温床たる休日よ、汝に試練を課す。魂を眠らせず、一歩を踏み出せ。',
}

/** 月間テーマイベント（月1回）のモック */
export const MOCK_MONTHLY_EVENT = {
  title: '[今月のテーマ] 断捨離の月',
  description: '今月のテーマに沿って、1つだけ「手放す」または「整理する」行動を決め、実行して記録せよ。',
  flavorText: '積み重ねられた灰よ、今月は一掴みを手放せ。軽くなる魂に、新たな風が吹く。',
}

/** 反転クエスト（日1回）のモック */
export const MOCK_INVERTED_QUEST = {
  title: '[反転] 断絶の誓約',
  description: '今日、普段無意識にやっている「1つの習慣」を意図的にやめよ。例：SNSを3時間見ない、スマホを寝室に持っていかない。',
  flavorText: '灰よ、己の慣れに縛られるな。断つその瞬間、真の自由が訪れる。',
}

/** 特異点（緊急ミッション）のモック */
export const MOCK_SINGULARITY_QUEST = {
  title: '[特異点] 泥濘への一歩',
  description: 'スマホのアドレス帳を適当にスクロールして止まった人に、今すぐ1通メッセージを送る。',
  flavorText: '日常の崩壊が始まる。その一歩が、貴公を新たな境界へ連れて行く。',
}

/** エクストラクエスト（全クリア時のボーナス）のモック */
export const MOCK_EXTRA_QUEST = {
  title: '[エクストラ] 灰の試練・完全制覇の証',
  description: '今日クリアした5つとは別に、もう1つだけ自分で「小さくコンフォートゾーンをはみ出る行動」を決めて実行し、1文で記録せよ。',
  flavorText: '全クエストを征した者にのみ、最後の一歩が示される。己の意志で、新たな境界線を引け。',
}

/** トロフィー審査のモック（50文字以上でsuccess: true） */
export function mockTrophyJudge(episode: string): { success: boolean; message: string } {
  if (episode.trim().length >= 50) {
    return { success: true, message: '見事だ。貴公の歩みは確かに世界を拡張した…（モック審査通過）' }
  }
  return { success: false, message: '灰よ、嘘をつくでない。熱量が足りぬ…少なくとも50文字は刻むのだ。（モック）' }
}
