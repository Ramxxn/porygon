
import { ShieldCheck, Download } from "lucide-react";

type HeaderProps = {
  canExport?: boolean;
  onExport: () => void;
};

export default function Header({
  canExport = false,
  onExport,
}: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img className="h-11 w-11 rounded-xl object-cover" src="/porygon.png" alt="" />
          <div>
            <h1 className="text-base font-bold tracking-tight">Porygon</h1>
            <p className="text-xs text-gray-500">Shipping label studio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-gray-500 sm:flex">
            <ShieldCheck size={16} className="text-emerald-600" />
            Files stay on your device
          </div>
          <button
            type="button"
            onClick={onExport}
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E85D79] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d74b68] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>
    </header>
  );
}
