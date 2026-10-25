
import { Crop, ShieldCheck, Download } from "lucide-react";

type HeaderProps = {
  canExport?: boolean;
};

export default function Header({ canExport = false }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
            <img className="flex h-14 items-center justify-center rounded-xl" src="/porygon.png" alt="" />
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
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>
    </header>
  );
}
