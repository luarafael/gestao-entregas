import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

type PageDensity = 'default' | 'compact'

/**
 * Root wrapper for feature pages.
 * Prevents horizontal page overflow and standardizes vertical rhythm.
 */
export function PageShell({
  children,
  className,
  density = 'default',
}: {
  children: ReactNode
  className?: string
  density?: PageDensity
}) {
  return (
    <div
      className={cn(
        'min-w-0 max-w-full overflow-x-hidden',
        density === 'compact' ? 'space-y-4' : 'space-y-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Glass list/filter panel used beside forms (Entregas, Motoboys, Pendências).
 */
export function PagePanel({
  children,
  className,
  density = 'compact',
}: {
  children: ReactNode
  className?: string
  density?: PageDensity
}) {
  return (
    <div
      className={cn(
        'min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl',
        density === 'compact'
          ? 'space-y-3 p-3 sm:p-4'
          : 'space-y-4 p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

type PageSplitVariant = 'form' | 'wide'

const SPLIT_COLS: Record<PageSplitVariant, string> = {
  /** Form sidebar ~260–320px + fluid list */
  form: 'xl:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]',
  /** Wider form ~380px + fluid list (Motoboys / Pendências) */
  wide: 'xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]',
}

/**
 * Two-column page layout that never forces horizontal scroll.
 * Always includes minmax(0, 1fr) on the main column.
 */
export function PageSplit({
  children,
  className,
  variant = 'form',
}: {
  children: ReactNode
  className?: string
  variant?: PageSplitVariant
}) {
  return (
    <div
      className={cn(
        'grid min-w-0 gap-4 xl:gap-5',
        SPLIT_COLS[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Compact article card used in list rows (Entregas pattern). */
export const PAGE_CARD_ARTICLE =
  'rounded-xl border border-border/60 bg-surface/20 p-3 sm:p-4'

/** Nested value/payment blocks inside a card. */
export const PAGE_CARD_SECTION =
  'min-w-0 rounded-lg border border-border/50 bg-surface/25 p-3'
