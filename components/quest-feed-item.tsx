'use client'

import { ChevronDown, ChevronRight, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export interface QuestFeedItemProps {
  id: string
  title: string
  badge: string
  badgeColor: string
  isExpanded: boolean
  onToggle: () => void
  flavorText?: string
  description?: string
  isCleared: boolean
  clearedMessage?: string
  reflection?: string
  onReflectionChange?: (v: string) => void
  onSubmit?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  onReroll?: () => void
  canReroll?: boolean
}

export function QuestFeedItem({
  id,
  title,
  badge,
  badgeColor,
  isExpanded,
  onToggle,
  flavorText,
  description,
  isCleared,
  clearedMessage,
  reflection = '',
  onReflectionChange,
  onSubmit,
  isSubmitting,
  submitLabel = '報告を提出',
  onReroll,
  canReroll,
}: QuestFeedItemProps) {
  return (
    <div
      className={`border-b border-border/50 transition-colors ${isCleared ? 'bg-muted/30 opacity-75' : 'bg-muted/10'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 py-2.5 px-3 text-left hover:bg-muted/30 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className={`flex-1 font-mono text-sm truncate ${isCleared ? 'text-muted-foreground' : ''}`}>
          {title}
        </span>
        <span
          className={`shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded border ${badgeColor}`}
        >
          {badge}
        </span>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/30">
          {description && <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>}
          {flavorText && (
            <blockquote className="text-[11px] italic text-muted-foreground/80 border-l-2 border-muted-foreground/40 pl-2 py-1">
              {flavorText}
            </blockquote>
          )}
          {isCleared && clearedMessage && (
            <p className="text-xs italic text-muted-foreground/90">「{clearedMessage}」</p>
          )}
          {!isCleared && (
            <>
              {canReroll && onReroll && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground" onClick={onReroll}>
                  代替案を求める
                </Button>
              )}
              {onReflectionChange && onSubmit && (
                <>
                  <Textarea
                    placeholder="やってみてどうだった？1文でOK"
                    value={reflection}
                    onChange={(e) => onReflectionChange(e.target.value)}
                    className="min-h-[48px] font-mono text-xs resize-none py-2"
                    disabled={isSubmitting}
                  />
                  <Button size="sm" className="w-full font-mono text-xs h-8 gap-1.5" onClick={onSubmit} disabled={isSubmitting}>
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? '送信中...' : submitLabel}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
