import { describe, expect, it } from "vitest";
import {
  getSafePeerReviewSubmissionUrl,
  isValidPeerReviewSubmissionUrl,
} from "@/utils/peerReviewUrl";

describe("peer review submission URL validation", () => {
  it("accepts https URLs", () => {
    expect(isValidPeerReviewSubmissionUrl("https://example.com")).toBe(true);
    expect(getSafePeerReviewSubmissionUrl("https://example.com")).toBe("https://example.com");
  });

  it("accepts http URLs", () => {
    expect(isValidPeerReviewSubmissionUrl("http://example.com")).toBe(true);
    expect(getSafePeerReviewSubmissionUrl("http://example.com")).toBe("http://example.com");
  });

  it("accepts an empty string as optional", () => {
    expect(isValidPeerReviewSubmissionUrl("")).toBe(true);
    expect(getSafePeerReviewSubmissionUrl("")).toBe("");
  });

  it("rejects javascript URLs", () => {
    expect(isValidPeerReviewSubmissionUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data URLs", () => {
    expect(isValidPeerReviewSubmissionUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isValidPeerReviewSubmissionUrl("not-a-url")).toBe(false);
  });
});
