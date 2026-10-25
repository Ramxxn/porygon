
import { ScanLine, Settings2 } from "lucide-react";
import type { CropMode } from "../types/label";

type CropSettingsProps = {
  mode: CropMode;
  rows: number;
  columns: number;
  onModeChange: (mode: CropMode) => void;
  onRowsChange: (rows: number) => void;
  onColumnsChange: (columns: number) => void;
};

const modes: {
  id: CropMode;
  title: string;
  description: string;
}[] = [
  {
    id: "auto",
    title: "Auto-detect",
    description: "Keep complete pages for safe crop review",
  },
  {
    id: "grid",
    title: "Grid crop",
    description: "For evenly arranged labels",
  },
  {
    id: "manual",
    title: "Manual crop",
    description: "Start with a full page and draw the crop",
  },
];

export default function CropSettings({
  mode,
  rows,
  columns,
  onModeChange,
  onRowsChange,
  onColumnsChange,
}: CropSettingsProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <ScanLine size={17} />
        </span>
        <h2 className="text-sm font-semibold">Crop settings</h2>
      </div>

      <p className="mb-4 text-xs leading-5 text-gray-500">
        Choose how Porygon should locate labels on each page.
      </p>

      <div className="space-y-2">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onModeChange(item.id)}
            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
              mode === item.id
                ? "border-blue-300 bg-blue-50/60"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                mode === item.id
                  ? "border-[5px] border-blue-600 bg-white"
                  : "border-gray-300"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold">{item.title}</span>
              <span className="mt-1 block text-[11px] leading-4 text-gray-500">
                {item.description}
              </span>
            </span>
            {item.id === "auto" && (
              <span className="rounded bg-blue-100 px-1.5 py-1 text-[9px] font-semibold text-blue-700">
                Suggested
              </span>
            )}
          </button>
        ))}
      </div>

      {mode === "grid" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-600">
            Rows
            <input
              type="number"
              min={1}
              max={10}
              value={rows}
              onChange={(event) =>
                onRowsChange(
                  Math.max(1, Math.min(10, Number(event.target.value) || 1)),
                )
              }
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-xs text-gray-600">
            Columns
            <input
              type="number"
              min={1}
              max={10}
              value={columns}
              onChange={(event) =>
                onColumnsChange(
                  Math.max(1, Math.min(10, Number(event.target.value) || 1)),
                )
              }
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4 text-[11px] leading-5 text-gray-500">
        <Settings2 size={15} className="mt-0.5 shrink-0" />
        <p>
          Auto mode preserves the full page for safe review. Drag the crop on the
          preview to refine the label before export.
        </p>
      </div>
    </section>
  );
}
