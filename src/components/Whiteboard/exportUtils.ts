import { jsPDF } from "jspdf";

/**
 * Renders the source canvas onto an offscreen canvas pre-filled with a solid background color
 * (defaulting to dark slate `#020617`) and returns its PNG Data URL.
 */
export const getExportCanvasDataURL = (
  canvas: HTMLCanvasElement,
  backgroundColor: string = "#020617"
): string => {
  const offscreen = document.createElement("canvas");
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;

  const ctx = offscreen.getContext("2d");
  if (!ctx) {
    return canvas.toDataURL("image/png");
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, offscreen.width, offscreen.height);
  ctx.drawImage(canvas, 0, 0);

  return offscreen.toDataURL("image/png");
};

/**
 * Triggers a browser file download of the whiteboard canvas as a PNG image.
 */
export const exportCanvasToPNG = (
  canvas: HTMLCanvasElement,
  filename: string = "whiteboard.png"
): void => {
  const dataUrl = getExportCanvasDataURL(canvas);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates and triggers a browser download of a PDF document containing the whiteboard canvas image.
 */
export const exportCanvasToPDF = (
  canvas: HTMLCanvasElement,
  filename: string = "whiteboard.pdf"
): void => {
  const width = canvas.width;
  const height = canvas.height;

  if (width === 0 || height === 0) {
    throw new Error("Canvas dimensions must be greater than zero.");
  }

  const dataUrl = getExportCanvasDataURL(canvas);
  const orientation = width >= height ? "l" : "p";

  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [width, height],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  pdf.save(filename);
};
