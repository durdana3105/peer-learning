import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteResource } from "../deleteResource";
import { logError } from "@/utils/logger";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  select: vi.fn(),
  eqId: vi.fn(),
  eqOwner: vi.fn(),
  single: vi.fn(),
  del: vi.fn(),
  deleteEq: vi.fn(),
  remove: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("@/utils/logger", () => ({
  logError: mocks.logError,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: mocks.getUser,
    },
    from: mocks.from,
    storage: {
      from: mocks.storageFrom,
    },
  },
}));

// Builds the .select().eq().eq().single() chain used to fetch-and-verify
// ownership, and records exactly what column/value pairs .eq() was called
// with so tests can assert the uploaded_by filter is actually applied.
const buildSelectChain = (singleResult: { data: any; error: any }) => {
  mocks.select.mockReturnValue({ eq: mocks.eqId });
  mocks.eqId.mockReturnValue({ eq: mocks.eqOwner });
  mocks.eqOwner.mockReturnValue({ single: mocks.single });
  mocks.single.mockResolvedValue(singleResult);
  return { select: mocks.select };
};

const buildDeleteChain = (deleteResult: { error: any }) => {
  mocks.del.mockReturnValue({ eq: mocks.deleteEq });
  mocks.deleteEq.mockResolvedValue(deleteResult);
  return { delete: mocks.del };
};

describe("deleteResource", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-b" } },
    });
    mocks.storageFrom.mockReturnValue({ remove: mocks.remove });
    mocks.remove.mockResolvedValue({ error: null });
  });

  it("returns an error and touches neither storage nor delete when signed out", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const result = await deleteResource("resource-a");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to delete a resource.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  // This is the core regression test for #1674: User B (the authenticated
  // caller) tries to delete a resource owned by User A. The ownership-scoped
  // select (.eq("id", ...).eq("uploaded_by", user.id)) finds no matching row
  // -- exactly what happens once the RLS policy also enforces
  // uploaded_by = auth.uid() -- so the delete must be rejected without ever
  // calling storage.remove or the delete query.
  it("does not delete another user's resource", async () => {
    mocks.from.mockReturnValueOnce(
      buildSelectChain({ data: null, error: { message: "no rows" } })
    );

    const result = await deleteResource("resource-owned-by-user-a");

    expect(result).toEqual({
      success: false,
      error: "Resource not found or you do not have permission to delete it.",
    });

    // The ownership filter must be present on the query.
    expect(mocks.eqId).toHaveBeenCalledWith("id", "resource-owned-by-user-a");
    expect(mocks.eqOwner).toHaveBeenCalledWith("uploaded_by", "user-b");

    // Nothing should have been deleted, in storage or in the table.
    expect(mocks.storageFrom).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("deletes the resource when the caller is the owner", async () => {
    mocks.from
      .mockReturnValueOnce(
        buildSelectChain({
          data: { id: "resource-owned-by-user-b", file_url: "user-b/notes.pdf" },
          error: null,
        })
      )
      .mockReturnValueOnce(buildDeleteChain({ error: null }));

    const result = await deleteResource("resource-owned-by-user-b");

    expect(result).toEqual({ success: true });
    expect(mocks.storageFrom).toHaveBeenCalledWith("resources");
    expect(mocks.remove).toHaveBeenCalledWith(["user-b/notes.pdf"]);
    expect(mocks.deleteEq).toHaveBeenCalledWith("id", "resource-owned-by-user-b");
  });

  it("returns an error and does not attempt the DB delete when storage removal fails", async () => {
    mocks.from.mockReturnValueOnce(
      buildSelectChain({
        data: { id: "resource-owned-by-user-b", file_url: "user-b/notes.pdf" },
        error: null,
      })
    );
    mocks.remove.mockResolvedValue({ error: { message: "storage error" } });

    const result = await deleteResource("resource-owned-by-user-b");

    expect(result).toEqual({ success: false, error: "storage error" });
    expect(mocks.del).not.toHaveBeenCalled();
  });

  it("surfaces the database error when the delete query itself fails", async () => {
    mocks.from
      .mockReturnValueOnce(
        buildSelectChain({
          data: { id: "resource-owned-by-user-b", file_url: "user-b/notes.pdf" },
          error: null,
        })
      )
      .mockReturnValueOnce(buildDeleteChain({ error: { message: "delete failed" } }));

    const result = await deleteResource("resource-owned-by-user-b");

    expect(result).toEqual({ success: false, error: "delete failed" });
  });

  it("logs and returns a generic error if an unexpected exception is thrown", async () => {
    mocks.from.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const result = await deleteResource("resource-x");

    expect(result).toEqual({ success: false, error: "boom" });
    expect(logError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ context: "deleteResource", resourceId: "resource-x" })
    );
  });
});