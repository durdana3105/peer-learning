import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FeedbackModal } from "../FeedbackModal";
import { supabase } from "@/integrations/supabase/client";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...rest }: any) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock config
vi.mock("@/config/api", () => ({
  API_BASE_URL: "http://localhost:5000",
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("FeedbackModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmitSuccess = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    sessionId: "session-123",
    sessionTitle: "Introduction to React",
    onSubmitSuccess: mockOnSubmitSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(<FeedbackModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Rate Session Peer")).not.toBeInTheDocument();
  });

  it("should render correctly when open", () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByText("Rate Session Peer")).toBeInTheDocument();
    expect(screen.getByText("Introduction to React")).toBeInTheDocument();
    expect(screen.getByLabelText("Optional Comment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Review" })).toBeInTheDocument();
  });

  it("should allow selecting stars", () => {
    render(<FeedbackModal {...defaultProps} />);
    const starButtons = screen.getAllByRole("button").filter((btn) => btn.querySelector("svg") && btn.getAttribute("aria-label") !== "Close");
    expect(starButtons).toHaveLength(5);

    // Clicking the 4th star
    fireEvent.click(starButtons[3]);
    // The submit button should now be enabled
    expect(screen.getByRole("button", { name: "Submit Review" })).not.toBeDisabled();
  });

  it("should toggle feedback tags", () => {
    render(<FeedbackModal {...defaultProps} />);
    const tagButton = screen.getByText("Knowledgeable");
    expect(tagButton).toBeInTheDocument();

    // Toggle on
    fireEvent.click(tagButton);
    expect(tagButton).toHaveClass("bg-emerald-500/20");

    // Toggle off
    fireEvent.click(tagButton);
    expect(tagButton).not.toHaveClass("bg-emerald-500/20");
  });

  it("should handle character limit in comment field", () => {
    render(<FeedbackModal {...defaultProps} />);
    const commentField = screen.getByLabelText("Optional Comment") as HTMLTextAreaElement;
    expect(screen.getByText("0 / 300")).toBeInTheDocument();

    // Type comment
    fireEvent.change(commentField, { target: { value: "Nice session" } });
    expect(screen.getByText("12 / 300")).toBeInTheDocument();
  });

  it("should successfully submit review", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: "mock-token",
          user: { id: "user-123" },
        } as any,
      },
      error: null,
    });

    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.mocked(global.fetch).mockResolvedValue(mockFetchPromise as any);

    render(<FeedbackModal {...defaultProps} />);

    // Click 5th star
    const starButtons = screen.getAllByRole("button").filter((btn) => btn.querySelector("svg") && btn.getAttribute("aria-label") !== "Close");
    fireEvent.click(starButtons[4]);

    // Select tag
    const tagButton = screen.getByText("Patient");
    fireEvent.click(tagButton);

    // Enter comment
    const commentField = screen.getByLabelText("Optional Comment");
    fireEvent.change(commentField, { target: { value: "Excellent mentor" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/reviews",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          }),
          body: JSON.stringify({
            sessionId: "session-123",
            rating: 5,
            tags: ["Patient"],
            comment: "Excellent mentor",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Review Submitted!")).toBeInTheDocument();
    });
  });

  it("should display error message on API failure", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          access_token: "mock-token",
          user: { id: "user-123" },
        } as any,
      },
      error: null,
    });

    const mockFetchPromise = Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Duplicate review submission" }),
    });
    vi.mocked(global.fetch).mockResolvedValue(mockFetchPromise as any);

    render(<FeedbackModal {...defaultProps} />);

    // Click 5th star
    const starButtons = screen.getAllByRole("button").filter((btn) => btn.querySelector("svg") && btn.getAttribute("aria-label") !== "Close");
    fireEvent.click(starButtons[4]);

    // Submit
    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Duplicate review submission")).toBeInTheDocument();
    });
  });
});
