import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import SessionCard from "./SessionCard";
import { sessionJoinPath } from "@/lib/sessionJoinPath";
import type { Session } from "@/types";

const baseSession: Session = {
  id: "42",
  peerId: "peer-1",
  peerName: "Alex Mentor",
  peerAvatar: "/avatar.png",
  subject: "React hooks",
  date: "8/10/2026",
  time: "03:00 PM",
  duration: 45,
  status: "upcoming",
};

const renderCard = (session: Session, joinHref?: string | null) =>
  render(
    <MemoryRouter>
      <SessionCard session={session} joinHref={joinHref} />
    </MemoryRouter>
  );

describe("sessionJoinPath", () => {
  it("builds a sessions deep-link for the given id", () => {
    expect(sessionJoinPath(42)).toBe("/sessions?session=42");
    expect(sessionJoinPath("abc/def")).toBe("/sessions?session=abc%2Fdef");
  });
});

describe("SessionCard Join action", () => {
  it("renders a Join link to the session destination", () => {
    renderCard({ ...baseSession, joinHref: sessionJoinPath(42) });

    const join = screen.getByRole("link", { name: "Join" });
    expect(join).toHaveAttribute("href", "/sessions?session=42");
  });

  it("allows an explicit joinHref prop to override the session value", () => {
    renderCard({ ...baseSession, joinHref: "/sessions?session=old" }, "/sessions?session=new");

    expect(screen.getByRole("link", { name: "Join" })).toHaveAttribute(
      "href",
      "/sessions?session=new"
    );
  });

  it("disables Join when no destination is available", () => {
    renderCard({ ...baseSession, joinHref: null });

    const unavailable = screen.getByRole("button", { name: "Unavailable" });
    expect(unavailable).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Join" })).not.toBeInTheDocument();
  });

  it("hides Join for completed sessions", () => {
    renderCard({ ...baseSession, status: "completed", rating: 5, joinHref: sessionJoinPath(42) });

    expect(screen.queryByRole("link", { name: "Join" })).not.toBeInTheDocument();
    expect(screen.getByText("5/5")).toBeInTheDocument();
  });
});
