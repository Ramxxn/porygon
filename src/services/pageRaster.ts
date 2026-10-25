import type { SourcePdf } from "../types/pdf";

const pageRasterCache = new Map<string, Promise<HTMLCanvasElement>>();

export function getPageRaster(source: SourcePdf, pageIndex: number) {
  const key = `${source.id}:${pageIndex}`;
  const cached = pageRasterCache.get(key);
  if (cached) {
    pageRasterCache.delete(key);
    pageRasterCache.set(key, cached);
    return cached;
  }

  const raster = (async () => {
    const page = await source.pdf.getPage(pageIndex + 1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1.4, 1200 / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    return canvas;
  })();

  pageRasterCache.set(key, raster);
  while (pageRasterCache.size > 8) {
    const oldest = pageRasterCache.keys().next().value;
    if (!oldest) break;
    pageRasterCache.delete(oldest);
  }
  void raster.catch(() => pageRasterCache.delete(key));
  return raster;
}
