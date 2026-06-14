import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import app from "../app.js";

process.env.FRONTEND_URL = "http://localhost:3000";

// Mock Supabase
vi.mock("../utils/supabase.js", () => {
  return {
    getSupabaseAdmin: vi.fn(() => ({
      auth: {
        getUser: vi.fn().mockImplementation(async (token) => {
          if (token === "valid-token") {
            return { data: { user: { id: "user-123" } }, error: null };
          }
          return { data: { user: null }, error: new Error("Invalid token") };
        }),
      },
    })),
  };
});


// Since requireAuth uses the mocked Supabase client, we need to ensure the mocks are loaded
describe("Users Routes - /upload-photo (Issue #957)", () => {
  it("should return 401 Unauthorized if no auth token is provided", async () => {
    // Unauthenticated request should be rejected by requireAuth
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Origin", "http://localhost:3000")
      // no auth header
      .attach("profilePhoto", Buffer.from("fake-image-content"), "photo.jpg");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  it("should return 401 Unauthorized if an invalid auth token is provided", async () => {
    const res = await request(app)
      .post("/api/users/upload-photo")
      .set("Origin", "http://localhost:3000")
      .set("Authorization", "Bearer invalid-token")
      .attach("profilePhoto", Buffer.from("fake-image-content"), "photo.jpg");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired session");
  });
});
