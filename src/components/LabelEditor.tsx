
import type { ShippingLabel } from "../types/label";

type LabelEditorProps = {
    label?: ShippingLabel;
    onChange: (updated: ShippingLabel) => void;
};

export default function LabelEditor({
    label,
    onChange,
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

    const topPercent = (cropBox.top / height) * 100;
    const bottomPercent = (cropBox.bottom / height) * 100;
    const leftPercent = (cropBox.left / width) * 100;
    const rightPercent = (cropBox.right / width) * 100;

    function updateBox(
        key: "left" | "bottom" | "right" | "top",
        value: number,
    ) {
        const next = {
            ...label.cropBox,
            [key]: value,
        };

        if (
            next.left < 0 ||
            next.bottom < 0 ||
            next.right > width ||
            next.top > height ||
            next.left >= next.right ||
            next.bottom >= next.top
        ) {
            return;
        }

        onChange({
            ...label,
            cropBox: next,
            detectionMethod: "manual",
            confidence: 1,
        });
    }

    function BoundaryControl({
        title,
        value,
        min,
        max,
        onValue,
    }: {
        title: string;
        value: number;
        min: number;
        max: number;
        onValue: (value: number) => void;
    }) {
        return (
            <label className="block">
                <span className="mb-2 flex justify-between text-xs text-gray-600">
                    <span>{title}</span>
                    <span className="font-medium tabular-nums">
                        {value.toFixed(1)}%
                    </span>
                </span>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={0.5}
                    value={value}
                    onChange={(event) => onValue(Number(event.target.value))}
                    className="w-full accent-blue-600"
                />
            </label>
        );
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <h2 className="text-sm font-semibold">Crop editor</h2>
                <p className="mt-1 text-xs text-gray-500">
                    Adjust the crop region for {label.sourceFileName}, page{" "}
                    {label.pageIndex + 1}.
                </p>
            </div>

            <div className="space-y-5">
                <BoundaryControl
                    title="Top boundary"
                    value={topPercent}
                    min={Math.max(bottomPercent + 1, 1)}
                    max={100}
                    onValue={(value) => updateBox("top", (value / 100) * height)}
                />

                <BoundaryControl
                    title="Bottom boundary"
                    value={bottomPercent}
                    min={0}
                    max={Math.min(topPercent - 1, 99)}
                    onValue={(value) => updateBox("bottom", (value / 100) * height)}
                />

                <BoundaryControl
                    title="Left boundary"
                    value={leftPercent}
                    min={0}
                    max={Math.min(rightPercent - 1, 99)}
                    onValue={(value) => updateBox("left", (value / 100) * width)}
                />

                <BoundaryControl
                    title="Right boundary"
                    value={rightPercent}
                    min={Math.max(leftPercent + 1, 1)}
                    max={100}
                    onValue={(value) => updateBox("right", (value / 100) * width)}
                />
            </div>

            <div className="mt-5 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                Tip: move the bottom boundary above the invoice or product-details
                section. Keep the complete shipping address and all barcodes inside
                the crop.
            </div>
        </section>
    );
}
