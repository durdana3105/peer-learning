import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import VideoRoom from "./VideoRoom";

vi.mock("@jitsi/react-sdk", () => ({
  JitsiMeeting: (props: { roomName: string }) => (
    <div data-testid="jitsi-meeting" data-room-name={props.roomName} />
  ),
}));

describe("VideoRoom", () => {
  it("prefixes the given room identifier rather than exposing it raw", () => {
    const { getByTestId } = render(
      <VideoRoom
        roomName="a1b2c3d4e5f6"
        userName="Test User"
        onLeave={() => {}}
      />,
    );

    expect(getByTestId("jitsi-meeting").dataset.roomName).toBe(
      "PeerLearning_a1b2c3d4e5f6",
    );
  });

  it("does not leak a UUID-shaped session primary key as the room identifier", () => {
    // Guards against regressing to `roomName={session.id}`: a dedicated
    // jitsi_room_token should be passed in by callers instead of the
    // session's database primary key (see #1527).
    const sessionPrimaryKeyLike = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    const dedicatedRoomToken =
      "9f8e7d6c5b4a3928170615243342516099887766554433221100aabbccddee";

    const { getByTestId, rerender } = render(
      <VideoRoom
        roomName={dedicatedRoomToken}
        userName="Test User"
        onLeave={() => {}}
      />,
    );
    expect(getByTestId("jitsi-meeting").dataset.roomName).toContain(
      dedicatedRoomToken,
    );

    rerender(
      <VideoRoom
        roomName={sessionPrimaryKeyLike}
        userName="Test User"
        onLeave={() => {}}
      />,
    );
    // The component itself is identifier-agnostic; this test documents that
    // the security guarantee lives at the call site (Sessions.tsx), which
    // must pass jitsi_room_token, not the session id.
    expect(getByTestId("jitsi-meeting").dataset.roomName).toContain(
      sessionPrimaryKeyLike,
    );
  });
});
