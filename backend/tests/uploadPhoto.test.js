import fs from "fs";
import crypto from "crypto";
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
vi.mock("../utils/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(() => ({
    auth: { getUser: vi.fn() },
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

// ── Shared app fixture ─────────────────────────────────────────────────────────────
let app;

beforeAll(async () => {
  vi.stubEnv("SUPABASE_JWT_SECRET", TEST_SECRET);
  const { default: userRoutes } = await import("../routes/users.js");
  app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/users", userRoutes);
  app.use(errorHandler);
});

afterAll(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  fs.rmSync(profilesUploadDir, { recursive: true, force: true });
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
    // Filename must contain the authenticated user's ID
    expect(res.body.fileUrl).toMatch(new RegExp(`profile-${TEST_USER_ID}-`));
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

  it("returns 413 when the uploaded file exceeds the 5MB size limit", async () => {
    const token = makeToken();
    const oversized = Buffer.alloc(6 * 1024 * 1024, 0xff); // 6 MB of 0xFF bytes
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Authorization", `Bearer ${token}`)
      .attach("profilePhoto", oversized, {
        filename: "big.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(413);
    expect(res.body.error).toMatch(/5mb/i);
  });
});