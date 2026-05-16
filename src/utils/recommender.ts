export interface PeerData {
  id: string;
  name?: string;
  avatar_url?: string | null;
  skills?: string[];
  interests?: string[];
  [key: string]: unknown;
}

export type MatchResult = PeerData & { matchScore: number };

export const getRecommendations = (currentUser: PeerData, allPeers: PeerData[], topN: number = 3) => {
  if (!currentUser || !allPeers || allPeers.length === 0) return [];

  const parseTags = (tags: unknown): string[] => {
    if (Array.isArray(tags)) return tags.filter(t => typeof t === 'string');
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const myTags = [...parseTags(currentUser.skills), ...parseTags(currentUser.interests)].map(t => t.toLowerCase());

  return allPeers
    .filter(peer => peer.id !== currentUser.id)
    .map(peer => {
      const peerTags = [...parseTags(peer.skills), ...parseTags(peer.interests)].map(t => t.toLowerCase());
      
      // Calculate intersection (common tags)
      const common = peerTags.filter(tag => myTags.includes(tag));
      
      // Simple Jaccard Similarity-like score
      const totalUniqueTags = new Set([...myTags, ...peerTags]).size;
      const score = totalUniqueTags > 0 ? (common.length / totalUniqueTags) * 100 : 0;

      return {
        ...peer,
        matchScore: Math.round(score)
      };
    })
    .filter(peer => peer.matchScore > 0) // Sirf unhe dikhao jinme kuch common ho
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
};