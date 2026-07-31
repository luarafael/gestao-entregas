import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
}

export function Card({
  children,
  className,
  hover = false,
  glass = true,
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border p-5',
        glass
          ? 'border-border/60 bg-card/70 backdrop-blur-xl'
          : 'border-border bg-card',
        hover && 'transition-colors hover:border-primary/30 hover:bg-card/90',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('text-sm font-medium text-muted-foreground', className)}>
      {children}
    </h3>
  )
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn(className)}>{children}</div>
}
