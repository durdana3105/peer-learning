import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getExportCanvasDataURL,
  exportCanvasToPNG,
  exportCanvasToPDF,
} from "./exportUtils";

// Mock jsPDF
const mockAddImage = vi.fn();
const mockSave = vi.fn();

vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(function (this: any) {
      this.addImage = mockAddImage;
      this.save = mockSave;
    }),
  };
});

describe("exportUtils", () => {
  let dummyCanvas: HTMLCanvasElement;
  let mockContext: { fillStyle: string; fillRect: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn> };
  let mockOffscreenCanvas: HTMLCanvasElement;
  const realCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    vi.clearAllMocks();

    dummyCanvas = realCreateElement("canvas");
    dummyCanvas.width = 800;
    dummyCanvas.height = 600;

    mockContext = {
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    };

    mockOffscreenCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,fakeData"),
    } as unknown as HTMLCanvasElement;

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return mockOffscreenCanvas;
      }
      return realCreateElement(tagName);
    });
  });

  describe("getExportCanvasDataURL", () => {
    it("returns a data URL string after filling background", () => {
      const dataUrl = getExportCanvasDataURL(dummyCanvas, "#020617");

      expect(mockContext.fillStyle).toBe("#020617");
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockContext.drawImage).toHaveBeenCalledWith(dummyCanvas, 0, 0);
      expect(mockOffscreenCanvas.toDataURL).toHaveBeenCalledWith("image/png");
      expect(dataUrl).toBe("data:image/png;base64,fakeData");
    });

    it("throws an error when canvas has zero width or zero height", () => {
      dummyCanvas.width = 0;
      dummyCanvas.height = 600;
      expect(() => getExportCanvasDataURL(dummyCanvas)).toThrow(
        "Canvas dimensions must be greater than zero."
      );

      dummyCanvas.width = 800;
      dummyCanvas.height = 0;
      expect(() => getExportCanvasDataURL(dummyCanvas)).toThrow(
        "Canvas dimensions must be greater than zero."
      );
    });
  });

  describe("exportCanvasToPNG", () => {
    it("creates a link element, triggers click, and removes the element", () => {
      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");
      const clickSpy = vi.fn();

      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "a") {
          const anchor = realCreateElement("a");
          anchor.click = clickSpy;
          return anchor;
        }
        if (tagName === "canvas") {
          return mockOffscreenCanvas;
        }
        return realCreateElement(tagName);
      });

      exportCanvasToPNG(dummyCanvas, "test-whiteboard.png");

      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  describe("exportCanvasToPDF", () => {
    it("generates a PDF and calls save with the specified filename", () => {
      exportCanvasToPDF(dummyCanvas, "test-whiteboard.pdf");

      expect(mockAddImage).toHaveBeenCalledWith(
        "data:image/png;base64,fakeData",
        "PNG",
        0,
        0,
        800,
        600
      );
      expect(mockSave).toHaveBeenCalledWith("test-whiteboard.pdf");
    });

    it("throws an error if canvas dimensions are zero", () => {
      dummyCanvas.width = 0;
      dummyCanvas.height = 0;

      expect(() => exportCanvasToPDF(dummyCanvas, "invalid.pdf")).toThrow(
        "Canvas dimensions must be greater than zero."
      );
    });
  });
});
