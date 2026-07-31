import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore, type ToastType } from '@/shared/stores/toast.store'
import { cn } from '@/shared/utils/cn'

const styles: Record<ToastType, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-primary/30 bg-primary/10 text-primary',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-100 flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className={cn(
              'pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-xl',
              styles[item.type],
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{item.message}</span>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="text-current/70 hover:text-current"
                aria-label="Fechar notificação"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
