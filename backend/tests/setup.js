process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "dummy-test-key";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

vi.mock("openai", () => {
  return {
    default: class {
      constructor() {
        this.chat = {
          completions: { create: vi.fn() },
        };
      }
    },
  };
});
