import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label ? (
          <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-24 w-full rounded-xl border border-border/70 bg-surface/50 px-3 py-2 text-sm',
            'placeholder:text-muted-foreground/70 resize-y',
            'transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
            error && 'border-danger/50 focus:border-danger/50 focus:ring-danger/20',
            className,
          )}
          {...props}
        />
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
