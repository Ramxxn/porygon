
import type { LabelLayout, ShippingLabel } from "../types/label";

type PrintPreviewProps = {
  labels: ShippingLabel[];
  layout: LabelLayout;
};

export default function PrintPreview({
  labels,
  layout,
}: PrintPreviewProps) {
  const labelsPerSheet = Math.max(1, layout.rows * layout.columns);
  const sheetCount = Math.ceil(labels.length / labelsPerSheet);

  const previewWidth = 210;
  const previewHeight = previewWidth * (layout.pageHeight / layout.pageWidth);
  const gap = Math.max(1, Math.min(8, layout.gap / 8));
  const margin = Math.max(3, Math.min(16, layout.margin / 8));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Print preview</h2>
          <p className="mt-1 text-xs text-gray-500">
            Approximate placement on your output sheet.
          </p>
        </div>
        <div className="rounded-lg bg-gray-100 px-3 py-2 text-right">
          <p className="text-sm font-semibold text-gray-900">{sheetCount}</p>
          <p className="text-[10px] text-gray-500">sheets</p>
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
                  {sheetLabels.map((label) => (
                    <div
                      key={label.id}
                      className="flex min-h-0 items-center justify-center overflow-hidden border border-dashed border-blue-300 bg-blue-50/70 p-1"
                      title={label.sourceFileName}
                    >
                      <div className="w-full space-y-1">
                        <div className="h-1.5 w-2/3 bg-gray-400" />
                        <div className="h-1 w-1/2 bg-gray-300" />
                        <div className="mt-1 h-3 w-full bg-gray-800" />
                        <div className="mx-auto h-3 w-1/3 bg-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
