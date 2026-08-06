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

  beforeEach(() => {
    vi.clearAllMocks();

    dummyCanvas = document.createElement("canvas");
    dummyCanvas.width = 800;
    dummyCanvas.height = 600;

    // Mock HTMLCanvasElement.prototype.toDataURL if needed in jsdom
    dummyCanvas.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,fakeData");

    const mockContext = {
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    dummyCanvas.getContext = vi.fn().mockReturnValue(mockContext);
  });

  describe("getExportCanvasDataURL", () => {
    it("returns a data URL string after filling background", () => {
      const dataUrl = getExportCanvasDataURL(dummyCanvas, "#020617");

      expect(dataUrl).toBe("data:image/png;base64,fakeData");
    });
  });

  describe("exportCanvasToPNG", () => {
    it("creates a link element, triggers click, and removes the element", () => {
      const appendChildSpy = vi.spyOn(document.body, "appendChild");
      const removeChildSpy = vi.spyOn(document.body, "removeChild");
      const clickSpy = vi.fn();

      const createElementOriginal = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
        if (tagName === "a") {
          const anchor = createElementOriginal("a");
          anchor.click = clickSpy;
          return anchor;
        }
        return createElementOriginal(tagName);
      });

      exportCanvasToPNG(dummyCanvas, "test-whiteboard.png");

      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      vi.restoreAllMocks();
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
