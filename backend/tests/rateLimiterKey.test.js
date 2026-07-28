import express from "express";
import request from "supertest";
import { describe, it, expect } from "vitest";
import { createRateLimiter } from "../middlewares/rateLimiter.js";

const buildApp = (maxRequests) => {
  const app = express();
  app.get("/ping", createRateLimiter({ maxRequests }), (_req, res) =>
    res.json({ ok: true }),
  );
  return app;
};

describe("rate limiter key derivation", () => {
  it("does not create a fresh bucket when the User-Agent rotates on the same IP", async () => {
    const app = buildApp(3);

    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .get("/ping")
        .set("User-Agent", `agent-${i}`);
      expect(res.status).toBe(200);
    }

    const blocked = await request(app)
      .get("/ping")
      .set("User-Agent", "agent-rotated");
    expect(blocked.status).toBe(429);
  });
});
