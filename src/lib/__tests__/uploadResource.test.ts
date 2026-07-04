import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadResource } from "../uploadResource";
import { logError } from "@/utils/logger";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getSession: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  insert: vi.fn(),
  single: vi.fn(),
  remove: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/config/api", () => ({
  API_BASE_URL: "http://localhost:3000",
}));

vi.mock("@/utils/logger", () => ({
  logError: mocks.logError,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: mocks.getUser,
      getSession: mocks.getSession,
    },
    from: mocks.from,
    storage: {
      from: mocks.storageFrom,
    },
  },
}));

describe("uploadResource", () => {
  const file = new File(["content"], "notes.pdf", { type: "application/pdf" });

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "token-123" } },
    });
    mocks.from.mockReturnValue({
      insert: mocks.insert,
    });
    mocks.insert.mockReturnValue({
      select: () => ({
        single: mocks.single,
      }),
    });
    mocks.storageFrom.mockReturnValue({
      remove: mocks.remove,
    });
    mocks.remove.mockResolvedValue({ error: null });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { path: "user-123/backend-path.pdf" },
      }),
    } as unknown as Response);
  });

  it("calls the backend cleanup endpoint when metadata insert fails", async () => {
    mocks.single.mockResolvedValue({
      data: null,
      error: { message: "metadata insert failed" },
    });

    const result = await uploadResource(file, "Notes", "Helpful notes", [
      "typescript",
    ]);

    expect(result).toEqual({
      success: false,
      error: "metadata insert failed",
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        file_url: "user-123/backend-path.pdf",
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/upload",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({
          folder: "resources",
          filePath: "user-123/backend-path.pdf",
        }),
      })
    );
  });

  it("logs cleanup failure without replacing the metadata insert error", async () => {
    mocks.single.mockResolvedValue({
      data: null,
      error: { message: "metadata insert failed" },
    });
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { path: "user-123/backend-path.pdf" },
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as unknown as Response);

    const result = await uploadResource(file, "Notes", "Helpful notes", []);

    expect(result).toEqual({
      success: false,
      error: "metadata insert failed",
    });
    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Cleanup failed with status 500",
      }),
      expect.objectContaining({
        context: "uploadResource.cleanup",
        filePath: "user-123/backend-path.pdf",
      })
    );
  });

  it("does not remove storage when upload fails before a path is returned", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("upload failed"),
    } as unknown as Response);

    const result = await uploadResource(file, "Notes", "Helpful notes", []);

    expect(result).toEqual({
      success: false,
      error: "Server error: 500 - upload failed",
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
