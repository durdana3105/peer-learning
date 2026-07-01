import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Contact from "./Contact";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(),
}));

describe("Contact", () => {
  const toast = vi.fn();
  const insert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    (useToast as any).mockReturnValue({ toast });
    (supabase.from as any).mockReturnValue({ insert });
    insert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows success when local contact submission storage cannot be updated", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Lovelace" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "I would like to learn more." },
    });

    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/^Message Sent!/),
        })
      );
    });

    expect(toast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Submission Failed",
      })
    );
  });
});
