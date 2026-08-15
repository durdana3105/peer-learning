import fs from "fs";
import crypto from "crypto";
import { once } from "events";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import cookieParser from "cookie-parser";
import { errorHandler } from "../middlewares/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profilesUploadDir = path.resolve(__dirname, "../uploads/profiles");

// ── Supabase stub (requireAuth fast-path won't reach it, but the import needs it) ──
// Extended with a storage stub so the /api/upload suite below (uploadController.js)
// can assert on the path passed to storage.upload().
const { storageUploadMock, storageFromMock } = vi.hoisted(() => {
  const storageUploadMock = vi.fn(async (_filePath, fileStream) => {
    const finished = once(fileStream, "end");
    fileStream.resume();
    await finished;
    return { data: { path: "mock-path" }, error: null };
  });
  const storageFromMock = vi.fn(() => ({
    upload: storageUploadMock,
    getPublicUrl: (filePath) => ({
      data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/mock/${filePath}` },
    }),
  }));
  return { storageUploadMock, storageFromMock };
});

vi.mock("../utils/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(() => ({
    auth: { getUser: vi.fn() },
    storage: { from: storageFromMock },
  })),
}));

// ── JWT helpers (mirrors requireAuth.test.js) ──────────────────────────────────────
const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const createLocalJwt = (payload, secret) => {
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const body = base64UrlEncode(payload);
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${header}.${body}.${sig}`;
};

const TEST_SECRET = "test-secret-948";
const TEST_USER_ID = "user-948-test";

const makeToken = (overrides = {}) =>
  createLocalJwt(
    {
      sub: TEST_USER_ID,
      email: "tester@example.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "authenticated",
      ...overrides,
    },
    TEST_SECRET
  );

// ── Shared app fixtures ────────────────────────────────────────────────────────────
let app;
let uploadApp;

beforeAll(async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", TEST_SECRET);

  const { default: userRoutes } = await import("../routes/users.js");
  app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/users", userRoutes);
  app.use(errorHandler);

  const { default: uploadRoutes } = await import("../routers/uploadRoutes.js");
  uploadApp = express();
  uploadApp.use(cookieParser());
  uploadApp.use(express.json());
  uploadApp.use("/api/upload", uploadRoutes);
  uploadApp.use(errorHandler);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  fs.rmSync(profilesUploadDir, { recursive: true, force: true });
  storageUploadMock.mockClear();
  storageFromMock.mockClear();
  vi.restoreAllMocks();
});

// ── Fixture: a tiny valid PNG (1×1 white pixel) ───────────────────────────────────
// Using a Buffer so the test has zero filesystem dependencies.
const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d494844520000000100000001" +
  "08020000009001" + "2e0000000c4944415478016360f8cfc00000000200" +
  "01e221bc330000000049454e44ae426082",
  "hex"
);

describe("POST /api/users/upload-photo", () => {
  // ── Auth guard ─────────────────────────────────────────────────────────────────
  it("returns 401 when no Authorization header or cookie is provided", async () => {
    const res = await request(app)
      .post("/api/users/upload-photo")
      .attach("profilePhoto", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: expect.stringMatching(/authentication required/i) });
  });

  it("returns 401 when an invalid JWT is provided", async () => {
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Authorization", "Bearer this.is.not.a.valid.jwt")
      .attach("profilePhoto", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    expect(res.status).toBe(401);
  });

  it("returns 401 when a cookie holds an invalid token", async () => {
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Cookie", "access_token=bad.token.value")
      .attach("profilePhoto", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    expect(res.status).toBe(401);
  });

  it("returns 401 when an expired JWT is provided", async () => {
    const expiredToken = makeToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Authorization", `Bearer ${expiredToken}`)
      .attach("profilePhoto", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    expect(res.status).toBe(401);
  });

  // ── Authenticated upload ───────────────────────────────────────────────────────
  it("returns 200 and a fileUrl scoped to the authenticated user when a valid JWT is provided", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePhoto", TINY_PNG, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Filename/path must contain the authenticated user's ID
    expect(res.body.fileUrl).toContain(TEST_USER_ID);
    const pathSegments = new URL(res.body.fileUrl).pathname.split("/").filter(Boolean);
    expect(pathSegments).toContain(TEST_USER_ID);

    // Supabase storage path is scoped to the authenticated user's ID
    expect(res.body.fileUrl).toContain(`${TEST_USER_ID}/`);
    expect(storageUploadMock).toHaveBeenCalled();

  });

  it("returns 200 when a valid JWT is supplied via HttpOnly cookie", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Cookie", `access_token=${token}`)
      .attach("profilePhoto", TINY_PNG, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ── File-type enforcement ──────────────────────────────────────────────────────
  it("returns 415 when a non-image MIME type is uploaded by an authenticated user", async () => {
    const token = makeToken();
    const fakeScript = Buffer.from("#!/bin/bash\necho pwned");
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePhoto", fakeScript, {
        filename: "exploit.sh",
        contentType: "application/x-sh",
      });

    expect(res.status).toBe(415);
  });

  it("returns 415 when non-image bytes are uploaded with a spoofed image/png content type", async () => {
    const token = makeToken();
    // Real script bytes with a .png filename and image/png MIME — magic-byte check must catch this
    const fakeBytes = Buffer.from("#!/bin/bash\necho pwned\n");
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePhoto", fakeBytes, {
        filename: "exploit.png",       // .png extension
        contentType: "image/png",      // spoofed MIME header
      });

    expect(res.status).toBe(415);
  });

  it("returns 400 when no file field is included in an authenticated request", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no file/i);
  });

  it("returns 413 when the uploaded file exceeds the 2MB size limit", async () => {
    const token = makeToken();
    const oversized = Buffer.alloc(3 * 1024 * 1024, 0xff); // 3 MB of 0xFF bytes
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePhoto", oversized, {
        filename: "big.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/2mb/i);
  });
});

// ── Path-ownership coverage for the general upload endpoint (#1719) ─────────────────
describe("POST /api/upload", () => {
  it("returns 401 when no auth is provided", async () => {
    const res = await request(uploadApp)
      .post("/api/upload")
      .field("folder", "avatars")
      .attach("file", TINY_PNG, { filename: "test.png", contentType: "image/png" });

    expect(res.status).toBe(401);
    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it("ignores a client-supplied filePath and writes under the authenticated user's own id", async () => {
    const token = makeToken();
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "avatars")
      .field("filePath", "victim-user-id/test.png")
      .attach("file", TINY_PNG, { filename: "avatar.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // The path actually handed to Supabase Storage must be scoped to the
    // caller's own id, never the client-supplied filePath.
    expect(storageUploadMock).toHaveBeenCalledTimes(1);
    const [usedPath] = storageUploadMock.mock.calls[0];
    expect(usedPath.startsWith(`${TEST_USER_ID}/`)).toBe(true);
    expect(usedPath).not.toContain("victim-user-id");

    expect(res.body.data.path.startsWith(`${TEST_USER_ID}/`)).toBe(true);
    expect(res.body.data.path).not.toContain("victim-user-id");
  });

  it("ignores an attempted path-traversal filePath and still scopes the write to the caller's id", async () => {
    const token = makeToken();
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "resources")
      .field("filePath", "../../etc/passwd")
      .attach("file", Buffer.from("resource contents"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(200);
    const [usedPath] = storageUploadMock.mock.calls[0];
    expect(usedPath.startsWith(`${TEST_USER_ID}/`)).toBe(true);
    expect(usedPath).not.toContain("..");
  });

  it("returns 400 when the folder field is missing", async () => {
    const token = makeToken();
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", TINY_PNG, { filename: "avatar.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the folder is not one of the allowed presets", async () => {
    const token = makeToken();
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "some-other-bucket")
      .attach("file", TINY_PNG, { filename: "avatar.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it("returns 415 when the file type does not match the selected folder's preset", async () => {
    const token = makeToken();
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "avatars")
      .attach("file", Buffer.from("not an image"), {
        filename: "doc.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(415);
    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it("accepts a resource-type file under the resources preset", async () => {
    const token = makeToken();
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "resources")
      .attach("file", Buffer.from("%PDF-1.4 fake pdf"), {
        filename: "report.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.path.startsWith(`${TEST_USER_ID}/`)).toBe(true);
    expect(res.body.data.path.endsWith(".pdf")).toBe(true);
  });

  it("returns 415 when a file with spoofed MIME type (mismatched magic bytes) is uploaded", async () => {
    const token = makeToken();
    // Raw script bytes uploaded with contentType "image/png" under avatars
    const spoofedBytes = Buffer.from("#!/bin/bash\necho pwned\n");
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "avatars")
      .attach("file", spoofedBytes, {
        filename: "avatar.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(415);
    expect(res.body.error).toMatch(/file content does not match the provided MIME type/i);
    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it("returns 415 when a binary archive or executable is uploaded under a text MIME type", async () => {
    const token = makeToken();
    // Tiny PNG bytes uploaded with contentType "text/plain" under resources
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "resources")
      .attach("file", TINY_PNG, {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(415);
    expect(res.body.error).toMatch(/binary content detected in text upload/i);
    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it("returns 415 when a text file upload contains raw null bytes (0x00)", async () => {
    const token = makeToken();
    // Buffer with ASCII chars and an injected NULL byte
    const suspiciousText = Buffer.from([0x63, 0x6f, 0x6e, 0x73, 0x6f, 0x6c, 0x65, 0x2e, 0x6c, 0x6f, 0x67, 0x28, 0x30, 0x29, 0x3b, 0x00, 0x0a]);
    const res = await request(uploadApp)
      .post("/api/upload")
      .set("Authorization", `Bearer ${token}`)
      .field("folder", "resources")
      .attach("file", suspiciousText, {
        filename: "script.js",
        contentType: "text/javascript",
      });

    expect(res.status).toBe(415);
    expect(res.body.error).toMatch(/null bytes found in text upload/i);
    expect(storageUploadMock).not.toHaveBeenCalled();
  });
});
