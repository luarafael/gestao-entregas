import { create } from 'zustand'

export type NotificationType =
  | 'approval'
  | 'delivery'
  | 'pendencia'
  | 'route'
  | 'prestacao'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  href?: string
  read: boolean
  createdAt: string
}

interface NotificationState {
  items: AppNotification[]
  addNotification: (
    notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>,
  ) => void
  markRead: (id: string) => void
  markAllRead: () => void
  removeNotification: (id: string) => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  addNotification: (notification) => {
    const id = crypto.randomUUID()
    set((state) => ({
      items: [
        {
          ...notification,
          id,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.items,
      ].slice(0, 50),
    }))
  },
  markRead: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
    })),
  removeNotification: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  unreadCount: () => get().items.filter((item) => !item.read).length,
}))
