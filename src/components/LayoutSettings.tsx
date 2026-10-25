
import type { LabelLayout } from "../types/label";

type LayoutSettingsProps = {
  layout: LabelLayout;
  onChange: (layout: LabelLayout) => void;
};

export default function LayoutSettings({
  layout,
  onChange,
}: LayoutSettingsProps) {
  function update<K extends keyof LabelLayout>(
    key: K,
    value: LabelLayout[K],
  ) {
    onChange({ ...layout, [key]: value });
  }

  function NumberField({
    label,
    value,
    min,
    max,
    onValue,
    suffix,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    onValue: (value: number) => void;
    suffix?: string;
  }) {
    return (
      <label className="block">
        <span className="mb-1.5 block text-xs text-gray-600">{label}</span>
        <span className="flex items-center rounded-lg border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next) && next >= min && next <= max) {
                onValue(next);
              }
            }}
            className="w-full min-w-0 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
          />
          {suffix && (
            <span className="pr-3 text-[11px] text-gray-400">{suffix}</span>
          )}
        </span>
      </label>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold">Sheet layout</h2>
      <p className="mt-1 text-xs leading-5 text-gray-500">
        Choose the page size and how many labels fit on each sheet.
        Measurements are in PDF points (72 points = 1 inch).
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <NumberField
          label="Columns"
          value={layout.columns}
          min={1}
          max={10}
          onValue={(value) => update("columns", value)}
        />
        <NumberField
          label="Rows"
          value={layout.rows}
          min={1}
          max={10}
          onValue={(value) => update("rows", value)}
        />
        <NumberField
          label="Page width"
          value={layout.pageWidth}
          min={100}
          max={3000}
          suffix="pt"
          onValue={(value) => update("pageWidth", value)}
        />
        <NumberField
          label="Page height"
          value={layout.pageHeight}
          min={100}
          max={3000}
          suffix="pt"
          onValue={(value) => update("pageHeight", value)}
        />
        <NumberField
          label="Margin"
          value={layout.margin}
          min={0}
          max={500}
          suffix="pt"
          onValue={(value) => update("margin", value)}
        />
        <NumberField
          label="Gap"
          value={layout.gap}
          min={0}
          max={200}
          suffix="pt"
          onValue={(value) => update("gap", value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onChange({
              ...layout,
              pageWidth: 595.28,
              pageHeight: 841.89,
            })
          }
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs hover:bg-gray-50"
        >
          A4 portrait
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...layout,
              pageWidth: 841.89,
              pageHeight: 595.28,
            })
          }
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs hover:bg-gray-50"
        >
          A4 landscape
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...layout,
              pageWidth: 612,
              pageHeight: 792,
            })
          }
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs hover:bg-gray-50"
        >
          Letter
        </button>
      </div>
    </section>
  );
}
