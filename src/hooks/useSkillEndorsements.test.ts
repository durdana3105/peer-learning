import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSkillEndorsements } from "./useSkillEndorsements";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(),
  },
}));

// Mock useToast
vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(),
}));

describe("useSkillEndorsements rapid interactions", () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: mockToast });
    
    // Default auth mock
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: "current-user-123" } },
    });
  });

  it(
    "prevents rapid toggling state desync",
    async () => {
    let resolveInsert: (val: any) => void;
    const insertPromise = new Promise((res) => {
      resolveInsert = res;
    });

    const mockInsert = vi.fn().mockReturnValue(insertPromise);
    const mockDelete = vi.fn().mockReturnThis();
    const mockMatch = vi.fn().mockResolvedValue({ error: null });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "skill_endorsements") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: mockInsert,
          delete: mockDelete,
          match: mockMatch,
        };
      }
    });

    const { result } = renderHook(() =>
      useSkillEndorsements({ profileUserId: "profile-123", skills: ["React"] })
    );

    await waitFor(() => {
      expect(result.current.currentUserId).toBe("current-user-123");
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.toggleEndorsement("React");
      result.current.toggleEndorsement("React"); 
    });

    expect(result.current.endorsements["React"].count).toBe(1);
    expect(result.current.endorsements["React"].hasEndorsed).toBe(true);

    await act(async () => {
      resolveInsert!({ error: null });
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockDelete).not.toHaveBeenCalled();
    },
    15000
  );
});