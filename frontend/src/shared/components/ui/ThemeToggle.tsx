import { motion } from 'framer-motion'
import { useThemeStore } from '@/shared/stores/theme.store'
import { IconMoon, IconSun } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={cn(
        'relative flex size-10 items-center justify-center rounded-xl',
        'border border-border/60 bg-surface/60 text-muted-foreground',
        'transition-colors hover:bg-surface hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        className,
      )}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        {isDark ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
      </motion.div>
    </button>
  )
}
