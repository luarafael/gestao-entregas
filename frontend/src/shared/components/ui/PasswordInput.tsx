import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { IconEye, IconEyeOff } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn(
              'h-10 w-full rounded-xl border border-border/70 bg-surface/50 px-3 pr-10 text-sm',
              'placeholder:text-muted-foreground/70',
              'transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
              error && 'border-danger/50 focus:border-danger/50 focus:ring-danger/20',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            className={cn(
              'absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg',
              'text-muted-foreground transition-colors hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            )}
          >
            {visible ? (
              <IconEyeOff className="size-4" aria-hidden />
            ) : (
              <IconEye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
