import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../app.js";

describe("AI route body limit", () => {
  it("rejects an AI request body larger than 50KB with 413", async () => {
    const oversized = { pad: "x".repeat(80 * 1024) };
    const res = await request(app).post("/api/ai/ask").send(oversized);
    expect(res.status).toBe(413);
  });

  it("parses a small AI request body and reaches authentication", async () => {
    const res = await request(app)
      .post("/api/ai/ask")
      .send({ messages: [{ role: "user", content: "hi" }] });
    expect(res.status).not.toBe(413);
    expect(res.status).toBe(401);
  });

  it("still allows non-AI requests up to the global 100KB limit", async () => {
    const between = { pad: "x".repeat(80 * 1024) };
    const res = await request(app)
      .post("/api/notifications/send-push")
      .send(between);
    expect(res.status).not.toBe(413);
  });
});
