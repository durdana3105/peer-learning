import { Point } from "./types";

// Convert a canvas-pixel point to a resolution-independent fraction (0..1),
// so strokes land in the same relative position on canvases of any size.
export const normalizePoint = (
  x: number,
  y: number,
  width: number,
  height: number
): Point => ({
  x: width > 0 ? x / width : 0,
  y: height > 0 ? y / height : 0,
});

// Convert a normalized fraction back to pixels for the current canvas size.
export const denormalizePoint = (
  point: Point,
  width: number,
  height: number
): Point => ({
  x: point.x * width,
  y: point.y * height,
});
