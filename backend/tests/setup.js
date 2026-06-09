process.env.SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET || "test-jwt-secret-for-ci";
process.env.OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || "test-openrouter-key-for-ci";

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
