const SAFE_PEER_REVIEW_URL_PROTOCOLS = new Set(["http:", "https:"]);

export function getSafePeerReviewSubmissionUrl(value: string | null | undefined): string | null {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return "";
  }

  try {
    const url = new URL(trimmedValue);
    return SAFE_PEER_REVIEW_URL_PROTOCOLS.has(url.protocol) ? trimmedValue : null;
  } catch {
    return null;
  }
}

export function isValidPeerReviewSubmissionUrl(value: string | null | undefined): boolean {
  return getSafePeerReviewSubmissionUrl(value) !== null;
}
