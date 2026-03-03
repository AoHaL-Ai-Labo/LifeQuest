'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flame, Settings, Radio, Send, ChevronDown, ChevronRight, Lock, Swords, ScrollText, Award, Sparkles, Skull, RotateCcw, Calendar, Moon, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { QuestFeedItem } from '@/components/quest-feed-item'
import {
  getQuestLockStatus,
  saveQuestFetch,
  saveQuestsToCacheOnly,
  loadFetchedQuests,
  loadClearedQuests,
  saveClearedQuests,
  loadExtraQuest,
  saveExtraQuest,
  loadExtraQuestCleared,
  saveExtraQuestCleared,
  loadTrialQuest,
  saveTrialQuest,
  loadTrialCleared,
  saveTrialCleared,
  getTrialLockStatus,
  loadWeekendChallenge,
  saveWeekendChallenge,
  loadWeekendChallengeCleared,
  saveWeekendChallengeCleared,
  getWeekendChallengeLockStatus,
  isWeekend,
  loadMonthlyEventQuest,
  saveMonthlyEventQuest,
  loadMonthlyEventCleared,
  saveMonthlyEventCleared,
  getMonthlyEventLockStatus,
  loadInvertedQuest,
  saveInvertedQuest,
  loadInvertedQuestCleared,
  saveInvertedQuestCleared,
  getInvertedQuestLockStatus,
  clearQuestCache,
} from '@/lib/quest-lock'
import {
  getMockApiEnabled,
  mockDelay,
  getMockQuestsForPeriod,
  MOCK_REPORT_MESSAGE,
  MOCK_TITLE_PREFIX,
  MOCK_REROLL_QUEST,
  MOCK_EXTRA_QUEST,
  MOCK_TRIAL_QUEST,
  MOCK_WEEKEND_CHALLENGE,
  MOCK_MONTHLY_EVENT,
  MOCK_INVERTED_QUEST,
} from '@/lib/mock-api'
import { DEBUG_EVENT } from '@/components/debug-panel'
import { getDeveloperMode } from '@/lib/developer-mode'
import { SINGULARITY_TRIGGER_EVENT, SINGULARITY_FLED_EVENT, SINGULARITY_OPEN_EVENT, SINGULARITY_RETURNED_EVENT } from '@/components/singularity-modal'
import { shouldTriggerSingularity, loadSingularityState } from '@/lib/singularity'
import {
  loadPlayerStatus,
  savePlayerStatus,
  addExpAndLevelUp,
  MAX_LEVEL,
  getExpPerQuestClear,
  getClearHistory,
  pushClearHistory,
  updatePrefix,
  getStreakDays,
  incrementStreakIfNeeded,
  getStreakExpBonus,
  getQuestsToNextLevel,
  claimStreakMilestoneIfEligible,
  STREAK_MILESTONES,
  getClaimedStreakMilestones,
  getDisplayRank,
  type PlayerStatus,
} from '@/lib/player-status'
import type { QuestTier, QuestPeriod } from '@/lib/quest-lock'
import { isQuestComboUnlocked, getUnlockLevel, getNextUnlockForDifficulty, isTrialUnlocked, isAbyssUnlocked, isPeriodUnlocked, getPeriodUnlockLevel, isMonthlyEventUnlocked, isInvertedQuestUnlocked, MONTHLY_EVENT_UNLOCK_LEVEL, INVERTED_QUEST_UNLOCK_LEVEL, TRIAL_UNLOCK_LEVEL } from '@/lib/quest-unlock'
import { isReborn, executePrestige } from '@/lib/reborn'
import { pushMissionRecord } from '@/lib/mission-record'
import { getQuestPrimaryStatByTitle, initializeQuestCatalog } from '@/lib/quest-catalog'
import { completeQuest } from '@/app/actions/userActions'
import { getQuestCompletionStatus } from '@/app/actions/quest'
import type { PrimaryStat } from '@/lib/quest-types'
import { getCurrentSeason, SEASON_LABELS } from '@/lib/season'
import type { PlayerStats } from '@/lib/player-status'
import { getClassFromStats } from '@/lib/user-class'

type ComboKey = string
function comboKey(period: QuestPeriod, difficulty: QuestTier): ComboKey {
  return `${period}_${difficulty}`
}

function getUnlockedCombos(level: number, prestigeCount: number): Array<{ period: QuestPeriod; difficulty: QuestTier }> {
  const isRebornUser = prestigeCount > 0
  const periods: QuestPeriod[] = ['daily', 'weekly', 'monthly']
  const difficulties: QuestTier[] = ['beginner', 'intermediate', 'advanced'].concat(isAbyssUnlocked(isRebornUser) ? ['abyss'] : [])
  return periods.flatMap((p) =>
    difficulties
      .filter((d) => isPeriodUnlocked(level, p) && isQuestComboUnlocked(level, p, d, isRebornUser, prestigeCount))
      .map((d) => ({ period: p, difficulty: d }))
  )
}

const LOADING_TIPS = [
  'Tips: コンフォートゾーン…それは甘き毒。浸り続ければ、魂は腐るであろう。',
  'Tips: 淀んだ瞳では、真実は見えぬ。時には己の直感すらも疑うのだ。',
  'Tips: 記録は嘘をつかぬ。だが、その解釈は常に己の側にあることを忘れるな。',
  'Tips: 意味のない寄り道こそが、擦り切れた脳髄を潤す唯一の秘薬となる。',
  'Tips: 午前の巡礼を終えたなら、午後の啓示を待て。焦りは身を滅ぼす。',
  'Tips: どんな些細な違和感も、この書物（アプリ）に刻み込むがいい。それが貴公の生きた証となる。',
]

/** API失敗時（クォータ超過・キー未設定等）のフォールバック。アプリを試せるようサンプル3件を表示 */
const FALLBACK_QUESTS: Array<{ title: string; description: string; flavorText: string }> = [
  { title: '左腕の誓約', description: '利き手ではない方の手で、歯磨きかドアノブを回してみよう。5分以内。', flavorText: '火の無き灰よ、己の利き腕を封じよ。不便という名の枷が、淀んだ瞳を開くやもしれぬのだから…' },
  { title: '新ルートの探求', description: 'いつもと違う道で帰宅し、気になったものを3つ記録せよ。', flavorText: '呪われし日常の轍を断ち、未知の路を歩め。その一歩が、世界を書き換える。' },
  { title: '沈黙を破る契約', description: '知らない人に一声かけて、最低2分会話を続けよ。', flavorText: '魂を繋ぐ言葉よ、沈黙の壁を砕け。汝の声は、新たな契約の始まりなれば。' },
]

/** クエスト型（DB由来の場合は id を持つ） */
type QuestWithOptionalId = { title: string; description: string; flavorText?: string; id?: string }

export default function QuestPage() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [questsByCombo, setQuestsByCombo] = useState<Record<string, Array<{ title: string; description: string; flavorText?: string }>>>({})
  const [clearedByCombo, setClearedByCombo] = useState<Record<string, Record<number, string>>>({})
  const [questLockByCombo, setQuestLockByCombo] = useState<Record<string, { canFetch: boolean; nextUpdateMessage: string }>>({})
  const [isFetchingByCombo, setIsFetchingByCombo] = useState<Record<string, boolean>>({})
  const [rerollReplacementsByCombo, setRerollReplacementsByCombo] = useState<Record<string, Record<number, { title: string; description: string; flavorText?: string }>>>({})
  const [extraQuestByCombo, setExtraQuestByCombo] = useState<Record<string, { title: string; description: string; flavorText?: string } | null>>({})
  const [extraQuestClearedByCombo, setExtraQuestClearedByCombo] = useState<Record<string, string | null>>({})
  const [extraReflectionInputByCombo, setExtraReflectionInputByCombo] = useState<Record<string, string>>({})
  const [isFetchingExtraByCombo, setIsFetchingExtraByCombo] = useState<Record<string, boolean>>({})
  const [reflectionInputs, setReflectionInputs] = useState<Record<string, string>>({})
  const [isSubmittingReport, setIsSubmittingReport] = useState<string | null>(null)
  const [clearMessageModal, setClearMessageModal] = useState<{ message: string; questTitle: string; leveledUp?: boolean; newLevel?: number } | null>(null)
  const [streakMilestoneModal, setStreakMilestoneModal] = useState<{ milestone: number; expGained: number } | null>(null)
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null)
  const [loadingTip, setLoadingTip] = useState('')
  const [rerollModal, setRerollModal] = useState<{ comboKey: string; period: QuestPeriod; difficulty: QuestTier; index: number; quest: { title: string; description: string; flavorText?: string } } | null>(null)
  const [rerollConstraints, setRerollConstraints] = useState('')
  const [isRerolling, setIsRerolling] = useState(false)
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({ level: 1, exp: 0, rank: '死人', prefix: '', prestigeCount: 0, expToNext: 12, tier: 2 })
  const [streakDays, setStreakDays] = useState(0)
  const [trialQuest, setTrialQuest] = useState<{ title: string; description: string; flavorText?: string } | null>(null)
  const [trialCleared, setTrialCleared] = useState<string | null>(null)
  const [trialLock, setTrialLock] = useState({ canFetch: true, nextUpdateMessage: '' })
  const [isFetchingTrial, setIsFetchingTrial] = useState(false)
  const [trialReflectionInput, setTrialReflectionInput] = useState('')
  const [weekendQuest, setWeekendQuest] = useState<{ title: string; description: string; flavorText?: string } | null>(null)
  const [weekendCleared, setWeekendCleared] = useState<string | null>(null)
  const [weekendLock, setWeekendLock] = useState({ canFetch: true, nextUpdateMessage: '' })
  const [isFetchingWeekend, setIsFetchingWeekend] = useState(false)
  const [weekendReflectionInput, setWeekendReflectionInput] = useState('')
  const [monthlyEventQuest, setMonthlyEventQuest] = useState<{ title: string; description: string; flavorText?: string } | null>(null)
  const [monthlyEventCleared, setMonthlyEventCleared] = useState<string | null>(null)
  const [monthlyEventLock, setMonthlyEventLock] = useState({ canFetch: true, nextUpdateMessage: '' })
  const [isFetchingMonthlyEvent, setIsFetchingMonthlyEvent] = useState(false)
  const [monthlyEventReflectionInput, setMonthlyEventReflectionInput] = useState('')
  const [invertedQuest, setInvertedQuest] = useState<{ title: string; description: string; flavorText?: string } | null>(null)
  const [invertedCleared, setInvertedCleared] = useState<string | null>(null)
  const [hasActiveSingularity, setHasActiveSingularity] = useState(false)
  const [invertedLock, setInvertedLock] = useState({ canFetch: true, nextUpdateMessage: '' })
  const [isFetchingInverted, setIsFetchingInverted] = useState(false)
  const [invertedReflectionInput, setInvertedReflectionInput] = useState('')
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false)
  /** QuestHistory から動的算出した完了済みクエストID（バッチレス） */
  const [completedQuestIdsFromServer, setCompletedQuestIdsFromServer] = useState<Set<string>>(new Set())
  const [developerMode, setDeveloperModeState] = useState(false)

  useEffect(() => {
    setDeveloperModeState(getDeveloperMode())
    const onChange = () => setDeveloperModeState(getDeveloperMode())
    window.addEventListener('developer-mode-change', onChange as EventListener)
    return () => window.removeEventListener('developer-mode-change', onChange as EventListener)
  }, [])

  useEffect(() => {
    const onFled = (e: CustomEvent<{ pendingClearModal?: { message: string; questTitle: string; leveledUp?: boolean; newLevel?: number } | null }>) => {
      const p = e.detail?.pendingClearModal
      if (p) setClearMessageModal(p)
    }
    window.addEventListener(SINGULARITY_FLED_EVENT, onFled as EventListener)
    return () => window.removeEventListener(SINGULARITY_FLED_EVENT, onFled as EventListener)
  }, [])

  useEffect(() => {
    const refresh = () => {
      const status = loadPlayerStatus()
      setPlayerStatus(status)
      setStreakDays(getStreakDays())
      const combos = getUnlockedCombos(status.level, status.prestigeCount ?? 0)
      const nextQuests: Record<string, Array<{ title: string; description: string; flavorText?: string }>> = {}
      const nextCleared: Record<string, Record<number, string>> = {}
      const nextLock: Record<string, { canFetch: boolean; nextUpdateMessage: string }> = {}
      const nextExtra: Record<string, { title: string; description: string; flavorText?: string } | null> = {}
      const nextExtraCleared: Record<string, string | null> = {}
      combos.forEach(({ period, difficulty }) => {
        const ck = comboKey(period, difficulty)
        const stored = loadFetchedQuests(period, difficulty)
        if (stored) nextQuests[ck] = stored
        nextCleared[ck] = loadClearedQuests(period, difficulty)
        nextLock[ck] = getQuestLockStatus(period, difficulty)
        const extra = loadExtraQuest(period, difficulty)
        nextExtra[ck] = extra
        nextExtraCleared[ck] = extra ? loadExtraQuestCleared(period, difficulty) : null
      })
      setQuestsByCombo((p) => ({ ...p, ...nextQuests }))
      setClearedByCombo((p) => ({ ...p, ...nextCleared }))
      setQuestLockByCombo((p) => ({ ...p, ...nextLock }))
      setExtraQuestByCombo((p) => ({ ...p, ...nextExtra }))
      setExtraQuestClearedByCombo((p) => ({ ...p, ...nextExtraCleared }))
      setTrialQuest(loadTrialQuest())
      setTrialCleared(loadTrialCleared())
      setTrialLock(getTrialLockStatus())
      setWeekendQuest(loadWeekendChallenge())
      setWeekendCleared(loadWeekendChallengeCleared())
      setWeekendLock(getWeekendChallengeLockStatus())
      setMonthlyEventQuest(loadMonthlyEventQuest())
      setMonthlyEventCleared(loadMonthlyEventCleared())
      setMonthlyEventLock(getMonthlyEventLockStatus())
      setInvertedQuest(loadInvertedQuest())
      setInvertedCleared(loadInvertedQuestCleared())
      setInvertedLock(getInvertedQuestLockStatus())
      const sing = loadSingularityState()
      setHasActiveSingularity(!!(sing.quest && sing.endTimeMs && !sing.minimalCleared))
    }
    refresh()
    window.addEventListener(DEBUG_EVENT, refresh)
    window.addEventListener(SINGULARITY_RETURNED_EVENT, refresh)
    return () => {
      window.removeEventListener(DEBUG_EVENT, refresh)
      window.removeEventListener(SINGULARITY_RETURNED_EVENT, refresh)
    }
  }, [])

  // QuestHistory から完了状態を動的取得（バッチレス設計）
  useEffect(() => {
    const ids = Object.values(questsByCombo).flatMap((qList) =>
      (qList as Array<QuestWithOptionalId>).map((q) => q.id).filter((id): id is string => !!id)
    )
    if (ids.length === 0) return
    getQuestCompletionStatus(ids).then((status) => {
      setCompletedQuestIdsFromServer(new Set(Object.entries(status).filter(([, v]) => v).map(([k]) => k)))
    })
  }, [questsByCombo])

  // クエストカタログをAPIから取得してキャッシュ初期化（primaryStat/stats lookup用）
  useEffect(() => {
    fetch('/api/quest/catalog')
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: Array<{ title: string; stats: { str: number; dex: number; end: number; int: number; fai: number; arc: number }; primaryStat: string }>) => {
        if (Array.isArray(arr) && arr.length > 0) initializeQuestCatalog(arr)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const combos = getUnlockedCombos(playerStatus.level, playerStatus.prestigeCount ?? 0)
    combos.forEach(({ period, difficulty }) => {
      const ck = comboKey(period, difficulty)
      const stored = loadFetchedQuests(period, difficulty)
      const lock = getQuestLockStatus(period, difficulty)
      setQuestLockByCombo((p) => ({ ...p, [ck]: lock }))
      if (stored) {
        setQuestsByCombo((p) => ({ ...p, [ck]: stored }))
        setClearedByCombo((p) => ({ ...p, [ck]: loadClearedQuests(period, difficulty) }))
        return
      }
      if (lock.canFetch) {
        const doFetch = async () => {
          setIsFetchingByCombo((p) => ({ ...p, [ck]: true }))
          let res: Response | null = null
          let data: unknown = {}
          try {
            if (getMockApiEnabled()) {
              data = await mockDelay({ quests: getMockQuestsForPeriod(period) })
            } else {
              res = await fetch('/api/quest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period, difficulty, prestigeCount: playerStatus.prestigeCount ?? 0 }) })
              data = await res.json().catch(() => ({}))
              if (!res.ok) throw new Error((data as { detail?: string; error?: string }).detail ?? (data as { detail?: string; error?: string }).error ?? `API error (${res.status})`)
            }
            const quests = (data as { quests?: unknown[] }).quests
            if (!quests?.length || quests.length < 3) throw new Error('Invalid response format')
            const arr = quests as Array<{ title: string; description: string; flavorText?: string }>
            setQuestsByCombo((p) => ({ ...p, [ck]: arr }))
            setRerollReplacementsByCombo((p) => ({ ...p, [ck]: {} }))
            setClearedByCombo((p) => ({ ...p, [ck]: {} }))
            saveClearedQuests({}, period, difficulty)
            saveQuestFetch(arr, period, difficulty)
            setQuestLockByCombo((p) => ({ ...p, [ck]: getQuestLockStatus(period, difficulty) }))
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error('[Debug: API Error] /api/quest failed', { comboKey: ck, message: msg }, err)
            setQuestsByCombo((p) => ({ ...p, [ck]: FALLBACK_QUESTS }))
            saveQuestsToCacheOnly(FALLBACK_QUESTS, period, difficulty)
          } finally {
            setIsFetchingByCombo((p) => ({ ...p, [ck]: false }))
          }
        }
        doFetch()
      }
    })
  }, [playerStatus.level])

  useEffect(() => {
    const combos = getUnlockedCombos(playerStatus.level, playerStatus.prestigeCount ?? 0)
    const iv = setInterval(() => {
      combos.forEach(({ period, difficulty }) => {
        const ck = comboKey(period, difficulty)
        const stored = loadFetchedQuests(period, difficulty)
        const lock = getQuestLockStatus(period, difficulty)
        setQuestLockByCombo((p) => ({ ...p, [ck]: lock }))
        if (!stored && lock.canFetch) {
          const doFetch = async () => {
            setIsFetchingByCombo((p) => ({ ...p, [ck]: true }))
            let data: unknown = {}
            try {
              if (getMockApiEnabled()) {
                data = await mockDelay({ quests: getMockQuestsForPeriod(period) })
              } else {
                const r = await fetch('/api/quest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period, difficulty }) })
                data = await r.json().catch(() => ({}))
                if (!r.ok) throw new Error((data as { detail?: string }).detail ?? 'API error')
              }
              const quests = (data as { quests?: unknown[] })?.quests
              if (Array.isArray(quests) && quests.length >= 3) {
                const arr = quests as Array<{ title: string; description: string; flavorText?: string }>
                setQuestsByCombo((p) => ({ ...p, [ck]: arr }))
                setRerollReplacementsByCombo((p) => ({ ...p, [ck]: {} }))
                setClearedByCombo((p) => ({ ...p, [ck]: {} }))
                saveClearedQuests({}, period, difficulty)
                saveQuestFetch(arr, period, difficulty)
                setQuestLockByCombo((p) => ({ ...p, [ck]: getQuestLockStatus(period, difficulty) }))
              }
            } catch (err) {
              console.error('[Debug: API] interval fetch failed', ck, err)
              setQuestsByCombo((p) => ({ ...p, [ck]: FALLBACK_QUESTS }))
              saveQuestsToCacheOnly(FALLBACK_QUESTS, period, difficulty)
            } finally {
              setIsFetchingByCombo((p) => ({ ...p, [ck]: false }))
            }
          }
          doFetch()
        } else if (stored) {
          setQuestsByCombo((p) => ({ ...p, [ck]: stored }))
        }
      })
    }, 60_000)
    return () => clearInterval(iv)
  }, [playerStatus.level])

  useEffect(() => {
    const combos = getUnlockedCombos(playerStatus.level, playerStatus.prestigeCount ?? 0)
    combos.forEach(({ period, difficulty }) => {
      const ck = comboKey(period, difficulty)
      const quests = questsByCombo[ck] ?? []
      const cleared = clearedByCombo[ck] ?? {}
      const questCount = quests.length
      const allCleared = questCount > 0 && Array.from({ length: questCount }, (_, i) => i).every((i) => cleared[i])
      if (!allCleared || extraQuestByCombo[ck] || isFetchingExtraByCombo[ck]) return
      const stored = loadExtraQuest(period, difficulty)
      if (stored) {
        setExtraQuestByCombo((p) => ({ ...p, [ck]: stored }))
        setExtraQuestClearedByCombo((p) => ({ ...p, [ck]: loadExtraQuestCleared(period, difficulty) }))
        return
      }
      const doFetch = async () => {
        setIsFetchingExtraByCombo((p) => ({ ...p, [ck]: true }))
        try {
          if (getMockApiEnabled()) {
            await mockDelay(0)
            setExtraQuestByCombo((p) => ({ ...p, [ck]: MOCK_EXTRA_QUEST }))
            saveExtraQuest(MOCK_EXTRA_QUEST, period, difficulty)
          } else {
            const res = await fetch('/api/quest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ period, difficulty, extra: true }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error((data as { detail?: string }).detail ?? 'API error')
            const qs = (data as { quests?: { title: string; description: string; flavorText?: string }[] }).quests
            if (!qs?.length) throw new Error('Invalid extra quest format')
            const q = qs[0]
            setExtraQuestByCombo((p) => ({ ...p, [ck]: q }))
            saveExtraQuest(q, period, difficulty)
          }
        } catch (err) {
          console.error('[Debug: Extra Quest] fetch failed', ck, err)
          setExtraQuestByCombo((p) => ({ ...p, [ck]: MOCK_EXTRA_QUEST }))
          saveExtraQuest(MOCK_EXTRA_QUEST, period, difficulty)
        } finally {
          setIsFetchingExtraByCombo((p) => ({ ...p, [ck]: false }))
        }
      }
      doFetch()
    })
  }, [playerStatus.level, questsByCombo, clearedByCombo, extraQuestByCombo, isFetchingExtraByCombo])

  const isAnyFetching = Object.values(isFetchingByCombo).some(Boolean)
  useEffect(() => {
    if (!isAnyFetching) return
    const pick = () => setLoadingTip(LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)])
    pick()
    const iv = setInterval(pick, 3000)
    return () => clearInterval(iv)
  }, [isAnyFetching])

  const FALLBACK_CLEAR_MESSAGE = '汝の一歩は、記録に刻まれた。'

  const isQuotaError = (res: Response, data: { detail?: string; error?: string }) => {
    if (res.status === 429) return true
    const msg = (data.detail ?? data.error ?? '').toLowerCase()
    return msg.includes('quota') || msg.includes('rate') || msg.includes('billing') || msg.includes('exceeded')
  }

  const applyClearProgress = (
    clearMessage: string,
    questTitle: string,
    reflection: string,
    period: QuestPeriod,
    difficulty: QuestTier,
    isExtra?: boolean,
    stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number },
    primaryStat?: PrimaryStat
  ) => {
    pushMissionRecord({ questTitle, reflection, clearMessage, stats })
    const streakBonus = getStreakExpBonus(getStreakDays())
    const expGain = getExpPerQuestClear(playerStatus.level, period, difficulty, isExtra, false) + streakBonus
    const questOptions = primaryStat
      ? { primaryStat, period }
      : undefined
    const { newStatus, leveledUp } = addExpAndLevelUp(playerStatus, expGain, questOptions)
    const prevLevel = playerStatus.level
    const prevRank = playerStatus.rank
    console.log('[Debug: EXP]', {
      gained: expGain,
      level: `${prevLevel} → ${newStatus.level}`,
      rank: prevRank !== newStatus.rank ? `${prevRank} → ${newStatus.rank}` : prevRank,
      leveledUp,
    })
    if (leveledUp) {
      console.log('[Debug: State Change]', {
        Level: newStatus.level,
        Rank: newStatus.rank,
        Prefix: newStatus.prefix || '(未取得)',
      })
    }
    pushClearHistory(questTitle)
    incrementStreakIfNeeded()
    setStreakDays(getStreakDays())
    setPlayerStatus(newStatus)
    savePlayerStatus(newStatus)
    return { leveledUp, newLevel: newStatus.level }
  }

  const applyTrialClearProgress = (clearMessage: string, questTitle: string, reflection: string, stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number }, primaryStat?: PrimaryStat) => {
    pushMissionRecord({ questTitle, reflection, clearMessage, stats })
    const streakBonus = getStreakExpBonus(getStreakDays())
    const expGain = getExpPerQuestClear(playerStatus.level, 'weekly', 'advanced', false, true) + streakBonus
    const questOptions = primaryStat ? { primaryStat, period: 'weekly' as const } : undefined
    const { newStatus, leveledUp } = addExpAndLevelUp(playerStatus, expGain, questOptions)
    pushClearHistory(questTitle)
    incrementStreakIfNeeded()
    setStreakDays(getStreakDays())
    setPlayerStatus(newStatus)
    savePlayerStatus(newStatus)
    return { leveledUp, newLevel: newStatus.level }
  }

  const applyWeekendClearProgress = (clearMessage: string, questTitle: string, reflection: string, stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number }, primaryStat?: PrimaryStat) => {
    pushMissionRecord({ questTitle, reflection, clearMessage, stats })
    const streakBonus = getStreakExpBonus(getStreakDays())
    const expGain = getExpPerQuestClear(playerStatus.level, 'weekly', 'intermediate', false, false, true) + streakBonus
    const questOptions = primaryStat ? { primaryStat, period: 'weekly' as const } : undefined
    const { newStatus, leveledUp } = addExpAndLevelUp(playerStatus, expGain, questOptions)
    pushClearHistory(questTitle)
    incrementStreakIfNeeded()
    setStreakDays(getStreakDays())
    setPlayerStatus(newStatus)
    savePlayerStatus(newStatus)
    return { leveledUp, newLevel: newStatus.level }
  }

  const applyMonthlyEventClearProgress = (clearMessage: string, questTitle: string, reflection: string, stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number }, primaryStat?: PrimaryStat) => {
    pushMissionRecord({ questTitle, reflection, clearMessage, stats })
    const streakBonus = getStreakExpBonus(getStreakDays())
    const expGain = getExpPerQuestClear(playerStatus.level, 'monthly', 'advanced', false, false, false, true) + streakBonus
    const questOptions = primaryStat ? { primaryStat, period: 'monthly' as const } : undefined
    const { newStatus, leveledUp } = addExpAndLevelUp(playerStatus, expGain, questOptions)
    pushClearHistory(questTitle)
    incrementStreakIfNeeded()
    setStreakDays(getStreakDays())
    setPlayerStatus(newStatus)
    savePlayerStatus(newStatus)
    return { leveledUp, newLevel: newStatus.level }
  }

  const applyInvertedClearProgress = (clearMessage: string, questTitle: string, reflection: string, stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number }, primaryStat?: PrimaryStat) => {
    pushMissionRecord({ questTitle, reflection, clearMessage, stats })
    const streakBonus = getStreakExpBonus(getStreakDays())
    const expGain = getExpPerQuestClear(playerStatus.level, 'daily', 'beginner', false, false, false, false, true) + streakBonus
    const questOptions = primaryStat ? { primaryStat, period: 'daily' as const } : undefined
    const { newStatus, leveledUp } = addExpAndLevelUp(playerStatus, expGain, questOptions)
    pushClearHistory(questTitle)
    incrementStreakIfNeeded()
    setStreakDays(getStreakDays())
    setPlayerStatus(newStatus)
    savePlayerStatus(newStatus)
    return { leveledUp, newLevel: newStatus.level }
  }

  const handleSubmitReport = async (comboKey: ComboKey, period: QuestPeriod, difficulty: QuestTier, questIndex: number, quest: QuestWithOptionalId) => {
    const refKey = `${comboKey}-${questIndex}`
    const reflection = reflectionInputs[refKey]?.trim()
    if (!reflection) { alert('感想を入力してください'); return }
    setIsSubmittingReport(refKey)
    try {
      let message: string | null
      if (getMockApiEnabled()) {
        message = await mockDelay(MOCK_REPORT_MESSAGE)
      } else {
        const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questTitle: quest.title, reflection }) })
        const data = await res.json().catch(() => ({}))
        message = res.ok ? data.message : (isQuotaError(res, data) ? FALLBACK_CLEAR_MESSAGE : null)
        if (!res.ok && isQuotaError(res, data)) {
          alert('APIの利用制限に達しました。クリアは記録済みです。しばらく経ってから再度お試しください。')
        }
        if (message === null) throw new Error((data as { detail?: string }).detail ?? (data as { error?: string }).error ?? 'API error')
      }
      setClearedByCombo((p) => {
        const curr = p[comboKey] ?? {}
        const next = { ...curr, [questIndex]: message! }
        saveClearedQuests(next, period, difficulty)
        return { ...p, [comboKey]: next }
      })
      setReflectionInputs((p) => ({ ...p, [refKey]: '' }))
      let leveledUp: boolean
      let newLevel: number
      if (quest.id) {
        const result = await completeQuest(quest.id)
        if (!result.success) {
          throw new Error(result.error ?? 'クエストの達成に失敗しました')
        }
        if (result.userData) {
          savePlayerStatus({
            level: result.userData.level,
            exp: result.userData.currentExp,
            rank: getDisplayRank(result.userData.level),
            prefix: result.userData.prefix,
            prestigeCount: result.userData.prestigeCount,
            stats: result.userData.stats,
            hiddenExp: result.userData.hiddenExp,
          })
          window.dispatchEvent(new CustomEvent(DEBUG_EVENT))
        }
        pushMissionRecord({ questTitle: quest.title, reflection, clearMessage: message!, stats: (quest as { stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number } }).stats })
        pushClearHistory(quest.title)
        incrementStreakIfNeeded()
        setStreakDays(getStreakDays())
        setPlayerStatus(loadPlayerStatus())
        setCompletedQuestIdsFromServer((p) => new Set(p).add(quest.id))
        leveledUp = result.leveledUp ?? false
        newLevel = result.userData?.level ?? playerStatus.level
      } else {
        const primaryStat = (quest as { primaryStat?: PrimaryStat }).primaryStat ?? getQuestPrimaryStatByTitle(quest.title) ?? 'str'
        const progress = applyClearProgress(message!, quest.title, reflection, period, difficulty, false, (quest as { stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number } }).stats, primaryStat)
        leveledUp = progress.leveledUp
        newLevel = progress.newLevel
      }
      const milestoneResult = claimStreakMilestoneIfEligible(getStreakDays(), loadPlayerStatus())
      if (milestoneResult) {
        setPlayerStatus(milestoneResult.newStatus)
        savePlayerStatus(milestoneResult.newStatus)
        setStreakMilestoneModal({ milestone: milestoneResult.milestone, expGained: milestoneResult.expGained })
      }
      const clearResult = { message: message!, questTitle: quest.title, leveledUp, newLevel }
      if (shouldTriggerSingularity()) {
        window.dispatchEvent(new CustomEvent(SINGULARITY_TRIGGER_EVENT, { detail: { pendingClearModal: clearResult, sourcePeriod: period, sourceDifficulty: difficulty } }))
      } else {
        setClearMessageModal(clearResult)
      }
      if (leveledUp) {
        if (getMockApiEnabled()) {
          const prefix = await mockDelay(MOCK_TITLE_PREFIX)
          updatePrefix(prefix)
          setPlayerStatus((s) => ({ ...s, prefix }))
          console.log('[Debug: State Change] Prefix from Mock:', prefix)
        } else {
          const history = getClearHistory()
          const r = await fetch('/api/title', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recentClears: history }) })
          if (r.ok) {
            const { prefix } = await r.json().catch(() => ({}))
            if (prefix) {
              updatePrefix(prefix)
              setPlayerStatus((s) => ({ ...s, prefix }))
              console.log('[Debug: State Change] Prefix from API:', prefix)
            }
          } else {
            console.error('[Debug: API Error] /api/title failed', { status: r.status, ok: r.ok })
          }
        }
      }
    } catch (err) {
      console.error('[Debug: API Error] /api/report failed', {
        error: err instanceof Error ? err.message : String(err),
        questTitle: quest.title,
      })
      alert(err instanceof Error ? err.message : '報告の提出に失敗しました')
    } finally {
      setIsSubmittingReport(null)
    }
  }

  const handleSubmitExtraReport = async (comboKey: ComboKey, period: QuestPeriod, difficulty: QuestTier, quest: { title: string; description: string; flavorText?: string }) => {
    const reflection = (extraReflectionInputByCombo[comboKey] ?? '').trim()
    if (!reflection) { alert('感想を入力してください'); return }
    setIsSubmittingReport(`extra-${comboKey}`)
    try {
      let message: string | null
      if (getMockApiEnabled()) {
        message = await mockDelay(MOCK_REPORT_MESSAGE)
      } else {
        const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questTitle: quest.title, reflection }) })
        const data = await res.json().catch(() => ({}))
        message = res.ok ? data.message : (isQuotaError(res, data) ? FALLBACK_CLEAR_MESSAGE : null)
        if (!res.ok && isQuotaError(res, data)) {
          alert('APIの利用制限に達しました。クリアは記録済みです。しばらく経ってから再度お試しください。')
        }
        if (message === null) throw new Error((data as { detail?: string }).detail ?? 'API error')
      }
      saveExtraQuestCleared(message, period, difficulty)
      setExtraQuestClearedByCombo((p) => ({ ...p, [comboKey]: message }))
      setExtraReflectionInputByCombo((p) => ({ ...p, [comboKey]: '' }))
      const primaryStat = (quest as { primaryStat?: PrimaryStat }).primaryStat ?? getQuestPrimaryStatByTitle(quest.title) ?? 'str'
      const { leveledUp, newLevel } = applyClearProgress(message, quest.title, reflection, period, difficulty, true, (quest as { stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number } }).stats, primaryStat)
      const milestoneResult = claimStreakMilestoneIfEligible(getStreakDays(), loadPlayerStatus())
      if (milestoneResult) {
        setPlayerStatus(milestoneResult.newStatus)
        savePlayerStatus(milestoneResult.newStatus)
        setStreakMilestoneModal({ milestone: milestoneResult.milestone, expGained: milestoneResult.expGained })
      }
      const clearResult = { message, questTitle: quest.title, leveledUp, newLevel }
      if (shouldTriggerSingularity()) {
        window.dispatchEvent(new CustomEvent(SINGULARITY_TRIGGER_EVENT, { detail: { pendingClearModal: clearResult, sourcePeriod: period, sourceDifficulty: difficulty } }))
      } else {
        setClearMessageModal(clearResult)
      }
      if (leveledUp) {
        if (getMockApiEnabled()) {
          const prefix = await mockDelay(MOCK_TITLE_PREFIX)
          updatePrefix(prefix)
          setPlayerStatus((s) => ({ ...s, prefix }))
        } else {
          const history = getClearHistory()
          const r = await fetch('/api/title', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recentClears: history }) })
          if (r.ok) {
            const { prefix } = await r.json().catch(() => ({}))
            if (prefix) {
              updatePrefix(prefix)
              setPlayerStatus((s) => ({ ...s, prefix }))
            }
          }
        }
      }
    } catch (err) {
      console.error('[Debug: API Error] /api/report (extra) failed', err)
      alert(err instanceof Error ? err.message : '報告の提出に失敗しました')
    } finally {
      setIsSubmittingReport(null)
    }
  }

  const handleReceiveNewQuest = async (period: QuestPeriod, difficulty: QuestTier) => {
    if (!isQuestComboUnlocked(playerStatus.level, period, difficulty, isReborn())) return
    if (!getQuestLockStatus(period, difficulty).canFetch) return
    const ck = comboKey(period, difficulty)
    setIsFetchingByCombo((p) => ({ ...p, [ck]: true }))
    let res: Response | null = null
    let data: unknown = {}
    try {
      if (getMockApiEnabled()) {
        data = await mockDelay({ quests: getMockQuestsForPeriod(period) })
      } else {
        res = await fetch('/api/quest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period, difficulty, prestigeCount: playerStatus.prestigeCount ?? 0 }) })
        data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data as { detail?: string; error?: string }).detail ?? (data as { detail?: string; error?: string }).error ?? `API error (${res.status})`)
      }
      const quests = (data as { quests?: unknown[] }).quests
      if (!quests?.length || quests.length < 3) throw new Error('Invalid response format')
      const arr = quests as Array<{ title: string; description: string; flavorText?: string }>
      setQuestsByCombo((p) => ({ ...p, [ck]: arr }))
      setRerollReplacementsByCombo((p) => ({ ...p, [ck]: {} }))
      setClearedByCombo((p) => ({ ...p, [ck]: {} }))
      saveClearedQuests({}, period, difficulty)
      saveQuestFetch(arr, period, difficulty)
      setQuestLockByCombo((p) => ({ ...p, [ck]: getQuestLockStatus(period, difficulty) }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Debug: API Error] /api/quest failed', { comboKey: ck }, err)
      setQuestsByCombo((p) => ({ ...p, [ck]: FALLBACK_QUESTS }))
      saveQuestsToCacheOnly(FALLBACK_QUESTS, period, difficulty)
      alert('APIで取得できませんでした（クォータ超過やキー未設定の可能性）。サンプルクエストで続行します。該当セクションの受信ボタンで再試行できます。')
    } finally {
      setIsFetchingByCombo((p) => ({ ...p, [ck]: false }))
    }
  }

  const handleReceiveTrialQuest = async () => {
    if (!isTrialUnlocked(playerStatus.level)) return
    if (!getTrialLockStatus().canFetch) return
    setIsFetchingTrial(true)
    try {
      if (getMockApiEnabled()) {
        await mockDelay(0)
        setTrialQuest(MOCK_TRIAL_QUEST)
        saveTrialQuest(MOCK_TRIAL_QUEST)
      } else {
        const res = await fetch('/api/quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trial: true, prestigeCount: playerStatus.prestigeCount ?? 0 }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data as { detail?: string }).detail ?? 'API error')
        const quests = (data as { quests?: { title: string; description: string; flavorText?: string }[] }).quests
        if (!quests?.length) throw new Error('Invalid trial format')
        const q = quests[0]
        setTrialQuest(q)
        saveTrialQuest(q)
      }
      setTrialLock(getTrialLockStatus())
      setTrialCleared(null)
    } catch (err) {
      console.error('[Debug: Trial] fetch failed', err)
      setTrialQuest(MOCK_TRIAL_QUEST)
      saveTrialQuest(MOCK_TRIAL_QUEST)
      setTrialLock(getTrialLockStatus())
    } finally {
      setIsFetchingTrial(false)
    }
  }

  const handleSubmitTrialReport = async (quest: { title: string; description: string; flavorText?: string }) => {
    const reflection = trialReflectionInput.trim()
    if (!reflection) { alert('感想を入力してください'); return }
    setIsSubmittingReport('trial')
    try {
      let message: string | null
      if (getMockApiEnabled()) {
        message = await mockDelay(MOCK_REPORT_MESSAGE)
      } else {
        const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questTitle: quest.title, reflection }) })
        const data = await res.json().catch(() => ({}))
        message = res.ok ? data.message : (isQuotaError(res, data) ? FALLBACK_CLEAR_MESSAGE : null)
        if (!res.ok && isQuotaError(res, data)) alert('APIの利用制限に達しました。クリアは記録済みです。')
        if (message === null) throw new Error((data as { detail?: string }).detail ?? 'API error')
      }
      saveTrialCleared(message)
      setTrialCleared(message)
      setTrialReflectionInput('')
      const primaryStat = (quest as { primaryStat?: PrimaryStat }).primaryStat ?? getQuestPrimaryStatByTitle(quest.title) ?? 'str'
      const { leveledUp, newLevel } = applyTrialClearProgress(message, quest.title, reflection, (quest as { stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number } }).stats, primaryStat)
      const milestoneResult = claimStreakMilestoneIfEligible(getStreakDays(), loadPlayerStatus())
      if (milestoneResult) {
        setPlayerStatus(milestoneResult.newStatus)
        savePlayerStatus(milestoneResult.newStatus)
        setStreakMilestoneModal({ milestone: milestoneResult.milestone, expGained: milestoneResult.expGained })
      }
      const clearResult = { message, questTitle: quest.title, leveledUp, newLevel }
      if (shouldTriggerSingularity()) {
        window.dispatchEvent(new CustomEvent(SINGULARITY_TRIGGER_EVENT, { detail: { pendingClearModal: clearResult, sourcePeriod: 'weekly', sourceDifficulty: 'advanced' } }))
      } else {
        setClearMessageModal(clearResult)
      }
      if (leveledUp) {
        if (getMockApiEnabled()) {
          const prefix = await mockDelay(MOCK_TITLE_PREFIX)
          updatePrefix(prefix)
          setPlayerStatus((s) => ({ ...s, prefix }))
        } else {
          const history = getClearHistory()
          const r = await fetch('/api/title', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recentClears: history }) })
          if (r.ok) {
            const { prefix } = await r.json().catch(() => ({}))
            if (prefix) { updatePrefix(prefix); setPlayerStatus((s) => ({ ...s, prefix })) }
          }
        }
      }
    } catch (err) {
      console.error('[Debug: Trial report] failed', err)
      alert(err instanceof Error ? err.message : '報告の提出に失敗しました')
    } finally {
      setIsSubmittingReport(null)
    }
  }

  const handleReceiveWeekendChallenge = async () => {
    if (!isWeekend()) return
    if (!getWeekendChallengeLockStatus().canFetch) return
    setIsFetchingWeekend(true)
    try {
      if (getMockApiEnabled()) {
        await mockDelay(0)
        setWeekendQuest(MOCK_WEEKEND_CHALLENGE)
        saveWeekendChallenge(MOCK_WEEKEND_CHALLENGE)
      } else {
        const res = await fetch('/api/quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weekend: true, prestigeCount: playerStatus.prestigeCount ?? 0 }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data as { detail?: string }).detail ?? 'API error')
        const quests = (data as { quests?: { title: string; description: string; flavorText?: string }[] }).quests
        if (!quests?.length) throw new Error('Invalid weekend format')
        const q = quests[0]
        setWeekendQuest(q)
        saveWeekendChallenge(q)
      }
      setWeekendLock(getWeekendChallengeLockStatus())
      setWeekendCleared(null)
    } catch (err) {
      console.error('[Debug: Weekend] fetch failed', err)
      setWeekendQuest(MOCK_WEEKEND_CHALLENGE)
      saveWeekendChallenge(MOCK_WEEKEND_CHALLENGE)
      setWeekendLock(getWeekendChallengeLockStatus())
    } finally {
      setIsFetchingWeekend(false)
    }
  }

  const handleReceiveMonthlyEventQuest = async () => {
    if (!getMonthlyEventLockStatus().canFetch) return
    setIsFetchingMonthlyEvent(true)
    try {
      if (getMockApiEnabled()) {
        await mockDelay(0)
        setMonthlyEventQuest(MOCK_MONTHLY_EVENT)
        saveMonthlyEventQuest(MOCK_MONTHLY_EVENT)
      } else {
        const res = await fetch('/api/quest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthlyEvent: true, prestigeCount: playerStatus.prestigeCount ?? 0 }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data as { detail?: string }).detail ?? 'API error')
        const quests = (data as { quests?: { title: string; description: string; flavorText?: string }[] }).quests
        if (!quests?.length) throw new Error('Invalid monthly event format')
        const q = quests[0]
        setMonthlyEventQuest(q)
        saveMonthlyEventQuest(q)
      }
      setMonthlyEventLock(getMonthlyEventLockStatus())
      setMonthlyEventCleared(null)
    } catch (err) {
      console.error('[Debug: MonthlyEvent] fetch failed', err)
      setMonthlyEventQuest(MOCK_MONTHLY_EVENT)
      saveMonthlyEventQuest(MOCK_MONTHLY_EVENT)
      setMonthlyEventLock(getMonthlyEventLockStatus())
    } finally {
      setIsFetchingMonthlyEvent(false)
    }
  }

  const handleSubmitWeekendReport = async (quest: { title: string; description: string; flavorText?: string }) => {
    const reflection = weekendReflectionInput.trim()
    if (!reflection) { alert('感想を入力してください'); return }
    setIsSubmittingReport('weekend')
    try {
      let message: string | null
      if (getMockApiEnabled()) {
        message = await mockDelay(MOCK_REPORT_MESSAGE)
      } else {
        const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questTitle: quest.title, reflection }) })
        const data = await res.json().catch(() => ({}))
        message = res.ok ? data.message : (isQuotaError(res, data) ? FALLBACK_CLEAR_MESSAGE : null)
        if (!res.ok && isQuotaError(res, data)) alert('APIの利用制限に達しました。クリアは記録済みです。')
        if (message === null) throw new Error((data as { detail?: string }).detail ?? 'API error')
      }
      saveWeekendChallengeCleared(message)
      setWeekendCleared(message)
      setWeekendReflectionInput('')
      const primaryStat = (quest as { primaryStat?: PrimaryStat }).primaryStat ?? getQuestPrimaryStatByTitle(quest.title) ?? 'str'
      const { leveledUp, newLevel } = applyWeekendClearProgress(message, quest.title, reflection, (quest as { stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number } }).stats, primaryStat)
      const milestoneResult = claimStreakMilestoneIfEligible(getStreakDays(), loadPlayerStatus())
      if (milestoneResult) {
        setPlayerStatus(milestoneResult.newStatus)
        savePlayerStatus(milestoneResult.newStatus)
        setStreakMilestoneModal({ milestone: milestoneResult.milestone, expGained: milestoneResult.expGained })
      }
      const clearResult = { message, questTitle: quest.title, leveledUp, newLevel }
      if (shouldTriggerSingularity()) {
        window.dispatchEvent(new CustomEvent(SINGULARITY_TRIGGER_EVENT, { detail: { pendingClearModal: clearResult, sourcePeriod: 'weekly', sourceDifficulty: 'intermediate' } }))
      } else {
        setClearMessageModal(clearResult)
      }
      if (leveledUp) {
        if (getMockApiEnabled()) {
          const prefix = await mockDelay(MOCK_TITLE_PREFIX)
          updatePrefix(prefix)
          setPlayerStatus((s) => ({ ...s, prefix }))
        } else {
          const history = getClearHistory()
          const r = await fetch('/api/title', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recentClears: history }) })
          if (r.ok) {
            const { prefix } = await r.json().catch(() => ({}))
            if (prefix) { updatePrefix(prefix); setPlayerStatus((s) => ({ ...s, prefix })) }
          }
        }
      }
    } catch (err) {
      console.error('[Debug: Weekend report] failed', err)
      alert(err instanceof Error ? err.message : '報告の提出に失敗しました')
    } finally {
      setIsSubmittingReport(null)
    }
  }

  const handleSubmitMonthlyEventReport = async (quest: { title: string; description: string; flavorText?: string }) => {
    const reflection = monthlyEventReflectionInput.trim()
    if (!reflection) { alert('感想を入力してください'); return }
    setIsSubmittingReport('monthlyEvent')
    try {
      let message: string | null
      if (getMockApiEnabled()) {
        message = await mockDelay(MOCK_REPORT_MESSAGE)
      } else {
        const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questTitle: quest.title, reflection }) })
        const data = await res.json().catch(() => ({}))
        message = res.ok ? data.message : (isQuotaError(res, data) ? FALLBACK_CLEAR_MESSAGE : null)
        if (!res.ok && isQuotaError(res, data)) alert('APIの利用制限に達しました。クリアは記録済みです。')
        if (message === null) throw new Error((data as { detail?: string }).detail ?? 'API error')
      }
      saveMonthlyEventCleared(message)
      setMonthlyEventCleared(message)
      setMonthlyEventReflectionInput('')
      const { leveledUp, newLevel } = applyMonthlyEventClearProgress(message, quest.title, reflection, (quest as { stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number } }).stats)
      const milestoneResult = claimStreakMilestoneIfEligible(getStreakDays(), loadPlayerStatus())
      if (milestoneResult) {
        setPlayerStatus(milestoneResult.newStatus)
        savePlayerStatus(milestoneResult.newStatus)
        setStreakMilestoneModal({ milestone: milestoneResult.milestone, expGained: milestoneResult.expGained })
      }
      const clearResult = { message, questTitle: quest.title, leveledUp, newLevel }
      if (shouldTriggerSingularity()) {
        window.dispatchEvent(new CustomEvent(SINGULARITY_TRIGGER_EVENT, { detail: { pendingClearModal: clearResult, sourcePeriod: 'monthly', sourceDifficulty: 'advanced' } }))
      } else {
        setClearMessageModal(clearResult)
      }
      if (leveledUp) {
        if (getMockApiEnabled()) {
          const prefix = await mockDelay(MOCK_TITLE_PREFIX)
          updatePrefix(prefix)
          setPlayerStatus((s) => ({ ...s, prefix }))
        } else {
          const history = getClearHistory()
          const r = await fetch('/api/title', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recentClears: history }) })
          if (r.ok) {
            const { prefix } = await r.json().catch(() => ({}))
            if (prefix) { updatePrefix(prefix); setPlayerStatus((s) => ({ ...s, prefix })) }
          }
        }
      }
    } catch (err) {
      console.error('[Debug: MonthlyEvent report] failed', err)
      alert(err instanceof Error ? err.message : '報告の提出に失敗しました')
    } finally {
      setIsSubmittingReport(null)
    }
  }

  const handleReceiveInvertedQuest = async () => {
    if (!getInvertedQuestLockStatus().canFetch) return
    setIsFetchingInverted(true)
    try {
      if (getMockApiEnabled()) {
        await mockDelay(0)
        setInvertedQuest(MOCK_INVERTED_QUEST)
        saveInvertedQuest(MOCK_INVERTED_QUEST)
      } else {
        const res = await fetch('/api/quest/invert', { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error((data as { detail?: string }).detail ?? 'API error')
        const quests = (data as { quests?: { title: string; description: string; flavorText?: string }[] }).quests
        if (!quests?.length) throw new Error('Invalid invert format')
        const q = quests[0]
        setInvertedQuest(q)
        saveInvertedQuest(q)
      }
      setInvertedLock(getInvertedQuestLockStatus())
      setInvertedCleared(null)
    } catch (err) {
      console.error('[Debug: Invert] fetch failed', err)
      setInvertedQuest(MOCK_INVERTED_QUEST)
      saveInvertedQuest(MOCK_INVERTED_QUEST)
      setInvertedLock(getInvertedQuestLockStatus())
    } finally {
      setIsFetchingInverted(false)
    }
  }

  const handleSubmitInvertedReport = async (quest: { title: string; description: string; flavorText?: string }) => {
    const reflection = invertedReflectionInput.trim()
    if (!reflection) { alert('感想を入力してください'); return }
    setIsSubmittingReport('inverted')
    try {
      let message: string | null
      if (getMockApiEnabled()) {
        message = await mockDelay(MOCK_REPORT_MESSAGE)
      } else {
        const res = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questTitle: quest.title, reflection }) })
        const data = await res.json().catch(() => ({}))
        message = res.ok ? data.message : (isQuotaError(res, data) ? FALLBACK_CLEAR_MESSAGE : null)
        if (!res.ok && isQuotaError(res, data)) alert('APIの利用制限に達しました。クリアは記録済みです。')
        if (message === null) throw new Error((data as { detail?: string }).detail ?? 'API error')
      }
      saveInvertedQuestCleared(message)
      setInvertedCleared(message)
      setInvertedReflectionInput('')
      const primaryStat = (quest as { primaryStat?: PrimaryStat }).primaryStat ?? getQuestPrimaryStatByTitle(quest.title) ?? 'str'
      const { leveledUp, newLevel } = applyInvertedClearProgress(message, quest.title, reflection, (quest as { stats?: { str: number; dex: number; end: number; int: number; fai: number; arc: number } }).stats, primaryStat)
      const milestoneResult = claimStreakMilestoneIfEligible(getStreakDays(), loadPlayerStatus())
      if (milestoneResult) {
        setPlayerStatus(milestoneResult.newStatus)
        savePlayerStatus(milestoneResult.newStatus)
        setStreakMilestoneModal({ milestone: milestoneResult.milestone, expGained: milestoneResult.expGained })
      }
      const clearResult = { message, questTitle: quest.title, leveledUp, newLevel }
      if (shouldTriggerSingularity()) {
        window.dispatchEvent(new CustomEvent(SINGULARITY_TRIGGER_EVENT, { detail: { pendingClearModal: clearResult, sourcePeriod: 'daily', sourceDifficulty: 'beginner' } }))
      } else {
        setClearMessageModal(clearResult)
      }
      if (leveledUp) {
        if (getMockApiEnabled()) {
          const prefix = await mockDelay(MOCK_TITLE_PREFIX)
          updatePrefix(prefix)
          setPlayerStatus((s) => ({ ...s, prefix }))
        } else {
          const history = getClearHistory()
          const r = await fetch('/api/title', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recentClears: history }) })
          if (r.ok) {
            const { prefix } = await r.json().catch(() => ({}))
            if (prefix) { updatePrefix(prefix); setPlayerStatus((s) => ({ ...s, prefix })) }
          }
        }
      }
    } catch (err) {
      console.error('[Debug: Inverted report] failed', err)
      alert(err instanceof Error ? err.message : '報告の提出に失敗しました')
    } finally {
      setIsSubmittingReport(null)
    }
  }

  const handleRerollSubmit = async () => {
    if (!rerollModal) return
    const constraints = rerollConstraints.trim()
    if (!constraints) { alert('制約を入力してください'); return }
    setIsRerolling(true)
    try {
      let quest: { title: string; description: string; flavorText?: string }
      if (getMockApiEnabled()) {
        quest = await mockDelay(MOCK_REROLL_QUEST)
      } else {
        const res = await fetch('/api/quest/reroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ constraints, originalQuest: rerollModal.quest }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail ?? data.error ?? 'API error')
        quest = data.quest
      }
      if (quest?.title && quest?.description) {
        const { comboKey: ck, index } = rerollModal
        setRerollReplacementsByCombo((p) => {
          const curr = p[ck] ?? {}
          return { ...p, [ck]: { ...curr, [index]: { title: quest.title, description: quest.description, flavorText: quest.flavorText ?? '' } } }
        })
        setRerollModal(null)
        setRerollConstraints('')
      }
    } catch (err) {
      console.error('[Debug: API Error] /api/quest/reroll failed', {
        error: err instanceof Error ? err.message : String(err),
        constraints: rerollConstraints,
      })
      alert(err instanceof Error ? err.message : '代替案の取得に失敗しました')
    } finally {
      setIsRerolling(false)
    }
  }

  const getMissionColor = (tier: QuestTier) => {
    switch (tier) {
      case 'beginner': return 'hsl(var(--neon-orange))'
      case 'intermediate': return 'hsl(var(--cyber-blue))'
      case 'advanced': return 'hsl(var(--emergency-red))'
      case 'abyss': return 'hsl(var(--emergency-red))'
    }
  }

  const prestigeCount = playerStatus.prestigeCount ?? 0
  const isRebornUser = prestigeCount > 0
  const unlockedCombos = getUnlockedCombos(playerStatus.level, prestigeCount)
  const firstCombo = unlockedCombos[0]
  const defaultPeriod = firstCombo?.period ?? 'daily'
  const defaultDifficulty = firstCombo?.difficulty ?? 'beginner'
  const statusLabel = playerStatus.prefix ? `【${playerStatus.prefix}】 ${playerStatus.rank}` : playerStatus.rank
  const showTutorialEnd = playerStatus.tier === 3
  const expLabel = isRebornUser ? '業' : 'EXP'
  const showPrestigeButton = playerStatus.level >= MAX_LEVEL

  const displayStats = playerStatus.stats ?? { str: 10, dex: 10, end: 10, int: 10, fai: 10, arc: 10 }
  const { userClass, dominantStatForIcon } = getClassFromStats(displayStats)
  const AURA_BY_STAT: Record<string, string> = {
    str: 'bg-gradient-to-br from-red-900/40 to-black',
    dex: 'bg-gradient-to-br from-emerald-900/40 to-black',
    end: 'bg-gradient-to-br from-stone-700/40 to-black',
    int: 'bg-gradient-to-br from-blue-900/40 to-black',
    fai: 'bg-gradient-to-br from-yellow-900/40 to-black',
    arc: 'bg-gradient-to-br from-purple-900/40 to-black',
  }
  const auraClass = dominantStatForIcon ? AURA_BY_STAT[dominantStatForIcon] : 'bg-gradient-to-br from-zinc-800/40 to-black'
  const STAT_LABELS: Record<string, string> = {
    str: '筋力',
    dex: '技量',
    end: '持久力',
    int: '理力',
    fai: '信仰',
    arc: '神秘',
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 pt-16 pb-4" data-tier={playerStatus.tier}>
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex flex-col gap-3 p-4 bg-muted/50 border border-border rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pulse-glow" title={`次: ${STREAK_MILESTONES.find((m) => !getClaimedStreakMilestones().includes(m)) ?? '―'}日で報酬`}>
                <Flame className="w-5 h-5 text-[hsl(var(--neon-orange))]" />
                <span className="font-mono text-sm font-bold">{streakDays}日間</span>
                {streakDays >= 2 && (
                  <span className="font-mono text-[10px] text-[hsl(var(--neon-orange))] border border-[hsl(var(--neon-orange))]/50 rounded px-1.5 py-0.5">
                    +{getStreakExpBonus(streakDays)} {expLabel}
                  </span>
                )}
                {STREAK_MILESTONES.some((m) => !getClaimedStreakMilestones().includes(m)) && (
                  <span className="font-mono text-[9px] text-muted-foreground">
                    →{STREAK_MILESTONES.find((m) => !getClaimedStreakMilestones().includes(m))}日で褒美
                  </span>
                )}
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="font-mono text-sm">
                <span className="text-muted-foreground">レベル {playerStatus.level}:</span>{' '}
                <span className="text-[hsl(var(--cyber-blue))]">{statusLabel}</span>
                {!isRebornUser && (
                  <span className="ml-2 text-[10px] text-muted-foreground/80 border border-muted rounded px-1.5 py-0.5">
                    {SEASON_LABELS[getCurrentSeason()]}の季節
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {developerMode && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground" onClick={clearQuestCache}>
                  🔄 Debug: クエスト履歴をリセット
                </Button>
              )}
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="hover:bg-muted">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
          {showPrestigeButton && (
            <>
              <Button
                onClick={() => setShowPrestigeConfirm(true)}
                className="w-full font-mono font-bold gap-2 border-2 border-red-900/80 bg-red-950/50 text-red-200 hover:bg-red-900/50 hover:text-red-100 hover:border-red-800 transition-all"
                variant="outline"
              >
                <Flame className="w-5 h-5" />
                火を継ぐ（転生する）
              </Button>
              <AlertDialog open={showPrestigeConfirm} onOpenChange={setShowPrestigeConfirm}>
                <AlertDialogContent className="border-red-900/60 bg-stone-950">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif text-lg text-stone-200">
                      火を継ぐ — 転生の誓約
                    </AlertDialogTitle>
                    <AlertDialogDescription className="font-mono text-sm text-stone-400 leading-relaxed space-y-2">
                      <p>火を継げば、汝は再び Lv1 の灰より甦る。</p>
                      <p>トロフィーと解放の証は引き継がれよう。しかし、蓄えし業（EXP）は全て消え入る。</p>
                      <p className="text-red-300/90 pt-2 font-serif italic">この誓い、本当に宜しいか？</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="border-stone-700 bg-stone-900/50 text-stone-300 hover:bg-stone-800/50">
                      戻る
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => executePrestige()}
                      className="bg-red-900 hover:bg-red-800 text-stone-100 border-0"
                    >
                      火を継ぐ
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          {playerStatus.level < MAX_LEVEL && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>{expLabel} {playerStatus.exp}/{playerStatus.expToNext}</span>
                <span className="text-[hsl(var(--neon-orange))]">
                  あと{getQuestsToNextLevel(playerStatus, defaultPeriod, defaultDifficulty, getStreakExpBonus(streakDays))}クエストでLv{Math.min(playerStatus.level + 1, MAX_LEVEL)}
                  {getNextUnlockForDifficulty(playerStatus.level, defaultPeriod, defaultDifficulty, prestigeCount)?.level === playerStatus.level + 1 && (
                    <span className="ml-1">（{getNextUnlockForDifficulty(playerStatus.level, defaultPeriod, defaultDifficulty, prestigeCount)?.label}解放）</span>
                  )}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (playerStatus.exp / playerStatus.expToNext) * 100)}%`, backgroundColor: 'hsl(var(--neon-orange))' }}
                />
              </div>
            </div>
          )}
        </header>

        {/* ステータス＆称号パネル（ダークソウル風・称号オーラ） */}
        <div
          className={`p-4 rounded-sm border border-stone-600/60 transition-colors duration-1000 ${auraClass}`}
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          <div className="font-serif text-center mb-3">
            <p
              className="text-lg font-bold tracking-wider"
              style={{
                color: 'rgba(180, 140, 90, 0.95)',
                textShadow: '0 0 12px rgba(180, 140, 90, 0.3), 1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {userClass}
            </p>
            <p className="text-[10px] text-stone-500 font-mono tracking-widest uppercase mt-0.5">
              称号
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-serif text-sm">
            {(['str', 'dex', 'end', 'int', 'fai', 'arc'] as const).map((key) => (
              <div
                key={key}
                className="flex justify-between items-baseline border-b border-stone-700/40 pb-1"
              >
                <span
                  className="tracking-wider"
                  style={{
                    color: 'rgba(160, 130, 85, 0.9)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {STAT_LABELS[key]}
                </span>
                <span
                  className="font-bold tabular-nums"
                  style={{
                    color: 'rgba(200, 170, 120, 0.95)',
                    textShadow: '0 0 8px rgba(180, 150, 100, 0.2)',
                  }}
                >
                  {displayStats[key] ?? 10}
                </span>
              </div>
            ))}
          </div>
        </div>

        {hasActiveSingularity && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(SINGULARITY_OPEN_EVENT))}
            className="w-full py-2.5 px-4 rounded-lg border-2 border-red-900/80 bg-red-950/40 text-red-400 font-mono text-sm font-bold hover:bg-red-900/30 transition-colors"
          >
            特異点に戻る
          </button>
        )}

        <div className="space-y-0 border border-border/50 rounded overflow-hidden">
          {unlockedCombos.map(({ period, difficulty }, comboIndex) => {
            const ck = comboKey(period, difficulty)
            const periodLabel = period === 'daily' ? 'Daily' : period === 'weekly' ? 'Weekly' : 'Monthly'
            const diffLabel = difficulty === 'beginner' ? '初級' : difficulty === 'intermediate' ? '中級' : difficulty === 'advanced' ? '上級' : '狂気'
            const missionColorClass =
              difficulty === 'beginner'
                ? 'border-slate-600 text-slate-400 bg-slate-900/50'
                : difficulty === 'intermediate'
                  ? 'border-amber-700/80 text-amber-500 bg-amber-950/40'
                  : difficulty === 'advanced'
                    ? 'border-red-800/80 text-red-500 bg-red-950/40'
                    : 'border-rose-900/80 text-rose-500 bg-rose-950/40'
            const quests = questsByCombo[ck] ?? []
            const cleared = clearedByCombo[ck] ?? {}
            const lock = questLockByCombo[ck] ?? { canFetch: true, nextUpdateMessage: '' }
            const isFetching = isFetchingByCombo[ck]
            const rerolls = rerollReplacementsByCombo[ck] ?? {}
            const extraQuest = extraQuestByCombo[ck]
            const extraCleared = extraQuestClearedByCombo[ck]
            const extraReflection = extraReflectionInputByCombo[ck] ?? ''

            return (
              <div key={ck} className={comboIndex > 0 ? 'mt-6' : ''}>
                <div className="mb-2 border-b border-gray-800 border-l-2 border-l-gray-500 py-2 pl-3 text-gray-400 text-xs font-bold tracking-widest uppercase">
                  {periodLabel.toUpperCase()} / {diffLabel}
                </div>
                {isFetching && !quests.length && (
                  <div className="py-6 text-center text-xs text-muted-foreground font-mono">クエストを受信中…</div>
                )}
                {!isFetching && !quests.length && lock.canFetch && (
                  <button
                    type="button"
                    onClick={() => handleReceiveNewQuest(period, difficulty)}
                    className="w-full py-3 px-3 text-left font-mono text-xs text-[hsl(var(--cyber-blue))] hover:bg-muted/50 border-b border-border/50"
                  >
                    クエストを受信
                  </button>
                )}
                {quests.length > 0 && (() => {
                  const items = quests.map((q, i) => {
                    const quest = (rerolls[i] ?? q) as QuestWithOptionalId
                    const fromServer = quest.id ? completedQuestIdsFromServer.has(quest.id) : false
                    const fromLocal = cleared[i]
                    const isCleared = fromServer || !!fromLocal
                    const clearedMessage = typeof fromLocal === 'string' ? fromLocal : fromServer ? '達成済' : undefined
                    return { id: `${ck}-${i}`, idx: i, quest, isCleared, clearedMessage }
                  })
                  const inProgress = items.filter((x) => !x.isCleared)
                  const completed = items.filter((x) => x.isCleared)
                  const sorted = [...inProgress, ...completed]
                  return sorted.map(({ id, idx, quest, isCleared, clearedMessage }) => (
                    <QuestFeedItem
                      key={id}
                      id={id}
                      title={quest.title}
                      badge={diffLabel}
                      badgeColor={missionColorClass}
                      isExpanded={expandedQuestId === id}
                      onToggle={() => setExpandedQuestId((x) => (x === id ? null : id))}
                      flavorText={quest.flavorText}
                      description={quest.description}
                      isCleared={isCleared}
                      clearedMessage={clearedMessage}
                      reflection={reflectionInputs[`${ck}-${idx}`]}
                      onReflectionChange={(v) => setReflectionInputs((p) => ({ ...p, [`${ck}-${idx}`]: v }))}
                      onSubmit={() => startTransition(() => { void handleSubmitReport(ck, period, difficulty, idx, quest) })}
                      isSubmitting={isSubmittingReport === `${ck}-${idx}` || isPending}
                      onReroll={() => setRerollModal({ comboKey: ck, period, difficulty, index: idx, quest })}
                      canReroll={!rerolls[idx]}
                    />
                  ))
                })()}
                {!quests.length && !lock.canFetch && lock.nextUpdateMessage && (
                  <div className="py-2 px-3 text-xs text-muted-foreground font-mono border-b border-border/50">{lock.nextUpdateMessage}</div>
                )}
                {extraQuest && (
                  <QuestFeedItem
                    id={`extra-${ck}`}
                    title={extraQuest.title}
                    badge="EXTRA"
                    badgeColor="border-amber-700/80 text-amber-500 bg-amber-950/40"
                    isExpanded={expandedQuestId === `extra-${ck}`}
                    onToggle={() => setExpandedQuestId((x) => (x === `extra-${ck}` ? null : `extra-${ck}`))}
                    flavorText={extraQuest.flavorText}
                    description={extraQuest.description}
                    isCleared={!!extraCleared}
                    clearedMessage={extraCleared ?? undefined}
                    reflection={extraReflection}
                    onReflectionChange={(v) => setExtraReflectionInputByCombo((p) => ({ ...p, [ck]: v }))}
                    onSubmit={() => handleSubmitExtraReport(ck, period, difficulty, extraQuest)}
                    isSubmitting={isSubmittingReport === `extra-${ck}`}
                    submitLabel={`誓約を果たす（+50% ${expLabel}）`}
                  />
                )}
              </div>
            )
          })}

          {isWeekend() && (
            <>
              <div className="mt-4 mb-2 border-b border-gray-800 border-l-2 border-l-gray-500 py-2 pl-3 text-gray-400 text-xs font-bold tracking-widest">WEEKEND / 週末</div>
              {!weekendQuest ? (
                <button
                  type="button"
                  onClick={handleReceiveWeekendChallenge}
                  disabled={isFetchingWeekend || !weekendLock.canFetch}
                  className="w-full py-3 px-3 text-left font-mono text-xs text-cyan-500 hover:bg-muted/50 border-b border-border/50 disabled:opacity-50"
                >
                  {isFetchingWeekend ? '生成中...' : '週末チャレンジを受信'}
                </button>
              ) : (
                <QuestFeedItem
                  id="weekend"
                  title={weekendQuest.title}
                  badge="週末"
                  badgeColor="text-cyan-500 border-cyan-500/50"
                  isExpanded={expandedQuestId === 'weekend'}
                  onToggle={() => setExpandedQuestId((x) => (x === 'weekend' ? null : 'weekend'))}
                  flavorText={weekendQuest.flavorText}
                  description={weekendQuest.description}
                  isCleared={!!weekendCleared}
                  clearedMessage={weekendCleared ?? undefined}
                  reflection={weekendReflectionInput}
                  onReflectionChange={setWeekendReflectionInput}
                  onSubmit={() => handleSubmitWeekendReport(weekendQuest)}
                  isSubmitting={isSubmittingReport === 'weekend'}
                  submitLabel={`誓約を果たす（+30 ${expLabel}）`}
                />
              )}
            </>
          )}

          {isMonthlyEventUnlocked(playerStatus.level) && (
            <>
              <div className="mt-4 mb-2 border-b border-gray-800 border-l-2 border-l-gray-500 py-2 pl-3 text-gray-400 text-xs font-bold tracking-widest">MONTHLY THEME / 月間テーマ</div>
              {!monthlyEventQuest ? (
                <button
                  type="button"
                  onClick={handleReceiveMonthlyEventQuest}
                  disabled={isFetchingMonthlyEvent || !monthlyEventLock.canFetch}
                  className="w-full py-3 px-3 text-left font-mono text-xs text-emerald-500 hover:bg-muted/50 border-b border-border/50 disabled:opacity-50"
                >
                  {isFetchingMonthlyEvent ? '生成中...' : '月間テーマを受信'}
                </button>
              ) : (
                <QuestFeedItem
                  id="monthlyEvent"
                  title={monthlyEventQuest.title}
                  badge="月間"
                  badgeColor="text-emerald-500 border-emerald-500/50"
                  isExpanded={expandedQuestId === 'monthlyEvent'}
                  onToggle={() => setExpandedQuestId((x) => (x === 'monthlyEvent' ? null : 'monthlyEvent'))}
                  flavorText={monthlyEventQuest.flavorText}
                  description={monthlyEventQuest.description}
                  isCleared={!!monthlyEventCleared}
                  clearedMessage={monthlyEventCleared ?? undefined}
                  reflection={monthlyEventReflectionInput}
                  onReflectionChange={setMonthlyEventReflectionInput}
                  onSubmit={() => handleSubmitMonthlyEventReport(monthlyEventQuest)}
                  isSubmitting={isSubmittingReport === 'monthlyEvent'}
                  submitLabel={`誓約を果たす（+35 ${expLabel}）`}
                />
              )}
            </>
          )}

          {isInvertedQuestUnlocked(playerStatus.level) && (
            <>
              <div className="mt-4 mb-2 border-b border-gray-800 border-l-2 border-l-gray-500 py-2 pl-3 text-gray-400 text-xs font-bold tracking-widest">INVERTED / 反転</div>
              {!invertedQuest ? (
                <button
                  type="button"
                  onClick={handleReceiveInvertedQuest}
                  disabled={isFetchingInverted || !invertedLock.canFetch}
                  className="w-full py-3 px-3 text-left font-mono text-xs text-violet-500 hover:bg-muted/50 border-b border-border/50 disabled:opacity-50"
                >
                  {isFetchingInverted ? '生成中...' : '反転クエストを受信'}
                </button>
              ) : (
                <QuestFeedItem
                  id="inverted"
                  title={invertedQuest.title}
                  badge="反転"
                  badgeColor="text-violet-500 border-violet-500/50"
                  isExpanded={expandedQuestId === 'inverted'}
                  onToggle={() => setExpandedQuestId((x) => (x === 'inverted' ? null : 'inverted'))}
                  flavorText={invertedQuest.flavorText}
                  description={invertedQuest.description}
                  isCleared={!!invertedCleared}
                  clearedMessage={invertedCleared ?? undefined}
                  reflection={invertedReflectionInput}
                  onReflectionChange={setInvertedReflectionInput}
                  onSubmit={() => handleSubmitInvertedReport(invertedQuest)}
                  isSubmitting={isSubmittingReport === 'inverted'}
                  submitLabel={`誓約を果たす（+25 ${expLabel}）`}
                />
              )}
            </>
          )}

          {isTrialUnlocked(playerStatus.level) && (
            <>
              <div className="mt-4 mb-2 border-b border-gray-800 border-l-2 border-l-gray-500 py-2 pl-3 text-gray-400 text-xs font-bold tracking-widest">TRIAL / 試練</div>
              {!trialQuest ? (
                <button
                  type="button"
                  onClick={handleReceiveTrialQuest}
                  disabled={isFetchingTrial || !trialLock.canFetch}
                  className="w-full py-3 px-3 text-left font-mono text-xs text-purple-500 hover:bg-muted/50 border-b border-border/50 disabled:opacity-50"
                >
                  {isFetchingTrial ? '生成中...' : '試練を受信'}
                </button>
              ) : (
                <QuestFeedItem
                  id="trial"
                  title={trialQuest.title}
                  badge="試練"
                  badgeColor="text-purple-500 border-purple-500/50"
                  isExpanded={expandedQuestId === 'trial'}
                  onToggle={() => setExpandedQuestId((x) => (x === 'trial' ? null : 'trial'))}
                  flavorText={trialQuest.flavorText}
                  description={trialQuest.description}
                  isCleared={!!trialCleared}
                  clearedMessage={trialCleared ?? undefined}
                  reflection={trialReflectionInput}
                  onReflectionChange={setTrialReflectionInput}
                  onSubmit={() => handleSubmitTrialReport(trialQuest)}
                  isSubmitting={isSubmittingReport === 'trial'}
                  submitLabel={`誓約を果たす（+40 ${expLabel}）`}
                />
              )}
            </>
          )}

          {getNextUnlockForDifficulty(playerStatus.level, defaultPeriod, defaultDifficulty, prestigeCount) && (
            <div className="py-1.5 px-3 text-[10px] text-gray-600 font-mono border-t border-border/30">
              🔒 Lv{getNextUnlockForDifficulty(playerStatus.level, defaultPeriod, defaultDifficulty, prestigeCount)?.level}で{getNextUnlockForDifficulty(playerStatus.level, defaultPeriod, defaultDifficulty, prestigeCount)?.label}解放
            </div>
          )}
        </div>

      </div>

      {/* Top Nav（既存ダークHUD維持） */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-muted/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto grid grid-cols-3">
          <Link href="/quest" className={`flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase ${pathname === '/quest' ? 'text-[hsl(var(--neon-orange))] bg-[hsl(var(--neon-orange))]/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <Swords className="w-4 h-4" /> クエスト
          </Link>
          <Link href="/history" className={`flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase ${pathname === '/history' ? 'text-[hsl(var(--cyber-blue))] bg-[hsl(var(--cyber-blue))]/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <ScrollText className="w-4 h-4" /> 記録
          </Link>
          <Link href="/trophy" className={`flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase ${pathname === '/trophy' ? 'text-[hsl(var(--emergency-red))] bg-[hsl(var(--emergency-red))]/10' : 'text-muted-foreground hover:text-foreground'}`}>
            <Award className="w-4 h-4" /> Trophy
          </Link>
        </div>
      </nav>

      {streakMilestoneModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setStreakMilestoneModal(null)}>
          <div className="relative max-w-sm w-full p-6 rounded-lg border-2 bg-background/95 float-up border-amber-500" style={{ boxShadow: '0 0 40px rgba(245,158,11,0.3)' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-3">
              <p className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400">連続{streakMilestoneModal.milestone}日達成</p>
              <p className="font-mono text-sm text-muted-foreground">継続の証、ここに刻む</p>
              <p className="font-mono text-2xl font-bold" style={{ color: 'hsl(var(--neon-orange))' }}>+{streakMilestoneModal.expGained} {isRebornUser ? '業' : 'EXP'}</p>
              <Button variant="outline" size="sm" className="w-full font-mono" onClick={() => setStreakMilestoneModal(null)}>受け取る</Button>
            </div>
          </div>
        </div>
      )}

      {clearMessageModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setClearMessageModal(null)}>
          <div className="relative max-w-md w-full p-6 rounded-lg border-2 bg-background/95 float-up" style={{ borderColor: 'hsl(var(--cyber-blue))', boxShadow: '0 0 40px hsl(var(--cyber-blue) / 0.3)' }} onClick={(e) => e.stopPropagation()}>
            {clearMessageModal.leveledUp && clearMessageModal.newLevel && (
              <div className="mb-4 p-3 rounded-lg border-2 animate-pulse" style={{ borderColor: 'hsl(var(--neon-orange))', backgroundColor: 'hsl(var(--neon-orange)/0.1)' }}>
                <p className="font-mono font-bold text-lg text-center" style={{ color: 'hsl(var(--neon-orange))' }}>Lv{clearMessageModal.newLevel} 昇格</p>
                <p className="font-mono text-xs text-center text-muted-foreground mt-1">新たなクエストが解禁された</p>
              </div>
            )}
            <p className="font-mono text-xs uppercase text-muted-foreground mb-2">{clearMessageModal.questTitle} — CLEAR</p>
            <p className="text-lg italic text-foreground/95 leading-relaxed">「{clearMessageModal.message}」</p>
            <Button variant="outline" size="sm" className="mt-4 w-full font-mono" onClick={() => setClearMessageModal(null)}>閉じる</Button>
          </div>
        </div>
      )}

      {rerollModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isRerolling && setRerollModal(null)}>
          <div className="relative max-w-md w-full p-6 rounded-lg border-2 bg-background/95 float-up" style={{ borderColor: 'hsl(var(--neon-orange))', boxShadow: '0 0 40px hsl(var(--neon-orange) / 0.2)' }} onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-xs uppercase text-muted-foreground mb-2">{rerollModal.quest.title} — 代替案を求める</p>
            <p className="text-sm text-muted-foreground mb-3">実行が難しい制約を書いてください。</p>
            <Textarea placeholder="例：今日は10分しか取れない" value={rerollConstraints} onChange={(e) => setRerollConstraints(e.target.value)} className="min-h-[80px] font-mono text-sm resize-none mb-4" disabled={isRerolling} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 font-mono" onClick={() => !isRerolling && setRerollModal(null)} disabled={isRerolling}>キャンセル</Button>
              <Button size="sm" className="flex-1 font-mono gap-2" style={{ backgroundColor: 'hsl(var(--neon-orange))', color: 'hsl(var(--background))' }} onClick={handleRerollSubmit} disabled={isRerolling}>{isRerolling ? '生成中...' : '代替案を生成'}</Button>
            </div>
          </div>
        </div>
      )}

      {(isAnyFetching || isFetchingWeekend || isFetchingMonthlyEvent || isFetchingInverted || isFetchingTrial) && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col items-center justify-center gap-10 px-6 max-w-lg">
            <div className="relative w-28 h-28 flex items-center justify-center" style={{ perspective: '120px' }}>
              <div className="absolute w-16 h-16 border-2 border-amber-600/80 rounded-sm" style={{ animation: 'flip-square 1.8s ease-in-out infinite', transformStyle: 'preserve-3d' }} />
              <Flame className="w-10 h-10 text-amber-500/90 relative z-10 animate-pulse" />
            </div>
            <p className="font-mono text-sm text-muted-foreground tracking-wider">クエスト信号を受信中…</p>
            {loadingTip && <p className="text-center text-sm italic text-amber-900/90 dark:text-amber-200/70 leading-relaxed">{loadingTip}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
