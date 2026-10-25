
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type { SourcePdf } from "../types/pdf";

type PdfPreviewProps = {
  file?: SourcePdf;
};

export default function PdfPreview({ file }: PdfPreviewProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPageNumber(1);
    setError("");
  }, [file?.id]);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      if (!file || !canvasRef.current) return;

      try {
        setError("");
        const page = await file.pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.25 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          canvas,
          viewport,
        }).promise;

        if (cancelled) return;
      } catch {
        if (!cancelled) setError("Unable to render this PDF page.");
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
    };
  }, [file, pageNumber]);

  return (
    <section className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">PDF preview</h2>
          <p className="mt-1 truncate text-xs text-gray-500">
            {file?.file.name ?? "Your selected PDF will appear here"}
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((value) => value - 1)}
              aria-label="Previous page"
              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="whitespace-nowrap text-xs text-gray-500">
              Page <strong className="text-gray-900">{pageNumber}</strong> of{" "}
              {file.pdf.numPages}
            </span>
            <button
              type="button"
              disabled={pageNumber >= file.pdf.numPages}
              onClick={() => setPageNumber((value) => value + 1)}
              aria-label="Next page"
              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-100 p-4 sm:p-7">
        {file ? (
          <div className="max-w-full bg-white p-2 shadow-md ring-1 ring-gray-200">
            <canvas ref={canvasRef} className="block h-auto max-w-full" />
            {error && (
              <p role="alert" className="p-3 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-sm text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-400 shadow-sm">
              <FileText size={26} />
            </span>
            <h3 className="mt-5 text-sm font-semibold">No PDF selected</h3>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Upload an order PDF to preview its pages.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-[11px] text-gray-400">
        <span>Preview only</span>
        <span>Original PDF is not modified</span>
      </div>
    </section>
  );
}
