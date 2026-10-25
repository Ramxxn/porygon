
import { PDFDocument } from "pdf-lib";
import type { PDFEmbeddedPage } from "pdf-lib";
import type { ShippingLabel } from "../types/label";

export type EmbeddedLabel = {
  label: ShippingLabel;
  page: PDFEmbeddedPage;
};

export async function embedCroppedLabels(
  output: PDFDocument,
  labels: ShippingLabel[],
  sourceFiles: Map<string, File>,
): Promise<EmbeddedLabel[]> {
  const embedded: EmbeddedLabel[] = [];
  const documents = new Map<string, PDFDocument>();

  for (const label of labels) {
    let sourceDocument = documents.get(label.sourceFileId);

    if (!sourceDocument) {
      const file = sourceFiles.get(label.sourceFileId);

      if (!file) {
        throw new Error(`Source PDF not found: ${label.sourceFileName}`);
      }

      sourceDocument = await PDFDocument.load(await file.arrayBuffer());
      documents.set(label.sourceFileId, sourceDocument);
    }

    const sourcePage = sourceDocument.getPage(label.pageIndex);
    const [page] = await output.embedPages(
      [sourcePage],
      [label.cropBox],
    );

    if (!page) {
      throw new Error(`Could not crop ${label.sourceFileName}.`);
    }

    embedded.push({ label, page });
  }

  return embedded;
}
