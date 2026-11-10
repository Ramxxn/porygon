import type { LabelLayout, ShippingLabel } from "../types/label";
import { Settings2 } from "lucide-react";

type PrintPreviewProps = {
  labels: ShippingLabel[];
  layout: LabelLayout;
  onOpenLayout: () => void;
};

export default function PrintPreview({
  labels,
  layout,
  onOpenLayout,
}: PrintPreviewProps) {
  const labelsPerSheet = Math.max(1, layout.rows * layout.columns);
  const sheetCount = Math.ceil(labels.length / labelsPerSheet);

  const previewWidth = 210;
  const previewHeight = previewWidth * (layout.pageHeight / layout.pageWidth);
  const previewScale = previewWidth / layout.pageWidth;
  const gap = layout.gap * previewScale;
  const margin = layout.margin * previewScale;
  const cellWidth =
    (layout.pageWidth - layout.margin * 2 - layout.gap * (layout.columns - 1)) /
    layout.columns;
  const cellHeight =
    (layout.pageHeight - layout.margin * 2 - layout.gap * (layout.rows - 1)) /
    layout.rows;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Print Preview
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Sheet geometry is scaled to match the exported PDF.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto">
         
          <div className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3">
            <span className="text-xs font-semibold leading-none text-gray-600">
              {sheetCount}
            </span>
            <span className="text-xs font-medium text-gray-500">
              {sheetCount === 1 ? "Sheet" : "Sheets"}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenLayout}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <Settings2 size={15} />
            Sheet Layout
          </button>
        </div>
      </div>

      {labels.length === 0 ? (
        <p className="mt-5 rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
          Detect labels to see the print layout.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {Array.from({ length: sheetCount }, (_, sheetIndex) => {
            const start = sheetIndex * labelsPerSheet;
            const sheetLabels = labels.slice(start, start + labelsPerSheet);

            return (
              <div key={sheetIndex}>
                <p className="mb-2 text-xs font-medium text-gray-600">
                  Sheet {sheetIndex + 1}
                </p>
                <div
                  className="mx-auto grid overflow-hidden border border-gray-300 bg-white"
                  style={{
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                    padding: `${margin}px`,
                    gap: `${gap}px`,
                    gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
                  }}
                >
                  {sheetLabels.map((label, labelIndex) => {
                    const cropWidth = label.cropBox.right - label.cropBox.left;
                    const cropHeight = label.cropBox.top - label.cropBox.bottom;
                    const outputScale = Math.min(
                      layout.labelWidth / cropWidth,
                      layout.labelHeight / cropHeight,
                      cellWidth / cropWidth,
                      cellHeight / cropHeight,
                    );
                    const width = cropWidth * outputScale * previewScale;
                    const height = cropHeight * outputScale * previewScale;
                    return (
                      <div
                        key={label.id}
                        className="flex min-h-0 items-center justify-center overflow-hidden border border-dashed border-[#68C7D0] bg-[#68C7D0]/10"
                        title={`${label.sourceFileName} · ${cropWidth.toFixed(0)} × ${cropHeight.toFixed(0)} pt`}
                      >
                        <div
                          className="flex max-h-full max-w-full items-center justify-center overflow-hidden border border-[#68C7D0] bg-white text-[8px] font-medium text-[#263238]"
                          style={{ width: `${width}px`, height: `${height}px` }}
                        >
                          #{start + labelIndex + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
