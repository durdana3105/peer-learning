import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PeerCard from "../components/PeerCard";
import type { User } from "@/types";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...rest}>{children}</div>
    ),
  },
}));

const mockPeer: User = {
  id: "1",
  name: "Alice Johnson",
  avatar: "https://example.com/avatar.jpg",
  bio: "Loves React and TypeScript",
  rating: 4.8,
  sessionsCompleted: 12,
  points: 350,
  matchScore: 92,
  teachSubjects: ["React", "TypeScript", "Node.js"],
  learnSubjects: ["Rust", "Go"],
  badges: ["Top Mentor", "Streak Master"],
};

describe("PeerCard", () => {
  it("renders the peer's name", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
  });

  it("renders the peer's bio", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByText("Loves React and TypeScript")).toBeInTheDocument();
  });

  it("renders the match score when provided", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByText("92% Match")).toBeInTheDocument();
  });

  it("does not render match score when not provided", () => {
    const peerWithoutMatch = { ...mockPeer, matchScore: undefined };
    render(<PeerCard peer={peerWithoutMatch} />);
    expect(screen.queryByText(/Match/)).not.toBeInTheDocument();
  });

  it("renders up to 3 teach subjects as badges", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("renders learn subjects", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByText("Rust")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
  });

  it("renders peer badges", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByText("Top Mentor")).toBeInTheDocument();
    expect(screen.getByText("Streak Master")).toBeInTheDocument();
  });

  it("renders rating, sessions and XP", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("12 Sessions")).toBeInTheDocument();
    expect(screen.getByText("350 XP")).toBeInTheDocument();
  });

  it("calls onConnect when Connect button is clicked", () => {
    const onConnect = vi.fn();
    render(<PeerCard peer={mockPeer} onConnect={onConnect} />);
    fireEvent.click(screen.getByRole("button", { name: /connect/i }));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("renders View Profile button", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByRole("button", { name: /view profile/i })).toBeInTheDocument();
  });

  it("renders avatar with correct alt text", () => {
    render(<PeerCard peer={mockPeer} />);
    expect(screen.getByAltText("Alice Johnson")).toBeInTheDocument();
  });

  it("renders fallback bio when bio is empty", () => {
    const peerNoBio = { ...mockPeer, bio: "" };
    render(<PeerCard peer={peerNoBio} />);
    expect(screen.getByText("Passionate learner and collaborator.")).toBeInTheDocument();
  });
});
