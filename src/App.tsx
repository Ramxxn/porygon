
import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { Upload, FileText, Download, LoaderCircle } from 'lucide-react'

const PAGE_W = 595.28 // A4 width in points
const PAGE_H = 841.89 // A4 height in points
const MARGIN = 20
const GAP = 8

export default function App() {
  const [files, setFiles] = useState<File[]>([])
  const [rows, setRows] = useState(4)
  const [cols, setCols] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState(0)

  async function generatePDF() {
    if (!files.length) {
      setError('Please select at least one PDF.')
      return
    }

    if (rows * cols > 100) {
      setError('Maximum 100 labels per page for this MVP.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const output = await PDFDocument.create()
      const labels: {
        page: Awaited<ReturnType<typeof output.embedPdf>>[number]
        width: number
        height: number
      }[] = []

      for (const file of files) {
        const source = await PDFDocument.load(await file.arrayBuffer())
        const embeddedPages = await output.embedPdf(
          await file.arrayBuffer()
        )

        embeddedPages.forEach((page) => {
          const size = page.scale(1)
          labels.push({ page, width: size.width, height: size.height })
        })
      }

      const perPage = rows * cols
      const cellW = (PAGE_W - 2 * MARGIN - (cols - 1) * GAP) / cols
      const cellH = (PAGE_H - 2 * MARGIN - (rows - 1) * GAP) / rows

      for (let start = 0; start < labels.length; start += perPage) {
        const sheet = output.addPage([PAGE_W, PAGE_H])

        labels.slice(start, start + perPage).forEach((label, i) => {
          const row = Math.floor(i / cols)
          const col = i % cols

          const scale = Math.min(
            cellW / label.width,
            cellH / label.height
          )

          const width = label.width * scale
          const height = label.height * scale
          const x = MARGIN + col * (cellW + GAP) + (cellW - width) / 2
          const y = PAGE_H - MARGIN - (row + 1) * cellH - row * GAP
            + (cellH - height) / 2

          sheet.drawPage(label.page, { x, y, width, height })
        })
      }

      const bytes = await output.save()
      const blob = new Blob([bytes as BlobPart], {
        type: 'application/pdf',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'porygon-labels.pdf'
      link.click()
      URL.revokeObjectURL(url)
      setCount(labels.length)
    } catch (e) {
      setError('Could not process these PDFs. Check that they are valid and not password-protected.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white px-5 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-[#E9967A]/15 p-3 text-[#D47B60]">
              <FileText size={28} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Porygon</h1>
          </div>
          <p className="text-slate-500">
            Combine shipping labels. Save paper. Print smarter.
          </p>
        </header>

        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center transition hover:border-[#E9967A] hover:bg-[#E9967A]/5">
            <Upload size={32} className="text-[#D47B60]" />
            <span className="font-semibold">Choose shipping label PDFs</span>
            <span className="text-sm text-slate-500">
              Select multiple PDF files
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-slate-700 file:shadow-sm"
              onChange={(e) => {
                setFiles(Array.from(e.target.files ?? []))
                setError('')
              }}
            />
          </label>

          {files.length > 0 && (
            <p className="text-sm text-emerald-600">
              {files.length} PDF file(s) selected
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-600">
              Rows per page
              <input
                type="number"
                min={1}
                max={100}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-[#E9967A] focus:ring-2 focus:ring-[#E9967A]/20"
              />
            </label>

            <label className="text-sm font-medium text-slate-600">
              Columns per page
              <input
                type="number"
                min={1}
                max={100}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-[#E9967A] focus:ring-2 focus:ring-[#E9967A]/20"
              />
            </label>
          </div>

          <p className="text-sm text-slate-500">
            Layout: {rows * cols} labels per A4 page, with automatic extra pages.
          </p>

          <button
            onClick={generatePDF}
            disabled={loading || !files.length || rows < 1 || cols < 1}
            className="flex w-full items-center justify-center gap-2 rounded-xl p-4 bg-gray-600 text-white hover:bg-gray-700 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <LoaderCircle className="animate-spin" /> : <Download />}
            {loading ? 'Generating PDF...' : 'Generate & Download PDF'}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {count > 0 && !error && (
            <p className="text-sm text-emerald-600">
              Generated {count} labels successfully.
            </p>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Your PDFs are processed locally in your browser.
        </p>
      </div>
    </main>
  )
}
