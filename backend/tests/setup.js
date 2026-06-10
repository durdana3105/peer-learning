process.env.SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET || "test-jwt-secret-for-ci";
process.env.OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || "dummy-test-key";

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
