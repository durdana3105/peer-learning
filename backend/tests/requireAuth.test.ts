import crypto from "crypto";
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../middlewares/errorHandler.js";

vi.mock("../utils/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const createLocalJwt = (payload, secret) => {
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const body = base64UrlEncode(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${header}.${body}.${signature}`;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("requireAuth local JWT verification", () => {
  it("uses a timing-safe comparison for valid local JWT signatures", async () => {
    vi.stubEnv("SUPABASE_JWT_SECRET", "test-secret");
    const timingSafeEqualSpy = vi.spyOn(crypto, "timingSafeEqual");
    const { requireAuth } = await import("../middlewares/requireAuth.js");
    const token = createLocalJwt(
      {
        sub: "user-123",
        email: "learner@example.com",
        exp: Math.floor(Date.now() / 1000) + 60,
        role: "authenticated",
      },
      "test-secret",
    );

    const app = express();
    app.get("/me", requireAuth, (req, res) => {
      res.json({ user: req.user });
    });
    app.use(errorHandler);

    const response = await request(app).get("/me").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: "user-123",
      email: "learner@example.com",
      role: "authenticated",
    });
    expect(timingSafeEqualSpy).toHaveBeenCalled();
  });
});
