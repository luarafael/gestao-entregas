import { Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui'

interface WhatsAppPreviewProps {
  text: string
  onCopy: () => void
  isCopying?: boolean
}

export function WhatsAppPreview({
  text,
  onCopy,
  isCopying = false,
}: WhatsAppPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Texto para WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          readOnly
          value={text}
          className="min-h-80 w-full rounded-xl border border-border/70 bg-surface/40 px-4 py-3 text-sm leading-relaxed text-foreground"
        />
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={onCopy}
          isLoading={isCopying}
        >
          Copiar para WhatsApp
        </Button>
      </CardContent>
    </Card>
  )
}
