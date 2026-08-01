import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { cn } from '@/shared/utils/cn'

interface StatCardProps {
  title: string
  value: string
  description?: string
  icon: ReactNode
  accent?: 'primary' | 'success' | 'warning' | 'neutral'
  delay?: number
}

const accentStyles = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-surface text-muted-foreground',
}

export function StatCard({
  title,
  value,
  description,
  icon,
  accent = 'primary',
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
    >
      <Card hover animated className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-xl',
              accentStyles[accent],
            )}
          >
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  )
}
