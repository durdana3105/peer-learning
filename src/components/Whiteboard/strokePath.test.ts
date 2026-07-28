import { describe, it, expect } from "vitest";
import { nextSegment } from "./strokePath";
import { Point, WhiteboardEvent } from "./types";

const ev = (
  type: WhiteboardEvent["type"],
  strokeId?: string,
  point?: Point,
): WhiteboardEvent => ({
  type,
  payload: { strokeId, point },
});

describe("nextSegment concurrent stroke isolation", () => {
  it("connects each move to its own stroke, not to an interleaved stroke", () => {
    const last = new Map<string, Point>();

    // Stroke A starts and moves.
    expect(
      nextSegment(ev("draw-start", "A", { x: 10, y: 10 }), last),
    ).toBeNull();
    expect(nextSegment(ev("draw-move", "A", { x: 20, y: 20 }), last)).toEqual({
      from: { x: 10, y: 10 },
      to: { x: 20, y: 20 },
    });

    // Stroke B starts in the middle (the interleaving that corrupted the shared path).
    expect(
      nextSegment(ev("draw-start", "B", { x: 200, y: 200 }), last),
    ).toBeNull();

    // Stroke A's next move must connect from A's own last point (20,20), not B's start.
    expect(nextSegment(ev("draw-move", "A", { x: 30, y: 30 }), last)).toEqual({
      from: { x: 20, y: 20 },
      to: { x: 30, y: 30 },
    });

    // Stroke B's move connects from B's own start.
    expect(nextSegment(ev("draw-move", "B", { x: 210, y: 210 }), last)).toEqual(
      {
        from: { x: 200, y: 200 },
        to: { x: 210, y: 210 },
      },
    );
  });

  it("a move with no prior start draws a zero-length segment (a dot)", () => {
    const last = new Map<string, Point>();
    expect(nextSegment(ev("draw-move", "C", { x: 5, y: 5 }), last)).toEqual({
      from: { x: 5, y: 5 },
      to: { x: 5, y: 5 },
    });
  });

  it("draw-end clears the stroke so a later reuse does not connect to stale points", () => {
    const last = new Map<string, Point>();
    nextSegment(ev("draw-start", "A", { x: 1, y: 1 }), last);
    nextSegment(ev("draw-move", "A", { x: 2, y: 2 }), last);
    expect(nextSegment(ev("draw-end", "A"), last)).toBeNull();
    expect(last.has("A")).toBe(false);
  });
});
