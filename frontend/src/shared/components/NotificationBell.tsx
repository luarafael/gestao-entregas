import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBell } from '@/shared/components/icons'
import { cn } from '@/shared/utils/cn'
import { useNotificationStore } from '@/shared/stores/notification.store'
import { formatTimeBR } from '@/shared/utils/format'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const items = useNotificationStore((state) => state.items)
  const markRead = useNotificationStore((state) => state.markRead)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const unreadCount = useNotificationStore((state) => state.unreadCount())

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notificações"
        onClick={() => setOpen((current) => !current)}
        className="relative flex size-10 items-center justify-center rounded-xl border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
      >
        <IconBell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="text-sm font-semibold">Notificações</p>
            {items.length > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-primary hover:underline"
              >
                Marcar todas como lidas
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Nenhuma notificação recente.
              </p>
            ) : (
              items.map((item) => {
                const content = (
                  <div
                    className={cn(
                      'border-b border-border/40 px-4 py-3 transition-colors hover:bg-surface/40',
                      !item.read && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatTimeBR(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.message}
                    </p>
                  </div>
                )

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={() => {
                        markRead(item.id)
                        setOpen(false)
                      }}
                    >
                      {content}
                    </Link>
                  )
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    className="block w-full text-left"
                    onClick={() => markRead(item.id)}
                  >
                    {content}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
