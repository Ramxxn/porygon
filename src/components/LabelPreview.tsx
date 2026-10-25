
import { useEffect, useRef, useState } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import type { ShippingLabel } from "../types/label";
import type { SourcePdf } from "../types/pdf";
import { getPageRaster } from "../services/pageRaster";

type LabelPreviewProps = {
  labels: ShippingLabel[];
  files: SourcePdf[];
  selectedId: string;
  onSelect: (id: string) => void;
};

type ThumbnailProps = {
  label: ShippingLabel;
  source: SourcePdf | undefined;
};

function LabelThumbnail({ label, source }: ThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "180px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function renderCrop() {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (!visible) return;
      if (!canvas || !context || !source) {
        setStatus("error");
        return;
      }

      setStatus("loading");

      try {
        const fullCanvas = await getPageRaster(source, label.pageIndex);
        const scale = fullCanvas.width / label.sourcePageWidth;

        if (cancelled) return;

        const pageHeight = label.sourcePageHeight;

        const left = label.cropBox.left * scale;
        const top = (pageHeight - label.cropBox.top) * scale;
        const width = (label.cropBox.right - label.cropBox.left) * scale;
        const height = (label.cropBox.top - label.cropBox.bottom) * scale;

        if (width <= 0 || height <= 0) {
          throw new Error("Invalid crop boundaries.");
        }

        const pixelRatio = Math.min(2, 500 / Math.max(width, height));
        canvas.width = Math.max(1, Math.round(width * pixelRatio));
        canvas.height = Math.max(1, Math.round(height * pixelRatio));

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
          fullCanvas,
          left,
          top,
          width,
          height,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void renderCrop();

    return () => {
      cancelled = true;
    };
  }, [label, source, visible]);

  return (
    <div ref={containerRef} className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-2">
      {status === "loading" && visible && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <LoaderCircle size={15} className="animate-spin" />
          Rendering crop…
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertTriangle size={16} />
          Preview unavailable
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-label={`Cropped preview for ${label.sourceFileName}`}
        className={`max-h-52 max-w-full object-contain ${
          status === "ready" ? "block" : "hidden"
        }`}
      />
    </div>
  );
}

export default function LabelPreview({
  labels,
  files,
  selectedId,
  onSelect,
}: LabelPreviewProps) {
  if (!labels.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <FileText className="mx-auto text-gray-400" size={28} />
        <p className="mt-3 text-sm font-semibold">No labels detected yet</p>
        <p className="mt-1 text-xs text-gray-500">
          Upload a PDF and select Detect labels to review the suggested crops.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {labels.map((label, index) => {
        const selected = label.id === selectedId;
        const needsReview = label.confidence < 0.6;
        const source = files.find((file) => file.id === label.sourceFileId);

        return (
          <button
            key={label.id}
            type="button"
            onClick={() => onSelect(label.id)}
            aria-pressed={selected}
            className={`min-w-0 rounded-xl border bg-white p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              selected
                ? "border-blue-500 ring-2 ring-blue-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-blue-600">
                  <FileText size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    Label {index + 1}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {label.sourceFileName}
                  </p>
                </div>
              </div>
              {needsReview ? (
                <AlertTriangle
                  size={17}
                  className="shrink-0 text-amber-500"
                />
              ) : (
                <CheckCircle2
                  size={17}
                  className="shrink-0 text-emerald-600"
                />
              )}
            </div>

            <LabelThumbnail label={label} source={source} />

            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-600">
                Page {label.pageIndex + 1}
              </span>
              <span
                className={`rounded-md px-2 py-1 ${
                  needsReview
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {needsReview ? "Check crop" : "Ready to review"}
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Crop area:{" "}
              {Math.round(label.cropBox.right - label.cropBox.left)} ×{" "}
              {Math.round(label.cropBox.top - label.cropBox.bottom)} pt
            </p>
          </button>
        );
      })}
    </div>
  );
}
