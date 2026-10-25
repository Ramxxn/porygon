
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ShippingLabel } from "../types/label";
import type { SourcePdf } from "../types/pdf";
import { getPageRaster } from "../services/pageRaster";

type PdfPreviewProps = {
  file?: SourcePdf;
  label?: ShippingLabel;
  onLabelChange: (label: ShippingLabel) => void;
};

type DragState = {
  pointerX: number;
  pointerY: number;
  cropBox: ShippingLabel["cropBox"];
  action: "move" | "resize";
  handle?: string;
};

export default function PdfPreview({
  file,
  label,
  onLabelChange,
}: PdfPreviewProps) {
  const [pageNumber, setPageNumber] = useState(
    label && label.sourceFileId === file?.id ? label.pageIndex + 1 : 1,
  );
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dragBox, setDragBox] = useState<ShippingLabel["cropBox"] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      if (!file || !canvasRef.current) return;

      try {
        setError("");
        const raster = await getPageRaster(file, pageNumber - 1);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.width = raster.width;
        canvas.height = raster.height;
        context.drawImage(raster, 0, 0);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? `Unable to render this PDF page: ${cause.message}`
              : "Unable to render this PDF page.",
          );
        }
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
    };
  }, [file, pageNumber]);

  const showCrop = Boolean(
    label &&
      label.sourceFileId === file?.id &&
      label.pageIndex + 1 === pageNumber,
  );

  function startDrag(
    event: ReactPointerEvent<HTMLElement>,
    action: DragState["action"],
    handle?: string,
  ) {
    if (!label || !pageRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      cropBox: { ...label.cropBox },
      action,
      handle,
    };
    setDragBox({ ...label.cropBox });
  }

  function updateDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || !label || !pageRef.current) return;
    const bounds = pageRef.current.getBoundingClientRect();
    const dx = ((event.clientX - drag.pointerX) / bounds.width) * label.sourcePageWidth;
    const dy = ((event.clientY - drag.pointerY) / bounds.height) * label.sourcePageHeight;
    const minimum = 8;
    let { left, right, bottom, top } = drag.cropBox;

    if (drag.action === "move") {
      const width = right - left;
      const height = top - bottom;
      left = Math.max(0, Math.min(label.sourcePageWidth - width, left + dx));
      right = left + width;
      top = Math.max(height, Math.min(label.sourcePageHeight, top - dy));
      bottom = top - height;
    } else {
      const handle = drag.handle ?? "";
      if (handle.includes("w")) left = Math.max(0, Math.min(right - minimum, left + dx));
      if (handle.includes("e")) right = Math.min(label.sourcePageWidth, Math.max(left + minimum, right + dx));
      if (handle.includes("n")) top = Math.min(label.sourcePageHeight, Math.max(bottom + minimum, top - dy));
      if (handle.includes("s")) bottom = Math.max(0, Math.min(top - minimum, bottom - dy));
    }

    setDragBox({ left, right, bottom, top });
  }

  function finishDrag() {
    if (dragBox && label) {
      onLabelChange({
        ...label,
        cropBox: dragBox,
        detectionMethod: "manual",
        confidence: 1,
      });
    }
    dragRef.current = null;
    setDragBox(null);
  }

  const visibleBox = dragBox ?? label?.cropBox;
  const cropStyle = showCrop && label
    ? {
        left: `${((visibleBox?.left ?? 0) / label.sourcePageWidth) * 100}%`,
        top: `${((label.sourcePageHeight - (visibleBox?.top ?? 0)) / label.sourcePageHeight) * 100}%`,
        width: `${(((visibleBox?.right ?? 0) - (visibleBox?.left ?? 0)) / label.sourcePageWidth) * 100}%`,
        height: `${(((visibleBox?.top ?? 0) - (visibleBox?.bottom ?? 0)) / label.sourcePageHeight) * 100}%`,
      }
    : undefined;

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
          <div ref={pageRef} className="relative w-full max-w-[680px] bg-white shadow-md ring-1 ring-gray-200">
            <canvas ref={canvasRef} className="block h-auto w-full" />
            {cropStyle && (
              <div
                className="absolute z-10 cursor-move touch-none border-2 border-[#E85D79] bg-[#E85D79]/10 shadow-[0_0_0_9999px_rgba(38,50,56,0.32)]"
                style={cropStyle}
                onPointerDown={(event) => startDrag(event, "move")}
                onPointerMove={updateDrag}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                aria-label="Drag to reposition the crop. Drag a handle to resize."
              >
                {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((handle) => (
                  <span
                    key={handle}
                    role="presentation"
                    onPointerDown={(event) => startDrag(event, "resize", handle)}
                    className={`absolute z-20 h-3 w-3 rounded-sm border-2 border-white bg-[#E85D79] shadow ${
                      handle.includes("n") ? "top-[-6px]" : handle.includes("s") ? "bottom-[-6px]" : "top-1/2 -translate-y-1/2"
                    } ${
                      handle.includes("w") ? "left-[-6px]" : handle.includes("e") ? "right-[-6px]" : "left-1/2 -translate-x-1/2"
                    } ${handle === "n" || handle === "s" ? "cursor-ns-resize" : handle === "e" || handle === "w" ? "cursor-ew-resize" : "cursor-nwse-resize"}`}
                  />
                ))}
              </div>
            )}
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
