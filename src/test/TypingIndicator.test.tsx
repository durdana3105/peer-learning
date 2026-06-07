import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TypingIndicator from "../components/chat/TypingIndicator";

describe("TypingIndicator", () => {
  it("renders three animated dots", () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll("span");
    expect(dots).toHaveLength(3);
  });

  it("all dots have animate-bounce class", () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll("span");
    dots.forEach((dot) => {
      expect(dot.className).toContain("animate-bounce");
    });
  });

  it("renders the outer container with correct base classes", () => {
    const { container } = render(<TypingIndicator />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("rounded-2xl");
  });

  it("second dot has delay-150 class", () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll("span");
    expect(dots[1].className).toContain("delay-150");
  });

  it("third dot has delay-300 class", () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll("span");
    expect(dots[2].className).toContain("delay-300");
  });
});
