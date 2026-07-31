import { ThemeToggle } from '@/shared/components/ui'
import { IconMenu } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

interface NavbarProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
  className?: string
}

export function Navbar({
  title,
  subtitle,
  onMenuClick,
  className,
}: NavbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 items-center justify-between gap-4',
        'border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground md:hidden"
          aria-label="Abrir menu"
        >
          <IconMenu className="size-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
