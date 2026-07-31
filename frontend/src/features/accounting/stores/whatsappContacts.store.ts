import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normalizeWhatsAppPhone } from '../utils/whatsappUrl'

export interface WhatsAppContact {
  id: string
  name: string
  phone: string
}

interface WhatsAppContactsState {
  contacts: WhatsAppContact[]
  lastSelectedContactId: string | null
  addContact: (contact: Omit<WhatsAppContact, 'id'>) => WhatsAppContact
  updateContact: (id: string, data: Partial<Omit<WhatsAppContact, 'id'>>) => void
  removeContact: (id: string) => void
  setLastSelectedContactId: (id: string | null) => void
}

function createContactId() {
  return crypto.randomUUID()
}

export const useWhatsAppContactsStore = create<WhatsAppContactsState>()(
  persist(
    (set, get) => ({
      contacts: [],
      lastSelectedContactId: null,

      addContact: (contact) => {
        const normalizedPhone = normalizeWhatsAppPhone(contact.phone)
        const existing = get().contacts.find(
          (item) => item.phone === normalizedPhone,
        )

        if (existing) {
          get().setLastSelectedContactId(existing.id)
          return existing
        }

        const newContact: WhatsAppContact = {
          id: createContactId(),
          name: contact.name.trim(),
          phone: normalizedPhone,
        }

        set((state) => ({
          contacts: [newContact, ...state.contacts],
          lastSelectedContactId: newContact.id,
        }))

        return newContact
      },

      updateContact: (id, data) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id
              ? {
                  ...contact,
                  ...(data.name !== undefined
                    ? { name: data.name.trim() }
                    : {}),
                  ...(data.phone !== undefined
                    ? { phone: normalizeWhatsAppPhone(data.phone) }
                    : {}),
                }
              : contact,
          ),
        }))
      },

      removeContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
          lastSelectedContactId:
            state.lastSelectedContactId === id
              ? null
              : state.lastSelectedContactId,
        }))
      },

      setLastSelectedContactId: (id) => {
        set({ lastSelectedContactId: id })
      },
    }),
    {
      name: 'sistema-rotas-whatsapp-contacts',
    },
  ),
)
