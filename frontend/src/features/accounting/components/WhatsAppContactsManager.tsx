import { useState } from 'react'
import { Button, Input } from '@/shared/components/ui'
import { formatWhatsAppPhoneDisplay } from '../utils/whatsappUrl'
import { useWhatsAppContactsStore } from '../stores/whatsappContacts.store'
import { whatsappContactFormSchema } from '../schemas/whatsappContact.schema'

export function WhatsAppContactsManager() {
  const contacts = useWhatsAppContactsStore((state) => state.contacts)
  const updateContact = useWhatsAppContactsStore((state) => state.updateContact)
  const removeContact = useWhatsAppContactsStore((state) => state.removeContact)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const startEdit = (id: string, name: string, phone: string) => {
    setEditingId(id)
    setEditName(name)
    setEditPhone(phone)
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditPhone('')
    setEditError(null)
  }

  const saveEdit = () => {
    if (!editingId) return

    const parsed = whatsappContactFormSchema.safeParse({
      name: editName,
      phone: editPhone,
    })

    if (!parsed.success) {
      setEditError(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      return
    }

    updateContact(editingId, parsed.data)
    cancelEdit()
  }

  if (contacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum número salvo. Marque &quot;Salvar número&quot; ao enviar para
        adicionar favoritos.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="rounded-xl border border-border/60 bg-surface/30 p-3"
        >
          {editingId === contact.id ? (
            <div className="space-y-3">
              <Input
                label="Nome"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
              <Input
                label="WhatsApp"
                value={editPhone}
                onChange={(event) => setEditPhone(event.target.value)}
                placeholder="11999998888"
                error={editError ?? undefined}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={saveEdit}>
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatWhatsAppPhoneDisplay(contact.phone)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="edit"
                  size="sm"
                  onClick={() => startEdit(contact.id, contact.name, contact.phone)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeContact(contact.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
