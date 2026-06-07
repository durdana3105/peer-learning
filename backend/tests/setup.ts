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
