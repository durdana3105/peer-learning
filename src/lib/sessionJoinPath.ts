export const sessionJoinPath = (sessionId: string | number): string =>
  `/sessions?session=${encodeURIComponent(String(sessionId))}`;
