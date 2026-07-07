import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { escapeICalText, generateICS } from "./calendar";

describe("calendar exports", () => {
  let createdBlob: Blob | undefined;

  beforeEach(() => {
    createdBlob = undefined;
    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      createdBlob = blob as Blob;
      return "blob:calendar";
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const generateCalendarText = async (title: string, description: string) => {
    generateICS(title, description, new Date("2026-07-05T10:00:00Z"), 60);

    expect(createdBlob).toBeDefined();
    return createdBlob!.text();
  };

  it("escapes title newlines without creating a new ICS property", async () => {
    const text = await generateCalendarText(
      "React Review\nLOCATION:Injected Room",
      "Session details"
    );

    expect(text).toContain("SUMMARY:React Review\\nLOCATION:Injected Room");
    expect(text).not.toContain("\r\nLOCATION:Injected Room");
  });

  it("escapes commas, semicolons, and backslashes in descriptions", () => {
    expect(escapeICalText("Discuss hooks, state; and effects \\ notes")).toBe(
      "Discuss hooks\\, state\\; and effects \\\\ notes"
    );
  });

  it("keeps normal title and description values unchanged", async () => {
    const text = await generateCalendarText("React Review", "Discuss hooks");

    expect(text).toContain("SUMMARY:React Review");
    expect(text).toContain("DESCRIPTION:Discuss hooks");
  });
});
