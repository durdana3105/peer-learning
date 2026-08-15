import { describe, it, expect } from "vitest";
import { toSessionCardModel } from "./mentorSessionCard";

describe("toSessionCardModel", () => {
  it("maps distinct learner profiles onto different session cards", () => {
    const alice = toSessionCardModel({
      id: 1,
      title: "React fundamentals",
      scheduled_at: "2026-08-10T15:00:00.000Z",
      duration_minutes: 45,
      status: "scheduled",
      student_id: "learner-alice",
      student: {
        id: "learner-alice",
        name: "Alice Chen",
        avatar_url: "https://cdn.example/alice.png",
      },
    });

    const bob = toSessionCardModel({
      id: 2,
      title: "System design",
      scheduled_at: "2026-08-11T16:00:00.000Z",
      duration_minutes: 60,
      status: "scheduled",
      student_id: "learner-bob",
      student: {
        id: "learner-bob",
        name: "Bob Patel",
        avatar_url: "https://cdn.example/bob.png",
      },
    });

    expect(alice.peerId).toBe("learner-alice");
    expect(alice.peerName).toBe("Alice Chen");
    expect(alice.peerAvatar).toBe("https://cdn.example/alice.png");

    expect(bob.peerId).toBe("learner-bob");
    expect(bob.peerName).toBe("Bob Patel");
    expect(bob.peerAvatar).toBe("https://cdn.example/bob.png");

    expect(alice.peerName).not.toBe(bob.peerName);
  });

  it("falls back to placeholder learner details when the profile is missing", () => {
    const session = toSessionCardModel({
      id: 3,
      title: null,
      scheduled_at: null,
      duration_minutes: null,
      status: "scheduled",
      student_id: null,
      student: null,
    });

    expect(session.peerId).toBe("");
    expect(session.peerName).toBe("Learner");
    expect(session.peerAvatar).toBe("/placeholder.svg");
    expect(session.subject).toBe("Mentorship session");
  });

  it("uses student_id when the nested profile relation is empty", () => {
    const session = toSessionCardModel({
      id: 4,
      title: "Algorithms",
      scheduled_at: "2026-08-12T12:00:00.000Z",
      duration_minutes: 30,
      status: "scheduled",
      student_id: "orphan-learner",
      student: null,
    });

    expect(session.peerId).toBe("orphan-learner");
    expect(session.peerName).toBe("Learner");
    expect(session.peerAvatar).toBe("/placeholder.svg");
  });
});
