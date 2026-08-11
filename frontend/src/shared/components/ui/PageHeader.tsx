import type { ReactNode } from 'react'
import { cn } from '@/shared/utils/cn'

type PageHeaderSize = 'page' | 'section'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
  size?: PageHeaderSize
}

export function PageHeader({
  title,
  description,
  children,
  className,
  size = 'page',
}: PageHeaderProps) {
  const isPage = size === 'page'

  return (
    <header className={cn('min-w-0 space-y-4', className)}>
      <div className="min-w-0">
        {typeof title === 'string' ? (
          isPage ? (
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          ) : (
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          )
        ) : (
          title
        )}
        {description ? (
          typeof description === 'string' ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : (
            description
          )
        ) : null}
      </div>
      {children ? (
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {children}
        </div>
      ) : null}
    </header>
  )
}

export function PageHeaderActions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-3 sm:ml-auto', className)}
    >
      {children}
    </div>
  )
}

export const toolbarSelectClassName =
  'min-w-0 w-full sm:w-auto sm:min-w-36 sm:max-w-48'

export const toolbarFieldClassName = 'min-w-0'
