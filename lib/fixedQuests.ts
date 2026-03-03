/**
 * 固定クエストデータ - ハイブリッド型クエスト生成のDB
 * APIコスト削減のため、定番の習慣化クエストをローカルで保持
 * 難易度: beginner=初級(1アクション), intermediate=中級(1セット), advanced=上級(限界挑戦)
 *         weekly=週末, monthly=月間
 */

export type QuestPeriod = 'daily' | 'weekly' | 'monthly'

export type QuestDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'weekly' | 'monthly'

/** ステータス: ダークソウル風6属性（筋力・技量・持久力・理力・信仰・神秘） */
export interface QuestStats {
  str: number
  dex: number
  end: number
  int: number
  fai: number
  arc: number
}

export type PrimaryStat = 'str' | 'dex' | 'end' | 'int' | 'fai' | 'arc'

export interface FixedQuest {
  id: string
  title: string
  description: string
  flavorTexts: string[]
  period: QuestPeriod
  difficulty: QuestDifficulty
  /** クエストクリアで得られるステータス加算値 */
  stats: QuestStats
  /** 努力値蓄積用の主属性（レベルアップ時+1判定に使用） */
  primaryStat: PrimaryStat
}

/** 固定クエスト一覧 */
export const FIXED_QUESTS: FixedQuest[] = [
  // --- DAILY / 初級 (beginner): +1 程度・1アクション基準 ---
  {
    id: 'daily-page-explore',
    title: '一頁の探求',
    description: '本を1ページだけ読む。それだけで十分な一歩。',
    flavorTexts: [
      '知識の扉は、一頁から開く。小さき一歩が、魂の灯火となる。',
      '淀んだ日常に、一片の光を。一頁の誓いは、始まりの証。',
      '積まれた書物を畏れるな。今日は一頁だけ。それでよい。',
    ],
    period: 'daily',
    difficulty: 'beginner',
    stats: { str: 0, dex: 0, end: 0, int: 1, fai: 0, arc: 0 },
    primaryStat: 'int',
  },
  {
    id: 'daily-single-exercise',
    title: '単一の鍛錬',
    description: 'スクワットを1回だけ行う。回数に囚われず、ただ1回の誓いを果たす。',
    flavorTexts: [
      '鋼の体は、一動作から鍛えられる。今日の一撃が、明日の力となる。',
      '惰性の鎖を断て。たった一度の屈伸が、魂を覚ます。',
      '大きな誓いより、小さき一歩。一つの鍛錬が、道を開く。',
    ],
    period: 'daily',
    difficulty: 'beginner',
    stats: { str: 1, dex: 0, end: 0, int: 0, fai: 0, arc: 0 },
    primaryStat: 'str',
  },
  {
    id: 'daily-sweet-distance',
    title: '甘味との距離',
    description: 'おやつを1回だけ見送る。誘惑に負けず、一度だけ断つ誓い。',
    flavorTexts: [
      '甘き誘惑よ、今日は汝を退けん。一つの拒絶が、意志の証。',
      '慣れし欲望に、一度だけ背を向けよ。それで魂は強くなる。',
      '沈黙の誓い。一口見送ることで、己の意志を確かめる。',
    ],
    period: 'daily',
    difficulty: 'beginner',
    stats: { str: 0, dex: 0, end: 0, int: 0, fai: 1, arc: 0 },
    primaryStat: 'fai',
  },
  {
    id: 'daily-one-step',
    title: '一歩の誓約',
    description: '階段を1往復だけ歩く。あるいは、その場で足踏みを10回。',
    flavorTexts: [
      '足を動かせ。一歩が、淀みを破る。惰性の外へ。',
      '小さき一歩の積み重ねが、道となる。今日は一往復。',
      '動かぬ体は錆びる。今日の一歩が、明日の歩みを開く。',
    ],
    period: 'daily',
    difficulty: 'beginner',
    stats: { str: 0, dex: 1, end: 0, int: 0, fai: 0, arc: 0 },
    primaryStat: 'dex',
  },
  {
    id: 'daily-one-sip',
    title: '一滴の誓い',
    description: '水を一口だけ、意識して飲む。喉を通る感覚に集中する。',
    flavorTexts: [
      '生命の源よ、今この一口を、儀式として扱え。',
      '惰性で飲むな。今、この一滴に魂を込めよ。',
      '水は穢れを流す。心も同様。一口の意識が、淀みを落とす。',
    ],
    period: 'daily',
    difficulty: 'beginner',
    stats: { str: 0, dex: 0, end: 1, int: 0, fai: 0, arc: 0 },
    primaryStat: 'end',
  },

  // --- DAILY / 中級 (intermediate): +3 程度・1セット・区切りまで ---
  {
    id: 'daily-chapter-conquest',
    title: '章の走破',
    description: '本を区切りの良いところまで読む。章末や小見出しまで、自分のペースで。',
    flavorTexts: [
      '一區切り征する者に、知識の断片が開く。区切りまで、進め。',
      '読みかけの書に終止符を。一章を完結させる者が、先へ行く。',
      '積まれた頁を前に、今日は一區切り。それで道は開ける。',
    ],
    period: 'daily',
    difficulty: 'intermediate',
    stats: { str: 0, dex: 0, end: 0, int: 3, fai: 0, arc: 0 },
    primaryStat: 'int',
  },
  {
    id: 'daily-one-set',
    title: '一巡の鍛錬',
    description: '筋トレを1セットやり切る。回数は問わない。1セット完遂の誓い。',
    flavorTexts: [
      '一セットを征する者に、肉体は応える。限界の一歩手前まで。',
      '回数に囚われるな。一巡を完遂せよ。それが鍛錬の証。',
      '鈍りし体を呼び覚ませ。一セットの誓いが、魂を燃やす。',
    ],
    period: 'daily',
    difficulty: 'intermediate',
    stats: { str: 3, dex: 0, end: 0, int: 0, fai: 0, arc: 0 },
    primaryStat: 'str',
  },
  {
    id: 'daily-night-silence',
    title: '夜の静寂',
    description: '夜食を完全に断つ。寝るまで、一口も取らない誓い。',
    flavorTexts: [
      '夜の誘惑を退けよ。静寂の中に、意志の炎を灯せ。',
      '夜食は淀みの象徴。断つことで、魂は浄まる。',
      '暗き時刻に、己の欲望に勝て。一夜の我慢が、明日を拓く。',
    ],
    period: 'daily',
    difficulty: 'intermediate',
    stats: { str: 0, dex: 0, end: 0, int: 0, fai: 3, arc: 0 },
    primaryStat: 'fai',
  },
  {
    id: 'daily-breath-mindfulness',
    title: '静寂の瞑想',
    description: '呼吸に意識を向ける。区切りのつくまで、息の流れだけを追う。',
    flavorTexts: [
      '静寂の中に身を沈めよ。塵のざわめきは消え、魂だけが残る。',
      '五感を封じ、己の内なる声に耳を傾けよ。そこに答えはある。',
      '沈黙は毒ではなく薬。呼吸に意識を向けるだけで、魂は洗われる。',
    ],
    period: 'daily',
    difficulty: 'intermediate',
    stats: { str: 0, dex: 0, end: 1, int: 1, fai: 3, arc: 0 },
    primaryStat: 'fai',
  },
  {
    id: 'daily-new-route',
    title: '未知の路の探求',
    description: 'いつもと違う道で歩く。気になったものを1つだけ記録する。',
    flavorTexts: [
      '呪われし日常の轍を断ち、未知の路を歩め。その一歩が、世界を書き換える。',
      '同じ道を踏むな。わずか数メートル、脇へそれるだけで見えるものがある。',
      '定められた道は幻だ。汝の足が刻む新しい轍が、真の道となる。',
    ],
    period: 'daily',
    difficulty: 'intermediate',
    stats: { str: 0, dex: 3, end: 1, int: 1, fai: 0, arc: 0 },
    primaryStat: 'dex',
  },

  // --- DAILY / 上級 (advanced): +5 程度・限界・強い制限 ---
  {
    id: 'daily-limit-proof',
    title: '限界の証明',
    description: '限界まで筋力を追い込む。もう一 rep が無理だと思えるところまで。',
    flavorTexts: [
      '限界の彼方に、真の力あり。己の壁を打ち破れ。',
      '痛みは成長の証。追い込むほどに、魂は強くなる。',
      '惰性の外へ。限界まで追い込んだ者だけが、新たな領域を見る。',
    ],
    period: 'daily',
    difficulty: 'advanced',
    stats: { str: 5, dex: 0, end: 2, int: 0, fai: 0, arc: 0 },
    primaryStat: 'str',
  },
  {
    id: 'daily-phone-isolation',
    title: '電波の遮断',
    description: 'スマホを別の部屋に隔離する。半日、手の届かない場所に置く。',
    flavorTexts: [
      '誘惑の箱を封じよ。静寂こそが、汝の力を引き出す。',
      '通知は塵の如し。遮断することで、真の集中が生まれる。',
      '電波に縛られるな。半日の隔離が、魂に余白を与える。',
    ],
    period: 'daily',
    difficulty: 'advanced',
    stats: { str: 0, dex: 0, end: 2, int: 2, fai: 5, arc: 0 },
    primaryStat: 'fai',
  },
  {
    id: 'daily-deep-chapter',
    title: '深淵の読了',
    description: '難解な本の1章を読み切る。普段避けていた分厚い一冊から。',
    flavorTexts: [
      '深き知識は、困難の向こうにあり。一章征する者が、視界を開く。',
      '積んである難書を恐れるな。今日は一章だけ、読み切る誓い。',
      '浅き読書に満足するな。深淵に潜れ。そこに真の学びあり。',
    ],
    period: 'daily',
    difficulty: 'advanced',
    stats: { str: 0, dex: 0, end: 0, int: 5, fai: 0, arc: 0 },
    primaryStat: 'int',
  },
  {
    id: 'daily-purification',
    title: '完全な浄化',
    description: '身の回りの一角を徹底的に整える。中途半端にせず、満足いくまで。',
    flavorTexts: [
      '塵の積もりし領域を征せ。浄化された空間に、魂の余白が生まれる。',
      '雑然たる環境は心を縛る。一角を征する者が、明日を見る。',
      '中途半端な整理は無意味。一箇所を徹底せよ。それが誓いの証。',
    ],
    period: 'daily',
    difficulty: 'advanced',
    stats: { str: 0, dex: 0, end: 5, int: 0, fai: 0, arc: 0 },
    primaryStat: 'end',
  },
  {
    id: 'daily-media-abstinence',
    title: '沈黙の誓約',
    description: 'SNS・動画・ニュースを半日、一切触れない。',
    flavorTexts: [
      '情報の嵐から身を避けよ。半日の沈黙が、魂を休める。',
      'スクロールの誘惑を断て。触れない誓いが、集中を取り戻す。',
      '常に繋がる必要はない。半日だけ、電波と距離を置け。',
    ],
    period: 'daily',
    difficulty: 'advanced',
    stats: { str: 0, dex: 0, end: 1, int: 0, fai: 3, arc: 5 },
    primaryStat: 'arc',
  },

  // --- WEEKLY / 週末 (weekly): +10 程度・週1回の儀式 ---
  {
    id: 'weekly-unknown-sanctuary',
    title: '未知の聖域への歩み',
    description: '行ったことのない店や場所へ足を運ぶ。今週中に1回だけ。',
    flavorTexts: [
      '慣れし店の外に、新たな発見あり。一歩踏み出せば、世界は広がる。',
      '未知への扉は、汝が開くまで閉じたまま。その鍵は、汝の足元にあり。',
      '同じ場所で終わるな。新しい風景が、汝の選択肢を増やす。',
    ],
    period: 'weekly',
    difficulty: 'weekly',
    stats: { str: 0, dex: 5, end: 2, int: 2, fai: 0, arc: 10 },
    primaryStat: 'arc',
  },
  {
    id: 'weekly-domain-purification',
    title: '領域の浄化',
    description: '部屋の念入りな大掃除をする。今週中に1回、満足いくまで。',
    flavorTexts: [
      '塵の積もりし領域を征せ。浄化された空間に、魂の余白が生まれる。',
      '雑然たる環境は心を縛る。一室を征する者が、明日を見る。',
      '隅々まで手を入れる者に、清浄の証が与えられる。',
    ],
    period: 'weekly',
    difficulty: 'weekly',
    stats: { str: 2, dex: 0, end: 10, int: 0, fai: 0, arc: 0 },
    primaryStat: 'end',
  },
  {
    id: 'weekly-output-speech',
    title: '知識の口伝',
    description: '今週読んだ本や学んだことの感想を、誰か1人に口で話す。',
    flavorTexts: [
      '知識は独り占めするな。言葉にすることで、それは血肉となる。',
      '内に秘めたる学びは腐る。口に出すことで、初めて魂に刻まれる。',
      '他者に語れ。汝の解釈は唯一ではない。語ることで、新たな視点が開く。',
    ],
    period: 'weekly',
    difficulty: 'weekly',
    stats: { str: 0, dex: 2, end: 0, int: 10, fai: 0, arc: 0 },
    primaryStat: 'int',
  },
  {
    id: 'weekly-week-reflection',
    title: '週の振り返り',
    description: '今週の歩みを3行で振り返り、来週1つだけ「変えたいこと」を決める。',
    flavorTexts: [
      '過ぎし七日を振り返れ。記録なき日々は、夢の如く消える。',
      '己の歩みを直視せよ。そこに、次への指針がある。',
      '繰り返すだけでは進まぬ。一度止まり、振り返る者が先へ行く。',
    ],
    period: 'weekly',
    difficulty: 'weekly',
    stats: { str: 0, dex: 0, end: 2, int: 5, fai: 5, arc: 0 },
    primaryStat: 'int',
  },
  {
    id: 'weekly-body-pledge',
    title: '肉体の誓約',
    description: '筋トレ・ストレッチ・ウォーキングのいずれかを、1セット以上行う。週1回。',
    flavorTexts: [
      '鈍りし肉体は魂を縛る。動かせ。汗は、淀んだ日々を流す。',
      '怠惰の垢を落とせ。週に一度の誓いが、体を覚ます。',
      '体が動けば、心も動く。今週は一度だけ、しっかりと。',
    ],
    period: 'weekly',
    difficulty: 'weekly',
    stats: { str: 10, dex: 0, end: 5, int: 0, fai: 0, arc: 0 },
    primaryStat: 'str',
  },

  // --- MONTHLY / 月間 (monthly): +25 程度・月1回の大目標 ---
  {
    id: 'monthly-full-absorption',
    title: '知識の完全吸収',
    description: '本を1冊、最後まで読み切る。今月中に。',
    flavorTexts: [
      '書物は沈黙の師。一冊を征する者は、知識の断片を手に入れる。',
      '積んであるままの本は呪いだ。開け。読め。終われ。',
      '月に一冊。その積み重ねが、汝の視界を変える。',
    ],
    period: 'monthly',
    difficulty: 'monthly',
    stats: { str: 0, dex: 0, end: 5, int: 25, fai: 0, arc: 0 },
    primaryStat: 'int',
  },
  {
    id: 'monthly-distant-pilgrimage',
    title: '遠方への巡礼',
    description: '普段行かない遠くの街へ足を運ぶ。今月中に1回。',
    flavorTexts: [
      '慣れし領域の外に、新たな世界あり。足を延ばせ。',
      '遠き地へ歩む者は、視界を広げる。今月は一度、足を運べ。',
      '同じ風景で終わるな。遠方への一歩が、魂を開く。',
    ],
    period: 'monthly',
    difficulty: 'monthly',
    stats: { str: 0, dex: 10, end: 8, int: 2, fai: 0, arc: 25 },
    primaryStat: 'arc',
  },
  {
    id: 'monthly-habit-ritual',
    title: '習慣の試練',
    description: '新たな習慣を1つ決め、今月中に14日以上続ける。',
    flavorTexts: [
      '十四日継続せよ。そこを越えれば、習慣は魂に刻まれる。',
      '日々の小さな一歩が、一月後には山を登った証となる。',
      '習慣とは誓いだ。貫け。月の半ばを超えれば、道は開ける。',
    ],
    period: 'monthly',
    difficulty: 'monthly',
    stats: { str: 0, dex: 0, end: 20, int: 0, fai: 25, arc: 0 },
    primaryStat: 'fai',
  },
  {
    id: 'monthly-deep-work',
    title: '深淵への集中',
    description: 'スマホを別室に置き、1つの作業に没頭する。今月中に1回以上。',
    flavorTexts: [
      '妨げを断て。己の仕事に沈め。深き集中こそ、真の成果を生む。',
      '浅き集中は塵の如し。深く潜れ。そこに真の成果あり。',
      '通知は誘惑だ。封じよ。静寂こそが、汝の力を引き出す。',
    ],
    period: 'monthly',
    difficulty: 'monthly',
    stats: { str: 0, dex: 0, end: 10, int: 25, fai: 0, arc: 0 },
    primaryStat: 'int',
  },
  {
    id: 'monthly-reading-circle',
    title: '輪読の誓約',
    description: '輪読会を企画する。日程を決め、1人以上を誘い、1回開催する。今月中に。',
    flavorTexts: [
      '独りで読むな。共に読め。言葉は分かち合うほどに輝く。',
      '企てよ。他者を集めよ。汝の意志が、場を創る。',
      '知識は独り占めするな。輪を作れ。そこに、新たな学びが生まれる。',
    ],
    period: 'monthly',
    difficulty: 'monthly',
    stats: { str: 0, dex: 5, end: 3, int: 10, fai: 5, arc: 25 },
    primaryStat: 'arc',
  },
]

/** 期間・難易度別に固定クエストを取得 */
export function getFixedQuestsByPeriod(period: QuestPeriod, difficulty?: string): FixedQuest[] {
  return FIXED_QUESTS.filter((q) => {
    if (q.period !== period) return false
    if (!difficulty) return true
    if (period === 'weekly') return q.difficulty === 'weekly'
    if (period === 'monthly') return q.difficulty === 'monthly'
    return q.difficulty === difficulty
  })
}

/** タイトルで固定クエストを検索し、stats を返す。見つからなければ null */
export function getFixedQuestStatsByTitle(title: string): QuestStats | null {
  const q = FIXED_QUESTS.find((x) => x.title === title)
  return q ? q.stats : null
}

/** タイトルで固定クエストを検索し、primaryStat を返す。見つからなければ null */
export function getFixedQuestPrimaryStatByTitle(title: string): PrimaryStat | null {
  const q = FIXED_QUESTS.find((x) => x.title === title)
  return q ? q.primaryStat : null
}

/** 固定クエストをランダムに抽出し、API形式に変換 */
export function sampleFixedQuests(
  period: QuestPeriod,
  count: number,
  difficulty?: string
): Array<{ title: string; description: string; flavorText?: string; stats: QuestStats; primaryStat: PrimaryStat }> {
  const pool = getFixedQuestsByPeriod(period, difficulty)
  if (pool.length === 0) return []

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))

  return selected.map((q) => {
    const flavorText = q.flavorTexts[Math.floor(Math.random() * q.flavorTexts.length)]
    return {
      title: q.title,
      description: q.description,
      flavorText,
      stats: q.stats,
      primaryStat: q.primaryStat,
    }
  })
}
