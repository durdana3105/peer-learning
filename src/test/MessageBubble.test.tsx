import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MessageBubble from "../components/chat/MessageBubble";

describe("MessageBubble", () => {
  it("renders the message text", () => {
    render(<MessageBubble text="Hello world" sender="user" time="10:00 AM" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders the timestamp", () => {
    render(<MessageBubble text="Hi" sender="user" time="11:30 AM" />);
    expect(screen.getByText("11:30 AM")).toBeInTheDocument();
  });

  it("aligns to the right for sender=user", () => {
    const { container } = render(
      <MessageBubble text="My message" sender="user" time="12:00 PM" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-end");
  });

  it("aligns to the left for sender=other", () => {
    const { container } = render(
      <MessageBubble text="Their message" sender="other" time="12:01 PM" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("justify-start");
  });

  it("applies blue background for sender=user", () => {
    render(<MessageBubble text="Me" sender="user" time="1:00 PM" />);
    const bubble = screen.getByText("Me").closest("div");
    expect(bubble?.className).toContain("bg-blue-500");
  });

  it("applies white background for sender=other", () => {
    render(<MessageBubble text="Other" sender="other" time="1:01 PM" />);
    const bubble = screen.getByText("Other").closest("div");
    expect(bubble?.className).toContain("bg-white");
  });
});
