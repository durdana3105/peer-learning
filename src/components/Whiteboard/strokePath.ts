import { Point, WhiteboardEvent } from "./types";

export type StrokeSegment = { from: Point; to: Point };

// Compute the line segment to draw for a whiteboard event, tracking the last
// point per strokeId so interleaved events from concurrent authors never
// connect across different strokes.
export const nextSegment = (
  event: WhiteboardEvent,
  lastPoints: Map<string, Point>,
): StrokeSegment | null => {
  const strokeId = event.payload.strokeId;

  if (event.type === "draw-end") {
    if (strokeId) lastPoints.delete(strokeId);
    return null;
  }

  const point = event.payload.point;
  if (!point) return null;

  if (event.type === "draw-start") {
    if (strokeId) lastPoints.set(strokeId, point);
    return null;
  }

  // draw-move
  const prev = strokeId ? lastPoints.get(strokeId) : undefined;
  if (strokeId) lastPoints.set(strokeId, point);
  return { from: prev ?? point, to: point };
};
