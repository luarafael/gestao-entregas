import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  glass?: boolean
  animated?: boolean
}

export function Card({
  children,
  className,
  glass = true,
  animated = false,
}: CardProps) {
  const classes = cn(
    'rounded-2xl border p-5 outline-none focus:outline-none focus-visible:outline-none',
    glass
      ? 'border-border/60 bg-card/70 backdrop-blur-xl'
      : 'border-border bg-card',
    className,
  )

  if (!animated) {
    return <div className={classes}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={classes}
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
