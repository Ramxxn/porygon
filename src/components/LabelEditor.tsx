
import type { ShippingLabel } from "../types/label";

type LabelEditorProps = {
    label?: ShippingLabel;
    onRemove: (id: string) => void;
    onMove: (id: string, direction: -1 | 1) => void;
};

export default function LabelEditor({
    label,
    onRemove,
    onMove,
}: LabelEditorProps) {
    if (!label) {
        return (
            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="text-sm font-semibold">Crop editor</h2>
                <p className="mt-2 text-xs text-gray-500">
                    Select a detected label to edit its boundaries.
                </p>
            </section>
        );
    }

    const { sourcePageWidth: width, sourcePageHeight: height, cropBox } = label;

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                <h2 className="text-sm font-semibold">Crop editor</h2>
                <p className="mt-1 text-xs text-gray-500">
                    Drag the highlighted region to move it; use its handles to resize.{" "}
                    {label.sourceFileName}, page{" "}
                    {label.pageIndex + 1}.
                </p>
                </div>
                <div className="flex gap-1.5">
                    <button type="button" onClick={() => onMove(label.id, -1)} className="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs hover:bg-gray-50">
                        Move up
                    </button>
                    <button type="button" onClick={() => onMove(label.id, 1)} className="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs hover:bg-gray-50">
                        Move down
                    </button>
                    <button type="button" onClick={() => onRemove(label.id)} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50">
                        Remove label
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600">
                <span>Width <strong className="text-[#263238]">{(cropBox.right - cropBox.left).toFixed(1)} pt</strong></span>
                <span>Height <strong className="text-[#263238]">{(cropBox.top - cropBox.bottom).toFixed(1)} pt</strong></span>
                <span>Page <strong className="text-[#263238]">{width.toFixed(0)} × {height.toFixed(0)} pt</strong></span>
            </div>

            <div className="mt-4 rounded-lg bg-[#68C7D0]/15 p-3 text-xs leading-5 text-[#263238]">
                Keep customer and return addresses, COD, QR/barcodes, SKU, size, quantity, color, and order number inside the crop.
            </div>
        </section>
    );
}
