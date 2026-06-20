import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, AuthContext } from "../contexts/AuthContext";
import { supabase } from "../integrations/supabase/client";
import React, { useContext } from "react";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => {
  const mockSubscription = {
    unsubscribe: vi.fn(),
  };
  const mockAuth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: mockSubscription },
    })),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  };
  const mockFrom = vi.fn();
  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom,
    },
  };
});

describe("AuthContext cookie sync & onboarding sync propagation", () => {
  let mockGetSession: any;
  let mockOnAuthStateChange: any;
  let mockFrom: any;
  let originalFetch: any;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetSession = supabase.auth.getSession;
    mockOnAuthStateChange = supabase.auth.onAuthStateChange;
    mockFrom = supabase.from;
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  const TestComponent = () => {
    const context = useContext(AuthContext);
    if (!context) return <div>No Context</div>;
    return (
      <div>
        <span data-testid="loading">{context.loading ? "Loading" : "Done"}</span>
        <span data-testid="status">{context.status}</span>
        <span data-testid="cookieSynced">{context.cookieSynced ? "Synced" : "Not Synced"}</span>
        <span data-testid="needsOnboarding">{context.needsOnboarding ? "Needs Onboarding" : "No Onboarding"}</span>
      </div>
    );
  };

  it("handles non-successful cookie sync response and sets cookieSynced to false", async () => {
    // Mock getSession to return a valid session
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test-token",
          user: { id: "test-user-id", email: "test@example.com" },
        },
      },
      error: null,
    });

    // Mock profiles select to succeed
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { is_mentor: true, is_learner: false },
          error: null,
        }),
      }),
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    // Mock fetch to return ok: false
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state is loading
    expect(screen.getByTestId("loading")).toHaveTextContent("Loading");

    // Advance timers for cookie retry delays
    // Retries 3 times, delay is 1000 * (attempt + 1) -> 1s, 2s
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    await waitFor(() =>
      expect(screen.getByTestId("cookieSynced")).toHaveTextContent("Not Synced")
    );
  });

  it("propagates onboarding sync failure by putting auth state to failed", async () => {
    // Mock getSession to return a valid session
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test-token",
          user: { id: "test-user-id", email: "test@example.com" },
        },
      },
      error: null,
    });

    // Mock profiles select to throw/fail
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: new Error("Database error"),
        }),
      }),
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });

    // Mock fetch to succeed
    (global.fetch as any).mockResolvedValue({
      ok: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Since onboarding sync fails and propagates, loading should finish, but status is "failed"
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("failed")
    );
  });
});
