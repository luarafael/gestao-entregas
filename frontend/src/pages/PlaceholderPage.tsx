import type { ReactNode } from 'react'

interface PlaceholderPageProps {
  title: string
  description: string
  icon?: ReactNode
}

export function PlaceholderPage({
  title,
  description,
  icon,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-border/60 bg-card/70 p-8 text-center backdrop-blur-xl">
        {icon ? (
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <p className="mt-4 inline-flex rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
          Em breve na próxima etapa
        </p>
      </div>
    </div>
  )
}
