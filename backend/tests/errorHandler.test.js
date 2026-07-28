import { describe, it, expect, vi, afterEach } from "vitest";
import { errorHandler } from "../middlewares/errorHandler.js";
import { HttpError } from "../utils/httpError.js";

const makeRes = () => ({
  headersSent: false,
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
  setHeader() {},
});

describe("errorHandler logging", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not log an intentional 4xx HttpError as an unhandled error", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = makeRes();

    errorHandler(
      new HttpError(401, "Authentication required"),
      { requestId: "req-1" },
      res,
      () => {},
    );

    expect(res.statusCode).toBe(401);
    const loggedUnhandled = errorSpy.mock.calls.some((args) =>
      String(args[0]).includes("Unhandled error"),
    );
    expect(loggedUnhandled).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("logs a genuinely unknown error exactly once as unhandled", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = makeRes();

    errorHandler(new Error("boom"), { requestId: "req-2" }, res, () => {});

    expect(res.statusCode).toBe(500);
    const unhandledLogs = errorSpy.mock.calls.filter((args) =>
      String(args[0]).includes("Unhandled error"),
    );
    expect(unhandledLogs).toHaveLength(1);
  });

  it("logs a 5xx HttpError at error level", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = makeRes();

    errorHandler(
      new HttpError(500, "boom"),
      { requestId: "req-3" },
      res,
      () => {},
    );

    expect(res.statusCode).toBe(500);
    expect(errorSpy).toHaveBeenCalled();
  });
});
