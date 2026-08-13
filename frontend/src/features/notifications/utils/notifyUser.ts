import { useCallback } from 'react'
import {
  useNotificationStore,
  type AppNotification,
  type NotificationType,
} from '@/shared/stores/notification.store'
import { toast } from '@/shared/stores/toast.store'
import { showNativeNotification } from '@/shared/utils/pushNotification'

type ToastVariant = 'info' | 'success' | 'error'

export interface NotifyUserInput {
  type: NotificationType
  title: string
  message: string
  href?: string
  tag?: string
  showToast?: boolean
  toastVariant?: ToastVariant
}

export function useNotifyUser() {
  const addNotification = useNotificationStore((state) => state.addNotification)

  return useCallback(
    (input: NotifyUserInput) => {
      notifyUser(addNotification, input)
    },
    [addNotification],
  )
}

export function notifyUser(
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void,
  input: NotifyUserInput,
) {
  addNotification({
    type: input.type,
    title: input.title,
    message: input.message,
    href: input.href,
  })

  void showNativeNotification(input.title, {
    body: input.message,
    tag: input.tag ?? `${input.type}-${input.title}`,
    url: input.href,
  })

  if (input.showToast) {
    toast(input.message, input.toastVariant ?? 'info')
  }
}
