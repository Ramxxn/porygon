
import { useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Download, ScanSearch } from "lucide-react";

import Header from "./components/Header";
import PdfUploader from "./components/PdfUploader";
import CropSettings from "./components/CropSettings";
import PdfPreview from "./components/PdfPreview";
import LabelEditor from "./components/LabelEditor";
import LabelPreview from "./components/LabelPreview";
import LayoutSettings from "./components/LayoutSettings";
import PrintPreview from "./components/PrintPreview";

import type { SourcePdf } from "./types/pdf";
import type {
  CropMode,
  DetectionSettings,
  LabelLayout,
  ShippingLabel,
} from "./types/label";

import { detectLabelsForPage } from "./services/labelDetector";
import { exportLabelsToPdf, downloadPdf } from "./services/pdfExporter";

GlobalWorkerOptions.workerSrc = workerUrl;

const initialLayout: LabelLayout = {
  columns: 2,
  rows: 3,
  pageWidth: 595.28,
  pageHeight: 841.89,
  margin: 18,
  gap: 10,
};

export default function App() {
  const [files, setFiles] = useState<SourcePdf[]>([]);
  const [activeId, setActiveId] = useState("");
  const [cropMode, setCropMode] = useState<CropMode>("auto");
  const [rows, setRows] = useState(2);
  const [columns, setColumns] = useState(3);
  const [keepRatio, setKeepRatio] = useState(0.68);
  const [labels, setLabels] = useState<ShippingLabel[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState("");
  const [layout, setLayout] = useState<LabelLayout>(initialLayout);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeFile = files.find((file) => file.id === activeId);
  const selectedLabel = labels.find((label) => label.id === selectedLabelId);

  async function handleFiles(selectedFiles: FileList | File[]) {
    const pdfFiles = Array.from(selectedFiles).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"),
    );

    if (!pdfFiles.length) {
      setError("Please select one or more PDF files.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    const loadedFiles: SourcePdf[] = [];

    try {
      for (const file of pdfFiles) {
        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await getDocument({ data }).promise;

        loadedFiles.push({
          id: crypto.randomUUID(),
          file,
          pdf,
        });
      }

      setFiles((current) => [...current, ...loadedFiles]);

      if (!activeId && loadedFiles[0]) {
        setActiveId(loadedFiles[0].id);
      }
    } catch {
      for (const item of loadedFiles) void item.pdf.destroy();
      setError("A PDF could not be opened. Please check the file.");
    } finally {
      setLoading(false);
    }
  }

  function handleRemove(id: string) {
    const removed = files.find((file) => file.id === id);
    if (removed) void removed.pdf.destroy();

    const remaining = files.filter((file) => file.id !== id);
    setFiles(remaining);
    setLabels((current) => current.filter((label) => label.sourceFileId !== id));

    if (activeId === id) setActiveId(remaining[0]?.id ?? "");
  }

  async function runDetection() {
    if (!files.length) {
      setError("Upload at least one PDF before detecting labels.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const detected: ShippingLabel[] = [];

      const settings: DetectionSettings = {
        mode: cropMode,
        rows,
        columns,
        shippingLabelHeightRatio: keepRatio,
      };

      for (const source of files) {
        const bytes = new Uint8Array(await source.file.arrayBuffer());

        for (let pageIndex = 0; pageIndex < source.pdf.numPages; pageIndex++) {
          const pageLabels = await detectLabelsForPage({
            pdfBytes: bytes,
            sourceFileId: source.id,
            sourceFileName: source.file.name,
            pageIndex,
            settings,
          });

          detected.push(...pageLabels);
        }
      }

      setLabels(detected);
      setSelectedLabelId(detected[0]?.id ?? "");
      setMessage(
        `Created ${detected.length} crop suggestion(s). Review the boundaries before exporting.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not detect label regions.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateLabel(updated: ShippingLabel) {
    setLabels((current) =>
      current.map((label) => (label.id === updated.id ? updated : label)),
    );
  }

  async function handleExport(oneLabelPerPage: boolean) {
    if (!labels.length) {
      setError("Detect labels before exporting.");
      return;
    }

    setError("");
    setMessage("");
    setExporting(true);

    try {
      const sourceMap = new Map(
        files.map((item) => [item.id, item.file]),
      );

      const bytes = await exportLabelsToPdf({
        labels,
        sourceFiles: sourceMap,
        layout,
        oneLabelPerPage,
      });

      downloadPdf(
        bytes,
        oneLabelPerPage ? "porygon-labels.pdf" : "porygon-print-sheet.pdf",
      );

      setMessage("Your PDF export is ready.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "PDF export failed.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header canExport={labels.length > 0 && !exporting} />

      <main className="mx-auto max-w-[1500px] space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            PDF workspace
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Prepare shipping labels
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Keep the complete shipping label. Exclude invoice and product-details
            sections before printing.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <PdfUploader
              files={files}
              activeId={activeId}
              loading={loading}
              onFilesSelected={handleFiles}
              onSelect={setActiveId}
              onRemove={handleRemove}
            />

            <CropSettings
              mode={cropMode}
              rows={rows}
              columns={columns}
              onModeChange={setCropMode}
              onRowsChange={setRows}
              onColumnsChange={setColumns}
            />

            {cropMode === "grid" && (
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <label className="block text-xs text-gray-600">
                  Keep each grid cell's top
                  <span className="ml-1 font-semibold text-gray-900">
                    {Math.round(keepRatio * 100)}%
                  </span>
                  <input
                    type="range"
                    min="35"
                    max="100"
                    value={Math.round(keepRatio * 100)}
                    onChange={(event) => setKeepRatio(Number(event.target.value) / 100)}
                    className="mt-3 w-full accent-blue-600"
                  />
                </label>
                <p className="mt-2 text-[11px] leading-5 text-gray-500">
                  Use this to exclude the invoice portion below a shipping label.
                  Check each crop before exporting.
                </p>
              </section>
            )}

            <button
              type="button"
              onClick={runDetection}
              disabled={loading || files.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ScanSearch size={17} />
              {loading ? "Processing PDFs..." : "Detect labels"}
            </button>
          </aside>

          <div className="min-w-0 space-y-5">
            <PdfPreview file={activeFile} />

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Detected labels</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Select a label below to edit its crop boundaries.
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-600">
                  {labels.length} labels
                </span>
              </div>

              <LabelPreview
                labels={labels}
                files={files}
                selectedId={selectedLabelId}
                onSelect={setSelectedLabelId}
              />
            </section>

            <LabelEditor
              label={selectedLabel}
              onChange={updateLabel}
            />

            <LayoutSettings layout={layout} onChange={setLayout} />

            <PrintPreview labels={labels} layout={layout} />

            <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row">
              <button
                type="button"
                onClick={() => void handleExport(true)}
                disabled={!labels.length || exporting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                <Download size={16} />
                {exporting ? "Exporting..." : "Export one label per page"}
              </button>
              <button
                type="button"
                onClick={() => void handleExport(false)}
                disabled={!labels.length || exporting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Download size={16} />
                {exporting ? "Exporting..." : "Export print sheets"}
              </button>
            </section>
          </div>
        </div>

        <footer className="flex justify-between gap-4 py-2 text-[11px] text-gray-400">
          <span>Porygon</span>
          <span className="text-right">PDF processing runs in your browser</span>
        </footer>
      </main>
    </div>
  );
}
