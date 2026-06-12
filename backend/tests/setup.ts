process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "dummy-test-key";

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
