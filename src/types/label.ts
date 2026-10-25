
export type CropMode = "auto" | "grid" | "manual";

export type CropBox = {
  left: number;
  bottom: number;
  right: number;
  top: number;
};

export type ShippingLabel = {
  id: string;
  sourceFileId: string;
  sourceFileName: string;
  pageIndex: number;
  cropBox: CropBox;
  sourcePageWidth: number;
  sourcePageHeight: number;
  confidence: number;
  detectionMethod: "text" | "grid" | "manual";
};

export type LabelLayout = {
  columns: number;
  rows: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  gap: number;
};

export type DetectionSettings = {
  mode: CropMode;
  rows: number;
  columns: number;
  shippingLabelHeightRatio: number;
};
