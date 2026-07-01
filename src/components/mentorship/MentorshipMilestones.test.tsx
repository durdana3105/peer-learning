import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MentorshipMilestones } from "./MentorshipMilestones";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("MentorshipMilestones Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display a loading state initially", () => {
    // Setup a pending promise to keep it in loading state
    const mockSelect = vi.fn().mockReturnValue(new Promise(() => {}));
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: mockSelect,
        })
      })
    });

    render(<MentorshipMilestones userId="123" isMentor={false} />);
    expect(screen.getByText("Loading mentorship paths...")).toBeInTheDocument();
  });

  it("should render 'No active mentorship roadmaps' when empty", async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: mockSelect,
        })
      })
    });

    render(<MentorshipMilestones userId="123" isMentor={false} />);
    
    await waitFor(() => {
      expect(screen.queryByText("Loading mentorship paths...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No active mentorship roadmaps found.")).toBeInTheDocument();
  });

  it("should render paths and milestones correctly", async () => {
    const mockData = [
      {
        id: "path1",
        goal: "Become a frontend master",
        mentee_id: "456",
        mentor_id: "123",
        mentorship_milestones: [
          { id: "m1", title: "Learn React", is_completed: true },
          { id: "m2", title: "Learn TypeScript", is_completed: false },
        ]
      }
    ];

    const mockSelect = vi.fn().mockResolvedValue({ data: mockData, error: null });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: mockSelect,
        })
      })
    });

    render(<MentorshipMilestones userId="123" isMentor={true} />);
    
    await waitFor(() => {
      expect(screen.getByText("Become a frontend master")).toBeInTheDocument();
    });

    expect(screen.getByText("Learn React")).toBeInTheDocument();
    expect(screen.getByText("Learn TypeScript")).toBeInTheDocument();
    
    // Progress calculation: 1 out of 2 completed = 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
