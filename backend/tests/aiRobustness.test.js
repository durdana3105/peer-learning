import express from "express";
import request from "supertest";
import { vi, describe, it, expect, afterEach } from "vitest";
import { askAI } from "../controllers/aiController.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { errorHandler } from "../middlewares/errorHandler.js";
import { validate } from "../middlewares/validate.js";
import { aiSchemas } from "../validation/schemas.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("AI route robustness", () => {
  it("returns a fallback 503 when the model call aborts", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));

    const app = express();
    app.use(express.json());
    app.post("/ask", validate(aiSchemas.askAI), askAI);
    app.use(errorHandler);

    const response = await request(app).post("/ask").send({ messages: [{ role: "user", content: "Explain closures" }] });

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      error: "AI request timed out. Please try again.",
    });
    expect(response.body.details).toMatchObject({
      retryable: true,
      reason: "timeout",
    });
  });

  it("rate limits by user id before ip and returns a consistent 429 payload", async () => {
    const app = express();
    app.use((req, res, next) => {
      req.user = { id: req.get("x-test-user") };
      next();
    });
    app.get("/ai", rateLimiter, (req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);

    // Make 20 requests to hit the limit (MAX_REQUESTS is 20 in rateLimiter.js)
    for (let i = 0; i < 20; i++) {
      await request(app)
        .get("/ai")
        .set("x-test-user", "user-1")
        .set("x-forwarded-for", "1.1.1.1");
    }

    // The 21st request with the same user ID (but different IP) should be limited
    const second = await request(app)
      .get("/ai")
      .set("x-test-user", "user-1")
      .set("x-forwarded-for", "2.2.2.2");

    expect(second.status).toBe(429);
    expect(second.body).toMatchObject({
      error: "Too many requests. Please wait before sending more messages.",
    });
  });
});
