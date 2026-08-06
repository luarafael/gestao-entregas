import { jsPDF } from 'jspdf'

export const PDF_MARGIN = 14
export const PDF_LINE_HEIGHT = 6

function pageBottom(doc: jsPDF) {
  return doc.internal.pageSize.getHeight() - PDF_MARGIN
}

export function getAppName() {
  return import.meta.env.VITE_APP_NAME ?? 'Gestão de Entregas'
}

export function sanitizeFilename(name: string) {
  return name.replace(/[<>:"/\\|?*]/g, '-')
}

export function createPdfWithHeader(title: string) {
  const doc = new jsPDF()
  let y = PDF_MARGIN

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(getAppName(), PDF_MARGIN, y)
  y += 8

  doc.setFontSize(13)
  doc.text(title, PDF_MARGIN, y)
  y += 6

  doc.setDrawColor(180)
  doc.setLineWidth(0.3)
  doc.line(PDF_MARGIN, y, doc.internal.pageSize.getWidth() - PDF_MARGIN, y)
  y += 8

  return { doc, y }
}

export function advanceY(
  doc: jsPDF,
  y: number,
  needed = PDF_LINE_HEIGHT,
  lineHeight = PDF_LINE_HEIGHT,
) {
  if (y + needed > pageBottom(doc)) {
    doc.addPage()
    return PDF_MARGIN
  }

  return y + lineHeight
}

export function addSectionTitle(doc: jsPDF, y: number, title: string) {
  y = advanceY(doc, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text(title, PDF_MARGIN, y)
  return y + PDF_LINE_HEIGHT + 2
}

export function addKeyValueRow(
  doc: jsPDF,
  y: number,
  label: string,
  value: string,
  labelWidth = 58,
) {
  y = advanceY(doc, y)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`${label}:`, PDF_MARGIN, y)
  doc.setFont('helvetica', 'normal')
  doc.text(value, PDF_MARGIN + labelWidth, y)
  return y + PDF_LINE_HEIGHT
}

export function addParagraph(doc: jsPDF, y: number, text: string, maxWidth = 182) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(text, maxWidth) as string[]

  for (const line of lines) {
    y = advanceY(doc, y)
    doc.text(line, PDF_MARGIN, y)
  }

  return y + PDF_LINE_HEIGHT
}

export function addTableHeader(
  doc: jsPDF,
  y: number,
  columns: { label: string; x: number; align?: 'left' | 'right' }[],
) {
  y = advanceY(doc, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)

  for (const col of columns) {
    if (col.align === 'right') {
      doc.text(col.label, col.x, y, { align: 'right' })
    } else {
      doc.text(col.label, col.x, y)
    }
  }

  y += PDF_LINE_HEIGHT - 2
  doc.setDrawColor(200)
  doc.line(PDF_MARGIN, y, doc.internal.pageSize.getWidth() - PDF_MARGIN, y)
  return y + 4
}

export function addTableRow(
  doc: jsPDF,
  y: number,
  columns: { text: string; x: number; align?: 'left' | 'right' }[],
) {
  y = advanceY(doc, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  for (const col of columns) {
    if (col.align === 'right') {
      doc.text(col.text, col.x, y, { align: 'right' })
    } else {
      doc.text(col.text, col.x, y)
    }
  }

  return y + PDF_LINE_HEIGHT
}

export function addGeneratedAtFooter(doc: jsPDF, y: number) {
  y = advanceY(doc, y, PDF_LINE_HEIGHT * 2)
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    PDF_MARGIN,
    y,
  )
  doc.setTextColor(0)
  return y
}

export function savePdf(doc: jsPDF, filename: string) {
  doc.save(sanitizeFilename(filename))
}
