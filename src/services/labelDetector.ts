
import type { PDFDocumentProxy } from "pdfjs-dist";
import type {
  CropBox,
  DetectionSettings,
  ShippingLabel,
} from "../types/label";

type PdfPage = {
  getViewport: (options: { scale: number }) => {
    width: number;
    height: number;
  };
  getTextContent: () => Promise<{
    items: Array<{
      str?: string;
      transform?: number[];
      width?: number;
      height?: number;
    }>;
  }>;
};

function makeId() {
  return crypto.randomUUID();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * PDF.js text transforms are converted to top-origin coordinates here.
 * We use marker positions as suggestions, not unquestionable crop boundaries.
 */
async function getPageMarkers(page: PdfPage, pageHeight: number) {
  const content = await page.getTextContent();

  return content.items.flatMap((item) => {
    const text = item.str?.trim();
    const transform = item.transform;

    if (!text || !transform || transform.length < 6) return [];

    const yFromBottom = transform[5];
    const yFromTop = pageHeight - yFromBottom;

    return [{
      text,
      x: transform[4],
      y: clamp(yFromTop, 0, pageHeight),
    }];
  });
}

function makeLabel(
  sourceFileId: string,
  sourceFileName: string,
  pageIndex: number,
  pageWidth: number,
  pageHeight: number,
  cropBox: CropBox,
  confidence: number,
  detectionMethod: ShippingLabel["detectionMethod"],
): ShippingLabel {
  return {
    id: makeId(),
    sourceFileId,
    sourceFileName,
    pageIndex,
    cropBox,
    sourcePageWidth: pageWidth,
    sourcePageHeight: pageHeight,
    confidence,
    detectionMethod,
  };
}

/**
 * Equal-cell grid proposal. Each cell is trimmed from the bottom so the
 * invoice/product-details area is excluded. Users can change the trim in
 * the editor before exporting.
 */
function detectGrid(
  sourceFileId: string,
  sourceFileName: string,
  pageIndex: number,
  pageWidth: number,
  pageHeight: number,
  settings: DetectionSettings,
) {
  const rows = clamp(Math.round(settings.rows), 1, 10);
  const columns = clamp(Math.round(settings.columns), 1, 10);
  const cellWidth = pageWidth / columns;
  const cellHeight = pageHeight / rows;
  const keepRatio = clamp(settings.shippingLabelHeightRatio, 0.35, 1);
  const labels: ShippingLabel[] = [];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const left = column * cellWidth;
      const right = (column + 1) * cellWidth;

      // PDF coordinates start at the bottom; grid rows are counted from top.
      const cellTop = pageHeight - row * cellHeight;
      const cellBottom = pageHeight - (row + 1) * cellHeight;
      const cropBottom = cellTop - cellHeight * keepRatio;

      labels.push(
        makeLabel(
          sourceFileId,
          sourceFileName,
          pageIndex,
          pageWidth,
          pageHeight,
          {
            left,
            bottom: Math.max(cellBottom, cropBottom),
            right,
            top: cellTop,
          },
          0.5,
          "grid",
        ),
      );
    }
  }

  return labels;
}

export async function detectLabelsForPage(options: {
  pdf: PDFDocumentProxy;
  sourceFileId: string;
  sourceFileName: string;
  pageIndex: number;
  settings: DetectionSettings;
}): Promise<ShippingLabel[]> {
  const { pdf, sourceFileId, sourceFileName, pageIndex, settings } =
    options;

  const page = await pdf.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const pageWidth = viewport.width;
  const pageHeight = viewport.height;

  if (settings.mode === "grid") {
    return detectGrid(
      sourceFileId,
      sourceFileName,
      pageIndex,
      pageWidth,
      pageHeight,
      settings,
    );
  }

  const markers = await getPageMarkers(
    page as unknown as PdfPage,
    pageHeight,
  );
  const hasShippingText = markers.some((marker) =>
    /\b(ship(?:ping)?\s*(?:to|from|label)?|customer address|delivery address|return address|awb|waybill|order number|cod|barcode|sku)\b/i.test(
      marker.text,
    ),
  );

  // Text extraction cannot reliably distinguish a label from its invoice.
  // Keep the whole page until a person confirms the crop rather than risk
  // clipping addresses, payment details, identifiers, or machine-readable codes.
  return [
    makeLabel(
      sourceFileId,
      sourceFileName,
      pageIndex,
      pageWidth,
      pageHeight,
      { left: 0, bottom: 0, right: pageWidth, top: pageHeight },
      hasShippingText ? 0.45 : 0.2,
      hasShippingText ? "text" : "manual",
    ),
  ];
}
