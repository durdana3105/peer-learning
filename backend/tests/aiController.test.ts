import { beforeEach, describe, expect, it, vi } from "vitest";

import { askAI, generateSessionSummary } from "../controllers/aiController.js";

const createRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("aiController", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("sends max_tokens when handling askAI", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "hello" } }],
      }),
    });

    const req = { body: { messages: [{ role: "user", content: "How do I start with DSA?" }] } };
    const res = createRes();
    const next = vi.fn();

    await askAI(req, res, next);

    const [, requestInit] = fetchSpy.mock.calls[0];
    const payload = JSON.parse(requestInit.body);

    expect(payload.max_tokens).toBeTypeOf("number");
    expect(payload.max_tokens).toBeGreaterThanOrEqual(64);
    expect(payload.max_tokens).toBeLessThanOrEqual(512);
    expect(res.json).toHaveBeenCalledWith({ answer: "hello" });
  });

  it("returns strict summary JSON when model output is valid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: "Great progress in arrays and recursion.",
                key_takeaways: ["Practice daily", "Review edge cases"],
              }),
            },
          },
        ],
      }),
    });

    const req = {
      body: {
        messages: [
          { username: "A", message: "We solved two recursion problems." },
          { username: "B", message: "Need to improve complexity analysis." },
        ],
      },
    };
    const res = createRes();

    await generateSessionSummary(req, res);

    expect(res.json).toHaveBeenCalledWith({
      summary: "Great progress in arrays and recursion.",
      key_takeaways: ["Practice daily", "Review edge cases"],
    });
  });

  it("throws HttpError 502 when summary output is not valid JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Here is your summary in plain text." } }],
      }),
    });

    const req = {
      body: {
        messages: [{ username: "A", message: "Session message" }],
      },
    };
    const res = createRes();
    const next = vi.fn();

    await generateSessionSummary(req, res, next);

    expect(next).toHaveBeenCalled();
    const errorPassedToNext = next.mock.calls[0][0];
    expect(errorPassedToNext.name).toBe("HttpError");
    expect(errorPassedToNext.statusCode).toBe(502);
  });
});