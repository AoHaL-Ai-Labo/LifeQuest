/**
 * Prisma シードスクリプト
 * 54個の初期クエストデータを Quest テーブルに投入
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const QUESTS = [
  // --- 【筋力 STR】全9クエスト ---
  { id: 'd_str_1', title: '単一の挙上', description: 'スクワットや腕立てなど、任意の筋力トレーニングを「1回・1レップ」だけ実行する。', period: 'daily' as const, difficulty: 'beginner', primaryStat: 'str', statsExp: '{"str":1,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'd_str_2', title: '血流の覚醒', description: '立ち上がり、数十秒間しっかりとストレッチや体操をして身体全体をほぐす。', period: 'daily' as const, difficulty: 'intermediate', primaryStat: 'str', statsExp: '{"str":1,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'd_str_3', title: '限界への挑戦', description: '自分が「少しきつい」と思う負荷で、筋力トレーニングを1〜3セットやり切る。', period: 'daily' as const, difficulty: 'advanced', primaryStat: 'str', statsExp: '{"str":1,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'w_str_1', title: '未踏の領域への行軍', description: '通勤や買い物の際、今まで通ったことのない「未知の道」を最低1本は通る。', period: 'weekly' as const, difficulty: 'beginner', primaryStat: 'str', statsExp: '{"str":2,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'w_str_2', title: '大地の鼓動の踏破', description: '朝活や夜活として、とにかく歩く・走るなど、意図的に活動する時間を設ける。', period: 'weekly' as const, difficulty: 'intermediate', primaryStat: 'str', statsExp: '{"str":2,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'w_str_3', title: '重力の拒絶', description: '今日1日、エレベーターやエスカレーターを一切使わず、自分の足で階段を登り切る。', period: 'weekly' as const, difficulty: 'advanced', primaryStat: 'str', statsExp: '{"str":2,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'm_str_1', title: '辺境への大遠征', description: '生活圏を完全に離れ、自然豊かな場所や、まだ行ったことのない遠方の街へ足を運ぶ。', period: 'monthly' as const, difficulty: 'beginner', primaryStat: 'str', statsExp: '{"str":3,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'm_str_2', title: '肉体の完全燃焼', description: '翌日に心地よい筋肉痛や疲労が残るレベルの、非日常的な身体負荷を1日かけて実行する。', period: 'monthly' as const, difficulty: 'intermediate', primaryStat: 'str', statsExp: '{"str":3,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'm_str_3', title: '肉の器の限界突破', description: '今月の最長距離を歩く、自己最高重量を上げるなど、今月の身体的記録を1つ更新する。', period: 'monthly' as const, difficulty: 'advanced', primaryStat: 'str', statsExp: '{"str":3,"dex":0,"end":0,"int":0,"fai":0,"arc":0}' },
  // --- 【技量 DEX】全9クエスト ---
  { id: 'd_dex_1', title: '1点のノイズ排除', description: '目の前のゴミを1つ捨てる、またはPCの不要ファイルを1つ消す。', period: 'daily' as const, difficulty: 'beginner', primaryStat: 'dex', statsExp: '{"str":0,"dex":1,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'd_dex_2', title: '局地的な空間制圧', description: '机の上、シンクなど特定の「狭い1区画」のモノを全て本来の場所に戻す。', period: 'daily' as const, difficulty: 'intermediate', primaryStat: 'dex', statsExp: '{"str":0,"dex":1,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'd_dex_3', title: '魔導器具の駆動', description: '掃除機などを使い、部屋の床や、普段掃除しない埃の溜まった場所を清掃する。', period: 'daily' as const, difficulty: 'advanced', primaryStat: 'dex', statsExp: '{"str":0,"dex":1,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'w_dex_1', title: '相棒の研磨', description: '靴、メガネ、キーボードなど毎日使う道具を1つ丁寧にメンテナンスする。', period: 'weekly' as const, difficulty: 'beginner', primaryStat: 'dex', statsExp: '{"str":0,"dex":2,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'w_dex_2', title: 'ショートカットの習得', description: 'マウス操作をキーボードに置き換える等、より速い操作を1つ練習する。', period: 'weekly' as const, difficulty: 'intermediate', primaryStat: 'dex', statsExp: '{"str":0,"dex":2,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'w_dex_3', title: '電脳空間の大掃除', description: '未読メールの一括処理、不要アプリの複数削除、PCのDLフォルダの「完全空化」など、デジタルの淀みを一掃する。', period: 'weekly' as const, difficulty: 'advanced', primaryStat: 'dex', statsExp: '{"str":0,"dex":2,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'm_dex_1', title: 'インベントリの初期化', description: '普段使っている鞄（バッグ）または財布の中身を一度すべて外に出し、不要なものを捨てて収納し直す。', period: 'monthly' as const, difficulty: 'beginner', primaryStat: 'dex', statsExp: '{"str":0,"dex":3,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'm_dex_2', title: '未知なる術式の行使', description: '今まで使ったことのない新しいアプリやツールを1つ調べて実行する。', period: 'monthly' as const, difficulty: 'intermediate', primaryStat: 'dex', statsExp: '{"str":0,"dex":3,"end":0,"int":0,"fai":0,"arc":0}' },
  { id: 'm_dex_3', title: '自動化の構築', description: '定型文登録、マクロ、新しいAIプロンプト等、今後の作業時間を恒久的に短縮する「仕組み」を1つ作る。', period: 'monthly' as const, difficulty: 'advanced', primaryStat: 'dex', statsExp: '{"str":0,"dex":3,"end":0,"int":0,"fai":0,"arc":0}' },
  // --- 【持久 END】全9クエスト ---
  { id: 'd_end_1', title: '清水の杯', description: 'コップ1杯の水を飲み干し、内なる巡りを促す。', period: 'daily' as const, difficulty: 'beginner', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":1,"int":0,"fai":0,"arc":0}' },
  { id: 'd_end_2', title: '器の観測', description: '秤の上に立ち、現在の自らの質量（体重）を数字として記録する。', period: 'daily' as const, difficulty: 'intermediate', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":1,"int":0,"fai":0,"arc":0}' },
  { id: 'd_end_3', title: '細き糸の浄化', description: 'フロスを使い、歯の間の淀みを一つ残らず取り除く。', period: 'daily' as const, difficulty: 'advanced', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":1,"int":0,"fai":0,"arc":0}' },
  { id: 'w_end_1', title: '温水による浄化', description: 'シャワーだけで済ませず、しっかりと湯船に浸かって肉体の疲労を抜く。', period: 'weekly' as const, difficulty: 'beginner', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":2,"int":0,"fai":0,"arc":0}' },
  { id: 'w_end_2', title: '休息の寝床の再構築', description: 'ベッドシーツや枕カバーを洗濯し、睡眠環境を完全にリセットする。', period: 'weekly' as const, difficulty: 'intermediate', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":2,"int":0,"fai":0,"arc":0}' },
  { id: 'w_end_3', title: '聖なる眠りの儀式', description: '意図的に夜更かしを避け、普段より1時間以上長く、良質な睡眠時間を確保する。', period: 'weekly' as const, difficulty: 'advanced', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":2,"int":0,"fai":0,"arc":0}' },
  { id: 'm_end_1', title: '器の保守点検', description: '美容院、歯医者、整体など、プロに身体をメンテナンスしてもらう予約を入れる（または受診する）。', period: 'monthly' as const, difficulty: 'beginner', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":3,"int":0,"fai":0,"arc":0}' },
  { id: 'm_end_2', title: '内臓の休息', description: '1食抜く、あるいは1日だけ極端に消化の良いものだけを食べ、胃腸を休ませる。', period: 'monthly' as const, difficulty: 'intermediate', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":3,"int":0,"fai":0,"arc":0}' },
  { id: 'm_end_3', title: '完全なる空白の1日', description: '予定やタスクを一切入れず、ひたすら心身の回復（END）だけを目的とした究極の休日を1日過ごす。', period: 'monthly' as const, difficulty: 'advanced', primaryStat: 'end', statsExp: '{"str":0,"dex":0,"end":3,"int":0,"fai":0,"arc":0}' },
  // --- 【理力 INT】全9クエスト ---
  { id: 'd_int_1', title: '一頁の思索', description: 'ジャンルを問わず、任意の書籍を開いて1ページだけ活字を読む。', period: 'daily' as const, difficulty: 'beginner', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":1,"fai":0,"arc":0}' },
  { id: 'd_int_2', title: '未知の片鱗を刻む', description: '今日直面した「わからないこと」や「疑問」を、一つだけ書き留める。', period: 'daily' as const, difficulty: 'intermediate', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":1,"fai":0,"arc":0}' },
  { id: 'd_int_3', title: '叡智の抽出', description: '今日学んだこと、または読んだニュースの要点を「3行」でメモにまとめる。', period: 'daily' as const, difficulty: 'advanced', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":1,"fai":0,"arc":0}' },
  { id: 'w_int_1', title: '知の昇華', description: '今週の「わからないことリスト」を見返し、調べて理解した上でチェックを入れ、1つ消化する。', period: 'weekly' as const, difficulty: 'beginner', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":2,"fai":0,"arc":0}' },
  { id: 'w_int_2', title: '時の羅針盤の調整', description: '今週を振り返り、来週絶対に達成したい「一番重要なこと（目標）」を1つだけ書き出す。', period: 'weekly' as const, difficulty: 'intermediate', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":2,"fai":0,"arc":0}' },
  { id: 'w_int_3', title: '叡智の集積所への到達', description: '書店や図書館に実際に足を運び、普段は絶対に読まないジャンルの棚を一つ眺める。', period: 'weekly' as const, difficulty: 'advanced', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":2,"fai":0,"arc":0}' },
  { id: 'm_int_1', title: '知の共有', description: '今月学んだ最も有用な知識やツールを、誰か（またはSNS）に1つだけシェアする。', period: 'monthly' as const, difficulty: 'beginner', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":3,"fai":0,"arc":0}' },
  { id: 'm_int_2', title: '叡智の書、読破', description: '読みかけの技術書、ビジネス書、あるいは文学など、本を「1冊最後まで」読み切る。', period: 'monthly' as const, difficulty: 'intermediate', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":3,"fai":0,"arc":0}' },
  { id: 'm_int_3', title: '新たなる神託の受領', description: '今月の軌跡を振り返り、来月達成したい「一番ワクワクする特大の目標」を書き出す。', period: 'monthly' as const, difficulty: 'advanced', primaryStat: 'int', statsExp: '{"str":0,"dex":0,"end":0,"int":3,"fai":0,"arc":0}' },
  // --- 【信仰 FAI】全9クエスト ---
  { id: 'd_fai_1', title: '外界の光を取り込む', description: '窓を開け、停滞した部屋の空気を新しいものへと入れ替える。', period: 'daily' as const, difficulty: 'beginner', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":1,"arc":0}' },
  { id: 'd_fai_2', title: '共鳴の波紋', description: '今日、誰かと交わす最初の挨拶を、普段より少しだけ大きく、はっきりと放つ。', period: 'daily' as const, difficulty: 'intermediate', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":1,"arc":0}' },
  { id: 'd_fai_3', title: '利他の波紋', description: '他者のために、見返りを求めない小さな善行を1つ行う。（席を譲る、扉を開けて待つなど）', period: 'daily' as const, difficulty: 'advanced', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":1,"arc":0}' },
  { id: 'w_fai_1', title: '祈りの言語化', description: '今週お世話になった身近な人（家族や同僚）に、意識して明確な「ありがとう」を伝える。', period: 'weekly' as const, difficulty: 'beginner', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":2,"arc":0}' },
  { id: 'w_fai_2', title: '神殿の深層浄化', description: '換気扇や排水溝など、普段掃除しない場所を1箇所だけ清掃し、環境の淀みを祓う。', period: 'weekly' as const, difficulty: 'intermediate', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":2,"arc":0}' },
  { id: 'w_fai_3', title: '沈黙の傾聴', description: '誰かとの会話で、自分の意見やアドバイスを一切挟まず、相手の話を100%引き出し受け止める。', period: 'weekly' as const, difficulty: 'advanced', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":2,"arc":0}' },
  { id: 'm_fai_1', title: '自己への恩赦', description: '今月失敗したことや後悔していることを1つ紙に書き出し、自分を許して捨てる（破る）。', period: 'monthly' as const, difficulty: 'beginner', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":3,"arc":0}' },
  { id: 'm_fai_2', title: '恩寵の還元', description: '家族や日頃お世話になっている人へ、ちょっとした差し入れや手紙など「小さな贈り物」をする。', period: 'monthly' as const, difficulty: 'intermediate', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":3,"arc":0}' },
  { id: 'm_fai_3', title: '聖地への巡礼', description: '神社仏閣、あるいはお墓参りなど、静謐な場所へ足を運び、感謝を伝えて精神の軸を整える。', period: 'monthly' as const, difficulty: 'advanced', primaryStat: 'fai', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":3,"arc":0}' },
  // --- 【神秘 ARC】全9クエスト ---
  { id: 'd_arc_1', title: '未知の観測', description: '空を見上げる、または普段見ない景色を数秒だけ観察し、新しい発見を1つする。', period: 'daily' as const, difficulty: 'beginner', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":1}' },
  { id: 'd_arc_2', title: '光の言語化（Good&New）', description: '今日あった「良かったこと」や「新しい発見」を1つだけ、言葉にして書き出す。', period: 'daily' as const, difficulty: 'intermediate', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":1}' },
  { id: 'd_arc_3', title: '別次元への接続', description: '普段全く聴かないジャンルの音楽を1曲聴く、または全く知らない単語を1つ調べる。', period: 'daily' as const, difficulty: 'advanced', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":1}' },
  { id: 'w_arc_1', title: '直感の行使', description: '昼食のメニューや買うものを、迷わず「直感（3秒以内）」だけで即断即決する。', period: 'weekly' as const, difficulty: 'beginner', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":2}' },
  { id: 'w_arc_2', title: '創造の火種', description: '思いついたアイデア、ポエム、落書きなど、形にならない「表現」をノートに描き殴る。', period: 'weekly' as const, difficulty: 'intermediate', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":2}' },
  { id: 'w_arc_3', title: '偶然の漂流', description: '目的を決めずに散歩に出かけ、直感の赴くままに普段通らない道を彷徨う。', period: 'weekly' as const, difficulty: 'advanced', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":2}' },
  { id: 'm_arc_1', title: '概念の破壊', description: '「自分には合わない」「興味がない」と思っていたコンテンツ（動画や本など）に1つ触れてみる。', period: 'monthly' as const, difficulty: 'beginner', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":3}' },
  { id: 'm_arc_2', title: '自己の解放', description: '一人カラオケで大声で歌うなど、感情や直感を他人の目を気にせず100%外部に放出する。', period: 'monthly' as const, difficulty: 'intermediate', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":3}' },
  { id: 'm_arc_3', title: '未知なる世界への跳躍', description: '一切の事前情報やレビューを見ずに、直感だけで選んだ映画を観る、または飲食店に入る。', period: 'monthly' as const, difficulty: 'advanced', primaryStat: 'arc', statsExp: '{"str":0,"dex":0,"end":0,"int":0,"fai":0,"arc":3}' },
]

async function main() {
  console.log('Resetting Quest table...')
  await prisma.questHistory.deleteMany()
  await prisma.quest.deleteMany()

  console.log(`Seeding ${QUESTS.length} quests...`)
  await prisma.quest.createMany({
    data: QUESTS.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      period: q.period,
      difficulty: q.difficulty,
      primaryStat: q.primaryStat,
      statsExp: q.statsExp,
      flavorTexts: '[]',
    })),
  })

  console.log(`Seeded ${QUESTS.length} quests.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
