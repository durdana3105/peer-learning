import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpError } from "../utils/httpError.js";

const mockGetBucket = vi.fn();
const mockCreateBucket = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockFrom = vi.fn(() => ({ createSignedUrl: mockCreateSignedUrl }));

vi.mock("../utils/supabase.js", () => ({
  getSupabaseAdmin: () => ({
    storage: {
      getBucket: mockGetBucket,
      createBucket: mockCreateBucket,
      from: mockFrom,
    },
  }),
}));

const { ensurePrivateBucket, getSignedFileUrl } =
  await import("../utils/privateStorage.js");

describe("ensurePrivateBucket (#1529)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new bucket with public:false when it does not exist", async () => {
    mockGetBucket.mockResolvedValue({
      data: null,
      error: { message: "Bucket not found" },
    });
    mockCreateBucket.mockResolvedValue({
      data: { name: "session-replays" },
      error: null,
    });

    await ensurePrivateBucket("session-replays");

    expect(mockCreateBucket).toHaveBeenCalledWith("session-replays", {
      public: false,
    });
  });

  it("is a no-op when the bucket already exists and is private", async () => {
    mockGetBucket.mockResolvedValue({
      data: { name: "session-replays", public: false },
      error: null,
    });

    const result = await ensurePrivateBucket("session-replays");

    expect(mockCreateBucket).not.toHaveBeenCalled();
    expect(result).toMatchObject({ public: false });
  });

  it("warns but does not throw when an existing bucket is unexpectedly public", async () => {
    mockGetBucket.mockResolvedValue({
      data: { name: "legacy-bucket", public: true },
      error: null,
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(ensurePrivateBucket("legacy-bucket")).resolves.toBeDefined();
    expect(mockCreateBucket).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("PUBLIC"));

    warnSpy.mockRestore();
  });

  it("throws an HttpError if bucket creation fails", async () => {
    mockGetBucket.mockResolvedValue({
      data: null,
      error: { message: "Bucket not found" },
    });
    mockCreateBucket.mockResolvedValue({
      data: null,
      error: { message: "storage quota exceeded" },
    });

    await expect(ensurePrivateBucket("session-replays")).rejects.toThrow(
      HttpError,
    );
  });

  it("rejects a missing bucket name", async () => {
    await expect(ensurePrivateBucket()).rejects.toThrow(HttpError);
  });
});

describe("getSignedFileUrl (#1529)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a signed URL scoped to the requested bucket and path", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: {
        signedUrl:
          "https://project.supabase.co/storage/v1/object/sign/session-replays/abc?token=xyz",
      },
      error: null,
    });

    const url = await getSignedFileUrl("session-replays", "abc.webm", 1800);

    expect(mockFrom).toHaveBeenCalledWith("session-replays");
    expect(mockCreateSignedUrl).toHaveBeenCalledWith("abc.webm", 1800);
    expect(url).toContain("token=xyz");
  });

  it("defaults to a 1 hour expiry when none is given", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed" },
      error: null,
    });

    await getSignedFileUrl("session-replays", "abc.webm");

    expect(mockCreateSignedUrl).toHaveBeenCalledWith("abc.webm", 3600);
  });

  it("throws an HttpError when Supabase fails to sign the URL", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Object not found" },
    });

    await expect(
      getSignedFileUrl("session-replays", "missing.webm"),
    ).rejects.toThrow(HttpError);
  });

  it("rejects a missing bucket name or file path", async () => {
    await expect(getSignedFileUrl("", "abc.webm")).rejects.toThrow(HttpError);
    await expect(getSignedFileUrl("session-replays", "")).rejects.toThrow(
      HttpError,
    );
  });
});
