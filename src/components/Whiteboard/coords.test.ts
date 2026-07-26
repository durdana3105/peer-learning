import { describe, it, expect } from "vitest";
import { normalizePoint, denormalizePoint } from "./coords";

describe("whiteboard coordinate normalization", () => {
  it("round-trips to the same pixel on the same canvas size", () => {
    const n = normalizePoint(800, 250, 900, 500);
    const p = denormalizePoint(n, 900, 500);
    expect(p.x).toBeCloseTo(800);
    expect(p.y).toBeCloseTo(250);
  });

  it("keeps the same relative position across different canvas sizes", () => {
    // Captured near the right edge of a 900x500 canvas (90% across, 50% down).
    const n = normalizePoint(810, 250, 900, 500);
    expect(n.x).toBeCloseTo(0.9);
    expect(n.y).toBeCloseTo(0.5);

    // Rendered on a smaller 500x300 canvas: still 90% across, 50% down.
    const p = denormalizePoint(n, 500, 300);
    expect(p.x).toBeCloseTo(450);
    expect(p.y).toBeCloseTo(150);
  });

  it("guards against a zero-sized canvas", () => {
    expect(normalizePoint(100, 100, 0, 0)).toEqual({ x: 0, y: 0 });
  });
});
