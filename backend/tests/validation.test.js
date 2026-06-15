import express from "express";
import request from "supertest";
import app from "../app.js";
import { validate } from "../middlewares/validate.js";
import { errorHandler } from "../middlewares/errorHandler.js";
import { aiSchemas } from "../validation/schemas.js";

describe("backend validation", () => {


  it("returns the same 400 shape for invalid AI payloads", async () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.post("/ask", validate(aiSchemas.askAI), (req, res) => {
      res.json({ ok: true });
    });
    testApp.use(errorHandler);

    const response = await request(testApp).post("/ask").send({ messages: [] });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: "Validation failed",
    });
    expect(response.body.details[0]).toMatchObject({
      path: "messages",
    });
  });
});
