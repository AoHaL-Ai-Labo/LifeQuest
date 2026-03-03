/**
 * Life Quest: プレイヤーステータス（Level, EXP, Rank, Prefix）
 * localStorage で永続化。既存UIは変更せず状態のみ配線する。
 * 6ステータス（stats）と努力値（hiddenExp）を管理し、レベルアップ時に特化属性を+1する。
 */

import { isReborn } from './reborn'
import { addQuestExp, processLevelUp } from './statusEngine'
import type { PrimaryStat } from './quest-types'

const STORAGE_KEY = 'quest-log:playerStatus'

/** 6属性の実際のステータスレベル（初期値はすべて10・持たざる者に倣う） */
export type PlayerStats = { str: number; dex: number; end: number; int: number; fai: number; arc: number }

/** 6属性の裏の努力値（レベルアップ判定用、初期値はすべて0） */
export type PlayerHiddenExp = { str: number; dex: number; end: number; int: number; fai: number; arc: number }

const DEFAULT_STATS: PlayerStats = { str: 10, dex: 10, end: 10, int: 10, fai: 10, arc: 10 }
const DEFAULT_HIDDEN_EXP: PlayerHiddenExp = { str: 0, dex: 0, end: 0, int: 0, fai: 0, arc: 0 }

/** レベル上限。到達時に「火を継ぐ」転生が可能 */
export const MAX_LEVEL = 50
const CLEAR_HISTORY_KEY = 'quest-log:clearHistory'
const STREAK_KEY = 'quest-log:streak'
const STREAK_CLAIMED_KEY = 'quest-log:streakClaimed'

export interface PlayerStatus {
  level: number
  exp: number
  rank: string
  prefix: string
  /** 転生回数（火を継いだ回数）。強くてニューゲームの解放条件に使用 */
  prestigeCount: number
  /** 次レベルまでに必要なEXP（現在レベルから） */
  expToNext: number
  /** レベル帯 1〜5（テーマ用） */
  tier: 1 | 2 | 3 | 4 | 5
  /** 6属性の実際のステータスレベル。初期値はすべて10（持たざる者に倣う）。未設定時は DEFAULT_STATS で補完 */
  stats?: PlayerStats
  /** 6属性の裏の努力値（レベルアップ判定用）。初期値はすべて0。未設定時は DEFAULT_HIDDEN_EXP で補完 */
  hiddenExp?: PlayerHiddenExp
  /** ユーザーコンテキスト（パーソナライズ用） */
  context?: {
    environment?: string
    weaknesses?: string
  }
}

/** レベルから階位（Rank）を取得 */
const RANK_MAP: Record<number, string> = {
  1: '死人',
  5: '澱みの灰',
  10: '枷なき亡者',
  15: '境界の彷徨い人',
  20: '異端の旅人',
  25: '探求の従者',
  30: '誓約の騎士',
  35: '深淵を歩く者',
  40: '混沌の狩人',
  45: '灰の英雄',
  50: '忘却の賢者',
  55: '真理の解読者',
  60: '魂の錬金術師',
  65: '星見の預言者',
  70: '暁の執行者',
  75: '聖騎士',
  80: '奇跡の代行者',
  85: '無垢なる太陽',
  90: '運命の紡ぎ手',
  95: '世界の観測者',
  99: '概念の超越者',
}

function getRankForLevel(level: number): string {
  if (level >= 99) return RANK_MAP[99]
  if (level >= 50) return RANK_MAP[50]
  let rank = RANK_MAP[1]
  for (const [l, r] of Object.entries(RANK_MAP)) {
    const lv = parseInt(l, 10)
    if (level >= lv) rank = r
  }
  return rank
}

/** 転生者のRank表示用（★付き） */
export function getDisplayRank(level: number): string {
  const rank = getRankForLevel(level)
  return isReborn() ? `★${rank}` : rank
}

/**
 * 次レベルまでに必要なEXP。
 * 転生者（isReborn）は1.75倍の業を必要とする（ハードモード）。
 */
function getExpToNextLevel(level: number): number {
  if (level >= 99) return 0
  if (level >= MAX_LEVEL) return 0
  let base: number
  if (level < 20) {
    base = 7 + level * 2 // Lv1:9, Lv2:11, Lv3:13, ... Lv19:45
  } else {
    base = 50 + (level - 20) * 15
  }
  if (isReborn()) return Math.floor(base * 1.75)
  return base
}

/** クエスト解放は quest-unlock.ts のマトリクスを参照 */

/** レベル帯（テーマ色用）1=モノクロ, 2=序盤, 3=ネオンオレンジ, 4=ディープパープル, 5=黄金/神聖 */
export function getTier(level: number): 1 | 2 | 3 | 4 | 5 {
  return getTierFromLevel(level)
}

function getTierFromLevel(level: number): 1 | 2 | 3 | 4 | 5 {
  if (level >= 99) return 5
  if (level >= 70) return 5
  if (level >= 40) return 4
  if (level >= 20) return 3
  return level >= 1 ? 2 : 1
}

function mergeStats(parsed: Record<string, unknown>, key: string, defaultVal: PlayerStats): PlayerStats {
  const raw = parsed[key]
  if (typeof raw !== 'object' || raw === null) return defaultVal
  const o = raw as Record<string, unknown>
  const result: PlayerStats = {
    str: Math.max(0, Number(o.str) ?? defaultVal.str),
    dex: Math.max(0, Number(o.dex) ?? defaultVal.dex),
    end: Math.max(0, Number(o.end) ?? defaultVal.end),
    int: Math.max(0, Number(o.int) ?? defaultVal.int),
    fai: Math.max(0, Number(o.fai) ?? defaultVal.fai),
    arc: Math.max(0, Number(o.arc) ?? defaultVal.arc),
  }
  const sum = result.str + result.dex + result.end + result.int + result.fai + result.arc
  if (sum === 0) return defaultVal
  if (result.str <= 1 && result.dex <= 1 && result.end <= 1 && result.int <= 1 && result.fai <= 1 && result.arc <= 1) return defaultVal
  return result
}

export function loadPlayerStatus(): PlayerStatus {
  if (typeof window === 'undefined') {
    return getDefaultStatus(1)
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultStatus(1)
    const parsed = JSON.parse(raw) as {
      level?: number;
      exp?: number;
      prefix?: string;
      prestigeCount?: number;
      stats?: Record<string, number>;
      hiddenExp?: Record<string, number>;
      context?: { environment?: string; weaknesses?: string };
    }
    const level = Math.min(MAX_LEVEL, Math.max(1, Number(parsed.level) || 1))
    const exp = Math.max(0, Number(parsed.exp) ?? 0)
    const prefix = typeof parsed.prefix === 'string' ? parsed.prefix : ''
    const prestigeCount = Math.max(0, Math.floor(Number(parsed.prestigeCount) ?? 0))
    const rank = getDisplayRank(level)
    const expToNext = getExpToNextLevel(level)
    const tier = getTierFromLevel(level)
    const stats = mergeStats(parsed as Record<string, unknown>, 'stats', DEFAULT_STATS)
    const hiddenExp = mergeStats(parsed as Record<string, unknown>, 'hiddenExp', DEFAULT_HIDDEN_EXP)
    const context = parsed.context
    return { level, exp, rank, prefix, prestigeCount, expToNext, tier, stats, hiddenExp, context }
  } catch {
    return getDefaultStatus(1)
  }
}

function getDefaultStatus(level: number): PlayerStatus {
  const rank = getDisplayRank(level)
  const expToNext = getExpToNextLevel(level)
  const tier = getTierFromLevel(level)
  return {
    level,
    exp: 0,
    rank,
    prefix: '',
    prestigeCount: 0,
    expToNext,
    tier,
    stats: { ...DEFAULT_STATS },
    hiddenExp: { ...DEFAULT_HIDDEN_EXP },
  }
}

export function savePlayerStatus(status: Omit<PlayerStatus, 'expToNext' | 'tier'>): void {
  if (typeof window === 'undefined') return
  try {
    const level = Math.min(MAX_LEVEL, Math.max(1, status.level))
    const payload = {
      level,
      exp: status.exp,
      rank: status.rank,
      prefix: status.prefix ?? '',
      prestigeCount: Math.max(0, status.prestigeCount ?? 0),
      stats: status.stats ?? DEFAULT_STATS,
      hiddenExp: status.hiddenExp ?? DEFAULT_HIDDEN_EXP,
      context: status.context,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

/** 二つ名（Prefix）のみ更新（/api/title 取得後に呼ぶ） */
export function updatePrefix(prefix: string): void {
  if (typeof window === 'undefined') return
  try {
    const current = loadPlayerStatus()
    savePlayerStatus({ ...current, prefix })
  } catch {
    // ignore
  }
}

/** クエストクリア時のオプション（primaryStat と period が渡されると hiddenExp を蓄積） */
export interface AddQuestOptions {
  primaryStat: PrimaryStat
  period: 'daily' | 'weekly' | 'monthly'
}

/**
 * クエストクリア時にEXPを加算し、レベルアップがあれば true を返す。
 * questOptions が渡された場合、primaryStat に応じた hiddenExp を加算する。
 * レベルアップ時は hiddenExp の最大属性に stats を +1 し、hiddenExp を 0 にリセットする。
 * 呼び出し側でレベルアップ時に /api/title を叩く想定。
 */
export function addExpAndLevelUp(
  current: PlayerStatus,
  expGain: number,
  questOptions?: AddQuestOptions
): { newStatus: PlayerStatus; leveledUp: boolean } {
  let { level, exp, stats, hiddenExp } = current
  const safeStats = stats ?? { ...DEFAULT_STATS }
  let safeHiddenExp = hiddenExp ?? { ...DEFAULT_HIDDEN_EXP }

  if (questOptions) {
    safeHiddenExp = addQuestExp(safeHiddenExp, questOptions.primaryStat, questOptions.period)
  }

  let expToNext = getExpToNextLevel(level)
  let leveledUp = false

  let remaining = exp + expGain
  while (level < MAX_LEVEL && remaining >= expToNext) {
    remaining -= expToNext
    level += 1
    leveledUp = true
    const processed = processLevelUp(safeStats, safeHiddenExp)
    Object.assign(safeStats, processed.stats)
    safeHiddenExp = processed.hiddenExp
    expToNext = getExpToNextLevel(level)
  }

  const expCurrent = level >= MAX_LEVEL ? 0 : remaining
  const rank = getDisplayRank(level)
  const tier = getTierFromLevel(level)
  const newStatus: PlayerStatus = {
    level,
    exp: expCurrent,
    rank,
    prefix: current.prefix,
    prestigeCount: current.prestigeCount ?? 0,
    expToNext: level >= MAX_LEVEL ? 0 : expToNext,
    tier,
    stats: safeStats,
    hiddenExp: safeHiddenExp,
  }
  return { newStatus, leveledUp }
}

/** デバッグ用: レベルを指定値に強制設定（exp=0、prefix・prestigeCountは維持） */
export function setLevelForDebug(level: number): PlayerStatus {
  const lv = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)))
  const current = loadPlayerStatus()
  const rank = getDisplayRank(lv)
  const expToNext = getExpToNextLevel(lv)
  const tier = getTierFromLevel(lv)
  const newStatus: PlayerStatus = {
    level: lv,
    exp: 0,
    rank,
    prefix: current.prefix,
    prestigeCount: current.prestigeCount ?? 0,
    stats: current.stats ?? { ...DEFAULT_STATS },
    hiddenExp: current.hiddenExp ?? { ...DEFAULT_HIDDEN_EXP },
    expToNext,
    tier,
  }
  savePlayerStatus(newStatus)
  return newStatus
}

/**
 * 期間×難易度ごとの基本EXP。
 * 設計: 1日3件のDaily初級でLv3（中級解放）に到達。
 * 1個やる→進捗、3個やる→次の難易度解放、という手応えを重視。
 */
const EXP_MATRIX: Record<string, Record<string, number>> = {
  daily: { beginner: 7, intermediate: 11, advanced: 16, abyss: 20 },
  weekly: { beginner: 14, intermediate: 22, advanced: 32, abyss: 40 },
  monthly: { beginner: 21, intermediate: 33, advanced: 48, abyss: 60 },
}

/**
 * クエスト1回クリアで得るEXP（期間×難易度で変動）。
 * Lv1〜19は+2ボーナスでサクサク序盤を演出。
 * isExtra=true のときは+50%ボーナス（エクストラクエスト）。
 * isTrial=true のときは試練報酬（40固定、Lv25以上向け）。
 * isWeekendChallenge=true のときは週末チャレンジ（30固定）。
 * isMonthlyEvent=true のときは月間テーマイベント（35固定）。
 * isInverted=true のときは反転クエスト（25固定）。
 */
export function getExpPerQuestClear(
  level: number,
  period: 'daily' | 'weekly' | 'monthly',
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'abyss',
  isExtra?: boolean,
  isTrial?: boolean,
  isWeekendChallenge?: boolean,
  isMonthlyEvent?: boolean,
  isInverted?: boolean
): number {
  if (isTrial) return 40
  if (isWeekendChallenge) return 30
  if (isMonthlyEvent) return 35
  if (isInverted) return 25
  const base = EXP_MATRIX[period]?.[difficulty] ?? EXP_MATRIX.daily.beginner
  let exp = base + (level < 20 ? 2 : 0)
  if (isExtra) exp = Math.floor(exp * 1.5)
  return exp
}

/** @deprecated getExpPerQuestClear を period/difficulty 付きで使用すること */
export function getExpPerDailyClear(level: number): number {
  return getExpPerQuestClear(level, 'daily', 'beginner')
}

/** 次レベルまでに必要なクエスト数（切り上げ）。Lv99のときは0 */
export function getQuestsToNextLevel(
  status: PlayerStatus,
  period: 'daily' | 'weekly' | 'monthly',
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'abyss',
  streakBonus: number
): number {
  if (status.level >= MAX_LEVEL) return 0
  const expPerQuest = getExpPerQuestClear(status.level, period, difficulty) + streakBonus
  if (expPerQuest <= 0) return 0
  const remaining = status.expToNext - status.exp
  if (remaining <= 0) return 0
  return Math.ceil(remaining / expPerQuest)
}

/** 直近のクリア履歴（二つ名生成用）。最大10件のクエストタイトル */
export function getClearHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CLEAR_HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.slice(-10).filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function pushClearHistory(questTitle: string): void {
  if (typeof window === 'undefined') return
  try {
    const prev = getClearHistory()
    const next = [...prev, questTitle].slice(-10)
    localStorage.setItem(CLEAR_HISTORY_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

/** 連続クリア日数（その日に1回以上クリアした日をカウント） */
export function getStreakDays(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return 0
    const data = JSON.parse(raw) as { lastDate?: string; count?: number }
    const jst = getJSTDateString()
    if (data.lastDate === jst) return Math.max(0, Number(data.count) ?? 0)
    const yesterday = getJSTYesterdayString()
    if (data.lastDate === yesterday) return Math.max(0, Number(data.count) ?? 0)
    return 0
  } catch {
    return 0
  }
}

function getJSTDateString(): string {
  const now = new Date()
  return now.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo' }).split(',')[0].trim()
}

function getJSTYesterdayString(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset() - 24 * 60)
  return d.toLocaleString('en-CA', { timeZone: 'Asia/Tokyo' }).split(',')[0].trim()
}

/** 連続クリア日数に応じたEXPボーナス。継続の報酬。 */
export function getStreakExpBonus(streakDays: number): number {
  if (streakDays <= 1) return 0
  if (streakDays >= 7) return 5
  if (streakDays >= 3) return 2
  return 1
}

export function incrementStreakIfNeeded(): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    const jst = getJSTDateString()
    const yesterday = getJSTYesterdayString()
    let count = 0
    let lastDate = ''
    if (raw) {
      const data = JSON.parse(raw) as { lastDate?: string; count?: number }
      lastDate = data.lastDate ?? ''
      count = Number(data.count) ?? 0
    }
    if (lastDate === jst) return
    if (lastDate === yesterday) count += 1
    else count = 1
    localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: jst, count }))
  } catch {
    // ignore
  }
}

/** 連続達成イベント: マイルストーン定義（日数 → 報酬EXP） */
export const STREAK_MILESTONES = [7, 14, 30] as const
const STREAK_MILESTONE_REWARDS: Record<number, number> = { 7: 15, 14: 30, 30: 50 }

/** 受取済みマイルストーンを取得 */
export function getClaimedStreakMilestones(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STREAK_CLAIMED_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr) ? arr.filter((x): x is number => typeof x === 'number') : []
  } catch {
    return []
  }
}

/** 到達済みかつ未受取のマイルストーン（最も高いもの） */
export function getUnclaimedStreakMilestone(streakDays: number): number | null {
  const claimed = getClaimedStreakMilestones()
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    const m = STREAK_MILESTONES[i]
    if (streakDays >= m && !claimed.includes(m)) return m
  }
  return null
}

/** マイルストーン報酬EXP */
export function getStreakMilestoneExp(milestone: number): number {
  return STREAK_MILESTONE_REWARDS[milestone] ?? 0
}

/** マイルストーンを受取ってEXPを付与。未受取がなければnull */
export function claimStreakMilestoneIfEligible(
  streakDays: number,
  current: PlayerStatus
): { newStatus: PlayerStatus; milestone: number; expGained: number } | null {
  const unclaimed = getUnclaimedStreakMilestone(streakDays)
  if (!unclaimed) return null
  const exp = getStreakMilestoneExp(unclaimed)
  const { newStatus } = addExpAndLevelUp(current, exp)
  const claimed = getClaimedStreakMilestones()
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STREAK_CLAIMED_KEY, JSON.stringify([...claimed, unclaimed].sort((a, b) => a - b)))
    } catch {
      // ignore
    }
  }
  return { newStatus, milestone: unclaimed, expGained: exp }
}
