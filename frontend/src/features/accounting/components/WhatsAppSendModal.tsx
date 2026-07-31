import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Input } from '@/shared/components/ui'
import { IconWhatsApp } from '@/shared/components/icons'
import { toast } from '@/shared/stores/toast.store'
import { cn } from '@/shared/utils/cn'
import { whatsappContactFormSchema } from '../schemas/whatsappContact.schema'
import { useWhatsAppContactsStore } from '../stores/whatsappContacts.store'
import {
  buildWhatsAppMessage,
  type DailyReportSummary,
} from '../utils/whatsappMessage'
import { formatWhatsAppPhoneDisplay, openWhatsApp } from '../utils/whatsappUrl'
import { WhatsAppContactsManager } from './WhatsAppContactsManager'

export interface WhatsAppSendPayload {
  baseText: string
  dailyReport?: DailyReportSummary
}

interface WhatsAppSendModalProps {
  open: boolean
  onClose: () => void
  payload: WhatsAppSendPayload | null
}

function getInitialContactState(
  contacts: { id: string }[],
  lastSelectedContactId: string | null,
) {
  if (contacts.length === 0) {
    return {
      selectedContactId: null as string | null,
      useCustomNumber: true,
      saveContact: true,
    }
  }

  const defaultId =
    lastSelectedContactId &&
    contacts.some((contact) => contact.id === lastSelectedContactId)
      ? lastSelectedContactId
      : contacts[0]?.id ?? null

  return {
    selectedContactId: defaultId,
    useCustomNumber: false,
    saveContact: false,
  }
}

function WhatsAppSendModalContent({
  payload,
  onClose,
}: {
  payload: WhatsAppSendPayload
  onClose: () => void
}) {
  const contacts = useWhatsAppContactsStore((state) => state.contacts)
  const lastSelectedContactId = useWhatsAppContactsStore(
    (state) => state.lastSelectedContactId,
  )
  const addContact = useWhatsAppContactsStore((state) => state.addContact)
  const setLastSelectedContactId = useWhatsAppContactsStore(
    (state) => state.setLastSelectedContactId,
  )

  const initialContactState = getInitialContactState(
    contacts,
    lastSelectedContactId,
  )

  const [selectedContactId, setSelectedContactId] = useState(
    initialContactState.selectedContactId,
  )
  const [useCustomNumber, setUseCustomNumber] = useState(
    initialContactState.useCustomNumber,
  )
  const [customName, setCustomName] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [saveContact, setSaveContact] = useState(initialContactState.saveContact)
  const [includeDailyReport, setIncludeDailyReport] = useState(true)
  const [showManager, setShowManager] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSend = async () => {
    let phone = ''
    let name = ''

    if (useCustomNumber) {
      const parsed = whatsappContactFormSchema.safeParse({
        name: customName || 'Contato',
        phone: customPhone,
      })

      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? 'Número inválido')
        return
      }

      phone = parsed.data.phone
      name = parsed.data.name

      if (saveContact) {
        const saved = addContact({ name, phone })
        setLastSelectedContactId(saved.id)
      }
    } else {
      const contact = contacts.find((item) => item.id === selectedContactId)

      if (!contact) {
        setFormError('Selecione um contato ou informe um número')
        return
      }

      phone = contact.phone
      name = contact.name
      setLastSelectedContactId(contact.id)
    }

    const message = buildWhatsAppMessage(
      payload.baseText,
      includeDailyReport,
      payload.dailyReport,
    )

    try {
      await openWhatsApp(phone, message)
      toast(
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
          ? `Abrindo WhatsApp para ${name}`
          : `Mensagem copiada! Cole no chat com Ctrl+V (WhatsApp: ${name})`,
        'success',
      )
      onClose()
    } catch {
      toast('Não foi possível copiar ou abrir o WhatsApp', 'error')
    }
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label="Fechar modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <IconWhatsApp className="size-5 text-emerald-500" />
          <h2 className="text-lg font-semibold tracking-tight">
            Enviar no WhatsApp
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha um contato. No computador, a mensagem é copiada e você cola no
          chat com Ctrl+V para manter os emojis.
        </p>

        <div className="mt-4 space-y-4">
          {showManager ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Números salvos</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowManager(false)}
                >
                  Voltar
                </Button>
              </div>
              <WhatsAppContactsManager />
            </div>
          ) : (
            <>
              {contacts.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Favoritos</p>
                  <div className="max-h-40 space-y-2 overflow-y-auto">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => {
                          setSelectedContactId(contact.id)
                          setUseCustomNumber(false)
                          setFormError(null)
                        }}
                        className={cn(
                          'w-full rounded-xl border px-3 py-2 text-left transition-colors',
                          !useCustomNumber && selectedContactId === contact.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border/60 bg-surface/30 hover:bg-surface/50',
                        )}
                      >
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatWhatsAppPhoneDisplay(contact.phone)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setUseCustomNumber(true)
                  setSelectedContactId(null)
                  setSaveContact(true)
                  setFormError(null)
                }}
                className={cn(
                  'w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                  useCustomNumber
                    ? 'border-primary bg-primary/10'
                    : 'border-border/60 bg-surface/30 hover:bg-surface/50',
                )}
              >
                Usar outro número
              </button>

              {useCustomNumber ? (
                <div className="space-y-3 rounded-xl border border-border/60 bg-surface/20 p-3">
                  <Input
                    label="Nome do contato"
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    placeholder="Ex: Financeiro, Cliente..."
                  />
                  <Input
                    label="Número do WhatsApp"
                    value={customPhone}
                    onChange={(event) => setCustomPhone(event.target.value)}
                    placeholder="11999998888"
                    error={formError ?? undefined}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={saveContact}
                      onChange={(event) => setSaveContact(event.target.checked)}
                      className="size-4 rounded border-border accent-primary"
                    />
                    Salvar número nos favoritos
                  </label>
                </div>
              ) : null}

              {payload.dailyReport ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeDailyReport}
                    onChange={(event) =>
                      setIncludeDailyReport(event.target.checked)
                    }
                    className="size-4 rounded border-border accent-primary"
                  />
                  Incluir relatório diário no final da mensagem
                </label>
              ) : null}

              <Button
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() => setShowManager(true)}
              >
                Gerenciar números salvos
              </Button>
            </>
          )}
        </div>

        {!showManager ? (
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSend}>
              <IconWhatsApp className="mr-2 size-4" />
              Enviar
            </Button>
          </div>
        ) : null}
      </motion.div>
    </>
  )
}

export function WhatsAppSendModal({
  open,
  onClose,
  payload,
}: WhatsAppSendModalProps) {
  return (
    <AnimatePresence>
      {open && payload ? (
        <WhatsAppSendModalContent
          key={payload.baseText.slice(0, 32)}
          payload={payload}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  )
}
