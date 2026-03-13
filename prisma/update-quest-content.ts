/**
 * カタログクエスト（非AIクエスト）のdescriptionとflavorTextsを更新するスクリプト
 * QuestHistoryは削除しない（安全な部分更新）
 *
 * 実行方法:
 *   npx tsx prisma/update-quest-content.ts
 *
 * 対象:
 *   - descriptionがnullまたは空のクエスト
 *   - flavorTextsが'[]'のクエスト
 *
 * 下記のフレーバーテキストは seed.ts と同期しています。
 * API経由での更新が難しい場合のフォールバックとして使用してください。
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** seed.tsと同じフレーバーテキスト（将来のDB直接更新用） */
const QUEST_UPDATES: Record<string, { description: string; flavorText: string }> = {
  'd_str_1': { description: 'スクワットや腕立てなど、任意の筋力トレーニングを「1回・1レップ」だけ実行する。', flavorText: '灰よ、一度でよい。その手に鉄を握り、大地に誓え。たった一つの動作が、腐りかけた肉を目覚めさせる。' },
  'd_str_2': { description: '立ち上がり、数十秒間しっかりとストレッチや体操をして身体全体をほぐす。', flavorText: '固まった血は、思考を濁らせる。立ち上がり、身体を揺さぶれ。それだけで、お前は昨日より遠い場所に立つ。' },
  'd_str_3': { description: '自分が「少しきつい」と思う負荷で、筋力トレーニングを1〜3セットやり切る。', flavorText: '限界など幻想だ。それは諦める理由を探す者が作り出した、甘い毒に過ぎぬ。今日、その毒を飲み干せ。' },
  'w_str_1': { description: '通勤や買い物の際、今まで通ったことのない「未知の道」を最低1本は通る。', flavorText: '慣れ親しんだ道は、汝を腐らせる。知らぬ路を踏め。その一歩が、新たな世界の扉を開く。' },
  'w_str_2': { description: '朝活や夜活として、とにかく歩く・走るなど、意図的に活動する時間を設ける。', flavorText: '身体とは道具なり。磨かざれば錆びる。今日、汝の器に目的を与えよ。' },
  'w_str_3': { description: '今日1日、エレベーターやエスカレーターを一切使わず、自分の足で階段を登り切る。', flavorText: '安楽への道を、自ら閉ざせ。不便という名の階段を登るたびに、汝の足は大地に深く根を張る。' },
  'm_str_1': { description: '生活圏を完全に離れ、自然豊かな場所や、まだ行ったことのない遠方の街へ足を運ぶ。', flavorText: '魂とは、動き続けることで保たれる。遠き地へ踏み出せ。生活圏という名の牢獄を、自ら破れ。' },
  'm_str_2': { description: '翌日に心地よい筋肉痛や疲労が残るレベルの、非日常的な身体負荷を1日かけて実行する。', flavorText: '疲弊した肉体こそ、証明の刻印。明日の痛みを、今日の栄誉として受け取れ。' },
  'm_str_3': { description: '今月の最長距離を歩く、自己最高重量を上げるなど、今月の身体的記録を1つ更新する。', flavorText: 'お前の記録は、昨日のお前が作ったものだ。今日のお前は、それを超えられるはずだ。' },

  'd_dex_1': { description: '目の前のゴミを1つ捨てる、またはPCの不要ファイルを1つ消す。', flavorText: 'ノイズは魂を食う。一つのゴミを除け。それだけで、お前の世界は僅かに澄む。' },
  'd_dex_2': { description: '机の上、シンクなど特定の「狭い1区画」のモノを全て本来の場所に戻す。', flavorText: '散乱とは、思考の写し鏡。汝の周囲を整えよ。環境が、魂の形を作る。' },
  'd_dex_3': { description: '掃除機などを使い、部屋の床や、普段掃除しない埃の溜まった場所を清掃する。', flavorText: '埃は記憶の堆積。汝の住まいは、汝の内面なり。清めよ、灰よ。' },
  'w_dex_1': { description: '靴、メガネ、キーボードなど毎日使う道具を1つ丁寧にメンテナンスする。', flavorText: '道具を愛でよ。それは汝の延長であり、汝の誠実さの証だ。' },
  'w_dex_2': { description: 'マウス操作をキーボードに置き換える等、より速い操作を1つ練習する。', flavorText: '一秒を千回軽んじれば、千秒が消える。技を磨けば、その積み重ねが汝を遠くへ運ぶ。' },
  'w_dex_3': { description: '未読メールの一括処理、不要アプリの複数削除、PCのDLフォルダの「完全空化」など、デジタルの淀みを一掃する。', flavorText: '電脳の淀みは、現実の淀み。見えぬ鎖を断ち切れ。汝のデジタルの魂よ、今こそ自由になれ。' },
  'm_dex_1': { description: '普段使っている鞄（バッグ）または財布の中身を一度すべて外に出し、不要なものを捨てて収納し直す。', flavorText: '持ちすぎれば、動けなくなる。全てを一度外に出せ。本当に必要なものだけを、再び選べ。' },
  'm_dex_2': { description: '今まで使ったことのない新しいアプリやツールを1つ調べて実行する。', flavorText: '使わぬ術は、知識でなく荷物だ。一つ、新しい術を手に取り、その感触を確かめよ。' },
  'm_dex_3': { description: '定型文登録、マクロ、新しいAIプロンプト等、今後の作業時間を恒久的に短縮する「仕組み」を1つ作る。', flavorText: '賢者は繰り返さぬ。一度作った道を何度も歩くは愚か。今日、永久の近道を一本刻め。' },

  'd_end_1': { description: 'コップ1杯の水を飲み干し、内なる巡りを促す。', flavorText: '水は魂の源。杯一杯、体の奥まで届けよ。お前の器は、そのために在る。' },
  'd_end_2': { description: '秤の上に立ち、現在の自らの質量（体重）を数字として記録する。', flavorText: '計ることを恐れるな。数字は現実であり、出発点だ。己を知らぬ者に、前進はない。' },
  'd_end_3': { description: 'フロスを使い、歯の間の淀みを一つ残らず取り除く。', flavorText: '小さな怠惰が、大きな崩壊を生む。今日、歯の隙間の淀みを一つ残らず清めよ。' },
  'w_end_1': { description: 'シャワーだけで済ませず、しっかりと湯船に浸かって肉体の疲労を抜く。', flavorText: '疲れた肉体に、水の祝福を。シャワーだけの巡礼者よ、今日だけは深く沈め。' },
  'w_end_2': { description: 'ベッドシーツや枕カバーを洗濯し、睡眠環境を完全にリセットする。', flavorText: '眠りは、次の戦いへの準備だ。その場を清めることが、明日の汝への最大の礼儀となる。' },
  'w_end_3': { description: '意図的に夜更かしを避け、普段より1時間以上長く、良質な睡眠時間を確保する。', flavorText: '夜更かしは、明日の汝を殺す行為だ。今宵は早く目を閉じよ。それが最大の抵抗となる。' },
  'm_end_1': { description: '美容院、歯医者、整体など、プロに身体をメンテナンスしてもらう予約を入れる（または受診する）。', flavorText: '道具は定期的に整備せよ。汝の身体も然り。プロの目に委ねることを、恥と思うな。' },
  'm_end_2': { description: '1食抜く、あるいは1日だけ極端に消化の良いものだけを食べ、胃腸を休ませる。', flavorText: '与え続ければ、器は壊れる。一度だけ、何も与えるな。その沈黙が、肉を再生させる。' },
  'm_end_3': { description: '予定やタスクを一切入れず、ひたすら心身の回復（END）だけを目的とした究極の休日を1日過ごす。', flavorText: '何もしない一日は、弱さではない。真の意味での回復は、何も追わぬ日にのみ訪れる。' },

  'd_int_1': { description: 'ジャンルを問わず、任意の書籍を開いて1ページだけ活字を読む。', flavorText: '一頁でよい。文字の海に指を浸せ。知の芽は、そのわずかな接触から育ち始める。' },
  'd_int_2': { description: '今日直面した「わからないこと」や「疑問」を、一つだけ書き留める。', flavorText: '疑問を流すな。それは汝の魂が発した信号だ。書き留めよ、灰よ。後に黄金となる。' },
  'd_int_3': { description: '今日学んだこと、または読んだニュースの要点を「3行」でメモにまとめる。', flavorText: '砂金は砂の中にある。今日出会った情報から、本物を三行で抽出せよ。' },
  'w_int_1': { description: '今週の「わからないことリスト」を見返し、調べて理解した上でチェックを入れ、1つ消化する。', flavorText: '疑問は、解かれるまで魂の重石となる。一つだけ、今日それを消化せよ。' },
  'w_int_2': { description: '今週を振り返り、来週絶対に達成したい「一番重要なこと（目標）」を1つだけ書き出す。', flavorText: '目的なき歩みは、地を踏み荒らすだけだ。来週、汝が目指す星を一つ定めよ。' },
  'w_int_3': { description: '書店や図書館に実際に足を運び、普段は絶対に読まないジャンルの棚を一つ眺める。', flavorText: '書の海を前に立つだけでよい。その香りと圧力が、眠った知への渇望を呼び覚ます。' },
  'm_int_1': { description: '今月学んだ最も有用な知識やツールを、誰か（またはSNS）に1つだけシェアする。', flavorText: '知識は、外に出されることで初めて完成する。一つ、今月の収穫を誰かへ渡せ。' },
  'm_int_2': { description: '読みかけの技術書、ビジネス書、あるいは文学など、本を「1冊最後まで」読み切る。', flavorText: '最後まで読み切ることは、著者との約束を果たすことだ。今月、一冊の旅を完結させよ。' },
  'm_int_3': { description: '今月の軌跡を振り返り、来月達成したい「一番ワクワクする特大の目標」を書き出す。', flavorText: '月の終わりに立ち止まれ。振り返り、次の大きな問いを一つだけ定めよ。' },

  'd_fai_1': { description: '窓を開け、停滞した部屋の空気を新しいものへと入れ替える。', flavorText: '澱んだ空気の中では、魂も濁る。窓を開け、外界の息吹を一つ取り込め。' },
  'd_fai_2': { description: '今日、誰かと交わす最初の挨拶を、普段より少しだけ大きく、はっきりと放つ。', flavorText: '声は、魂の外郭だ。今日、その声を少しだけ大きく世界へ放て。' },
  'd_fai_3': { description: '他者のために、見返りを求めない小さな善行を1つ行う。（席を譲る、扉を開けて待つなど）', flavorText: '見返りを求めぬ善行は、魂に光を灯す。小さくてよい。今日一つ、誰かのために動け。' },
  'w_fai_1': { description: '今週お世話になった身近な人（家族や同僚）に、意識して明確な「ありがとう」を伝える。', flavorText: '感謝は、心の中だけでは機能しない。言葉にして初めて、それは相手の魂に届く。' },
  'w_fai_2': { description: '換気扇や排水溝など、普段掃除しない場所を1箇所だけ清掃し、環境の淀みを祓う。', flavorText: '見えぬところに淀みが溜まる。今週、普段の光が届かぬ場所を一箇所だけ清めよ。' },
  'w_fai_3': { description: '誰かとの会話で、自分の意見やアドバイスを一切挟まず、相手の話を100%引き出し受け止める。', flavorText: '汝の意見は、ひとまず棚に置け。今日、ただ受け取るだけの器になれ。' },
  'm_fai_1': { description: '今月失敗したことや後悔していることを1つ紙に書き出し、自分を許して捨てる（破る）。', flavorText: '失敗した自分を、紙に書いて葬れ。その儀式こそが、汝を前に進ませる鍵だ。' },
  'm_fai_2': { description: '家族や日頃お世話になっている人へ、ちょっとした差し入れや手紙など「小さな贈り物」をする。', flavorText: '受け取った恩は、何かを通して形に変えて返せ。感謝は、行動になったとき完成する。' },
  'm_fai_3': { description: '神社仏閣、あるいはお墓参りなど、静謐な場所へ足を運び、感謝を伝えて精神の軸を整える。', flavorText: '静謐な場所は、ざわめいた魂を鎮める。足を運べ。そこに答えはなくとも、問いが洗われる。' },

  'd_arc_1': { description: '空を見上げる、または普段見ない景色を数秒だけ観察し、新しい発見を1つする。', flavorText: '一度だけ、空を仰げ。どれだけの未知が、今日もお前の頭上を流れているか。' },
  'd_arc_2': { description: '今日あった「良かったこと」や「新しい発見」を1つだけ、言葉にして書き出す。', flavorText: '今日の光を、言葉に変えよ。記録されぬ出来事は、やがて夢の泡となり消える。' },
  'd_arc_3': { description: '普段全く聴かないジャンルの音楽を1曲聴く、または全く知らない単語を1つ調べる。', flavorText: '違和感こそが成長の扉だ。今日、脳が拒絶するものに一指だけ触れよ。' },
  'w_arc_1': { description: '昼食のメニューや買うものを、迷わず「直感（3秒以内）」だけで即断即決する。', flavorText: '迷う時間は、魂を磨り減らす。3秒以内に答えよ。汝の奥底が、既に答えを知っている。' },
  'w_arc_2': { description: '思いついたアイデア、ポエム、落書きなど、形にならない「表現」をノートに描き殴る。', flavorText: '形にならなくてよい。頭の中の霧を、ノートに吐き出せ。そこに神秘の萌芽がある。' },
  'w_arc_3': { description: '目的を決めずに散歩に出かけ、直感の赴くままに普段通らない道を彷徨う。', flavorText: '目的なき旅こそが、最も遠い場所へと連れて行く。迷え、灰よ。その先に何かある。' },
  'm_arc_1': { description: '「自分には合わない」「興味がない」と思っていたコンテンツ（動画や本など）に1つ触れてみる。', flavorText: '「合わない」という思い込みは、汝が作った壁だ。一度だけ、その壁の向こうを覗け。' },
  'm_arc_2': { description: '一人カラオケで大声で歌うなど、感情や直感を他人の目を気にせず100%外部に放出する。', flavorText: '感情は、外に出されなければ汝を内側から腐らせる。今月、全力で放出する機会を一つ作れ。' },
  'm_arc_3': { description: '一切の事前情報やレビューを見ずに、直感だけで選んだ映画を観る、または飲食店に入る。', flavorText: '情報に縛られた選択は、汝の魂の声を消す。今回だけ、全てを捨てて直感に従え。' },
}

async function main() {
  console.log('カタログクエストのdescription/flavorTextsを更新します...')

  const allQuests = await prisma.quest.findMany({
    where: { id: { not: { startsWith: 'ai-' } } },
  })

  let updatedCount = 0
  let skippedCount = 0

  for (const quest of allQuests) {
    const update = QUEST_UPDATES[quest.id]
    if (!update) {
      console.log(`  スキップ (定義なし): ${quest.id} - ${quest.title}`)
      skippedCount++
      continue
    }

    const needsDescriptionUpdate = !quest.description || quest.description.trim() === ''
    const needsFlavorUpdate = quest.flavorTexts === '[]' || quest.flavorTexts === ''

    if (!needsDescriptionUpdate && !needsFlavorUpdate) {
      console.log(`  スキップ (既に設定済み): ${quest.id} - ${quest.title}`)
      skippedCount++
      continue
    }

    const newDescription = needsDescriptionUpdate ? update.description : quest.description
    const newFlavorTexts = needsFlavorUpdate ? JSON.stringify([update.flavorText]) : quest.flavorTexts

    await prisma.quest.update({
      where: { id: quest.id },
      data: { description: newDescription, flavorTexts: newFlavorTexts },
    })

    console.log(`  更新: ${quest.id} - ${quest.title}`)
    updatedCount++
  }

  console.log(`\n完了: ${updatedCount}件更新, ${skippedCount}件スキップ`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('更新エラー:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
