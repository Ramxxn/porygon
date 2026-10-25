
import { PDFDocument } from "pdf-lib";
import type { EmbeddedLabel } from "./pdfCropper";
import type { LabelLayout } from "../types/label";
import { embedCroppedLabels } from "./pdfCropper";
import type { ShippingLabel } from "../types/label";

export type ExportOptions = {
  labels: ShippingLabel[];
  sourceFiles: Map<string, File>;
  layout: LabelLayout;
  oneLabelPerPage?: boolean;
};

export async function exportLabelsToPdf({
  labels,
  sourceFiles,
  layout,
  oneLabelPerPage = false,
}: ExportOptions): Promise<Uint8Array> {
  if (!labels.length) {
    throw new Error("There are no labels to export.");
  }

  const output = await PDFDocument.create();
  const embeddedLabels: EmbeddedLabel[] = await embedCroppedLabels(
    output,
    labels,
    sourceFiles,
  );

  if (oneLabelPerPage) {
    for (const item of embeddedLabels) {
      const page = output.addPage([item.page.width, item.page.height]);
      page.drawPage(item.page, {
        x: 0,
        y: 0,
        width: item.page.width,
        height: item.page.height,
      });
    }
  } else {
    const {
      columns,
      rows,
      pageWidth,
      pageHeight,
      margin,
      gap,
    } = layout;

    const safeColumns = Math.max(1, Math.floor(columns));
    const safeRows = Math.max(1, Math.floor(rows));
    const usableWidth =
      pageWidth - margin * 2 - gap * (safeColumns - 1);
    const usableHeight =
      pageHeight - margin * 2 - gap * (safeRows - 1);

    const cellWidth = usableWidth / safeColumns;
    const cellHeight = usableHeight / safeRows;
    const labelsPerSheet = safeColumns * safeRows;

    if (cellWidth <= 0 || cellHeight <= 0) {
      throw new Error("Margins and spacing are too large for this sheet.");
    }

    for (
      let start = 0;
      start < embeddedLabels.length;
      start += labelsPerSheet
    ) {
      const sheet = output.addPage([pageWidth, pageHeight]);
      const batch = embeddedLabels.slice(start, start + labelsPerSheet);

      batch.forEach((item, index) => {
        const row = Math.floor(index / safeColumns);
        const column = index % safeColumns;

        const scale = Math.min(
          cellWidth / item.page.width,
          cellHeight / item.page.height,
        );

        const width = item.page.width * scale;
        const height = item.page.height * scale;
        const x = margin + column * (cellWidth + gap) + (cellWidth - width) / 2;

        // PDF coordinates start from the bottom-left.
        const y =
          pageHeight -
          margin -
          (row + 1) * cellHeight -
          row * gap +
          (cellHeight - height) / 2;

        sheet.drawPage(item.page, { x, y, width, height });
      });
    }
  }

  return output.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], {
    type: "application/pdf",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
