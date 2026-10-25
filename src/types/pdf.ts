
import type { PDFDocumentProxy } from "pdfjs-dist";

export type CropMode = "auto" | "grid" | "manual";

export type SourcePdf = {
  id: string;
  file: File;
  pdf: PDFDocumentProxy;
};
