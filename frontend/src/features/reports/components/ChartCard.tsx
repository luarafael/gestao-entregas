import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}

export function ChartCard({
  title,
  description,
  children,
  action,
}: ChartCardProps) {
  return (
    <Card className="h-full min-w-0 overflow-hidden">
      <CardHeader className="items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
