import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'dangerSolid'
  | 'whatsapp'
  | 'import'
  | 'edit'
  | 'pdf'
  | 'copy'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
  secondary:
    'bg-surface text-foreground hover:bg-surface-hover border border-border/80',
  ghost: 'text-muted-foreground hover:bg-surface hover:text-foreground',
  danger:
    'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
  dangerSolid:
    'border border-[var(--theme-danger)] bg-[var(--theme-danger)] text-white shadow-sm shadow-[color-mix(in_oklab,var(--theme-danger)_35%,transparent)] hover:brightness-110 hover:shadow-md hover:shadow-[color-mix(in_oklab,var(--theme-danger)_45%,transparent)] active:scale-[0.98]',
  whatsapp:
    'border border-[#25D366] bg-[#25D366] text-white shadow-sm shadow-[#25D366]/25 hover:bg-[#20bd5a] hover:border-[#20bd5a]',
  import:
    'border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 shadow-sm shadow-primary/10',
  edit: 'border-sky-500/30 bg-sky-500/10 text-sky-800 hover:bg-sky-500/15 dark:text-sky-200',
  pdf: 'border-rose-500/30 bg-rose-500/10 text-rose-800 hover:bg-rose-500/15 dark:text-rose-200',
  copy: 'border-teal-500/30 bg-teal-500/10 text-teal-800 hover:bg-teal-500/15 dark:text-teal-200',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
