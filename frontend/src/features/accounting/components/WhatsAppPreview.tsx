import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'
import { IconWhatsApp } from '@/shared/components/icons'

interface WhatsAppPreviewProps {
  text: string
  title?: string
  onCopy: () => void
  onSend: () => void
  onExportPdf?: () => void
  isCopying?: boolean
}

export function WhatsAppPreview({
  text,
  title = 'Texto para WhatsApp',
  onCopy,
  onSend,
  onExportPdf,
  isCopying = false,
}: WhatsAppPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          readOnly
          value={text}
          className="min-h-80 w-full rounded-xl border border-border/70 bg-surface/40 px-4 py-3 text-sm leading-relaxed text-foreground"
        />
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={onSend}
          >
            <IconWhatsApp className="mr-2 size-4" />
            Enviar no WhatsApp
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onCopy}
            isLoading={isCopying}
          >
            Copiar texto
          </Button>
          {onExportPdf ? (
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onExportPdf}
            >
              Exportar PDF
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
