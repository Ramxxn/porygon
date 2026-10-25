
import { useRef } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import type { SourcePdf } from "../types/pdf";

type PdfUploaderProps = {
  files: SourcePdf[];
  activeId: string;
  loading: boolean;
  onFilesSelected: (files: FileList | File[]) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
};

export default function PdfUploader({
  files,
  activeId,
  loading,
  onFilesSelected,
  onSelect,
  onRemove,
}: PdfUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Source PDFs</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
          {files.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onFilesSelected(event.dataTransfer.files);
        }}
        className="flex w-full flex-col items-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-7 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
      >
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-blue-600">
          <UploadCloud size={22} />
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {loading ? "Opening PDF..." : "Drop PDF files here"}
        </span>
        <span className="mt-1 text-xs text-gray-500">
          or <span className="font-medium text-blue-600">browse files</span>
        </span>
        <span className="mt-3 text-[11px] text-gray-400">
          PDF format · Multiple files supported
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) {
            onFilesSelected(event.target.files);
          }
          event.target.value = "";
        }}
      />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 rounded-lg border p-2 ${
                activeId === item.id
                  ? "border-blue-200 bg-blue-50/60"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-gray-200">
                  <FileText size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">
                    {item.file.name}
                  </span>
                  <span className="mt-1 block text-[11px] text-gray-500">
                    {item.pdf.numPages} pages ·{" "}
                    {(item.file.size / 1048576).toFixed(2)} MB
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.file.name}`}
                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
