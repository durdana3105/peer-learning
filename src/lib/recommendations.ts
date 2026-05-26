export type RecommendationProfile = {
  id: string;
  name: string | null;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
  teach_subjects: string[] | null;
  learn_subjects: string[] | null;
  rating: number | null;
  sessions_completed: number | null;
  points: number | null;
  streak?: number | null;
};

export type RecommendationTopic = {
  topic: string;
  weight: number;
};

type TopicHit = {
  topic: string;
  score: number;
};

const FALLBACK_TOPICS = ["AI/ML", "Web Development", "DSA"];

const normalizeList = (values?: (string | null | undefined)[] | null) =>
  Array.from(
    new Set(
      (values || [])
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .map((part) => part.trim())
    .filter(Boolean);

export const inferTopics = (
  profile: Pick<
    RecommendationProfile,
    "skills" | "interests" | "teach_subjects" | "learn_subjects"
  >,
) => {
  const weights = new Map<string, number>();

  const addTopics = (topics: string[] | null, weight: number) => {
    normalizeList(topics).forEach((topic) => {
      const nextWeight = (weights.get(topic) || 0) + weight;
      weights.set(topic, nextWeight);
    });
  };

  addTopics(profile.skills, 3);
  addTopics(profile.interests, 4);
  addTopics(profile.learn_subjects, 4);
  addTopics(profile.teach_subjects, 2);

  const sorted = Array.from(weights.entries())
    .map(([topic, weight]) => ({ topic, weight }))
    .sort((left, right) => right.weight - left.weight);

  return sorted.length > 0
    ? sorted
    : FALLBACK_TOPICS.map((topic, index) => ({ topic, weight: 4 - index }));
};

const scoreTopicInText = (topic: string, text: string) => {
  const normalizedTopic = topic.toLowerCase();
  const normalizedText = text.toLowerCase();

  if (normalizedText.includes(normalizedTopic)) {
    return 6;
  }

  const topicTokens = tokenize(topic);
  if (topicTokens.some((token) => normalizedText.includes(token))) {
    return 3;
  }

  return 0;
};

export const buildResourceScore = (
  resource: {
    title: string;
    description: string | null;
    tags: string[] | null;
    created_at: string;
    file_type: string;
  },
  topics: RecommendationTopic[],
) => {
  const text = [resource.title, resource.description || "", ...(resource.tags || [])].join(" ");

  const hits: TopicHit[] = [];
  const baseScore = topics.reduce((total, topic) => {
    const topicScore = scoreTopicInText(topic.topic, text);

    if (topicScore > 0) {
      hits.push({ topic: topic.topic, score: topicScore });
    }

    return total + topicScore * topic.weight;
  }, 0);

  const ageInDays = Math.max(0, (Date.now() - new Date(resource.created_at).getTime()) / 86400000);
  const recencyBoost = ageInDays < 7 ? 4 : ageInDays < 30 ? 2 : 0;
  const typeBoost = ["py", "js", "ts"].includes(resource.file_type) ? 2 : 0;

  const score = baseScore + recencyBoost + typeBoost;

  return {
    score,
    hits: hits.sort((left, right) => right.score - left.score).slice(0, 2),
  };
};

export const buildMentorScore = (
  mentor: RecommendationProfile & { is_mentor?: boolean },
  profile: Pick<RecommendationProfile, "interests" | "learn_subjects" | "skills">,
  topics: RecommendationTopic[],
) => {
  const mentorTopics = normalizeList([
    ...(mentor.teach_subjects || []),
    ...(mentor.skills || []),
    ...(mentor.interests || []),
  ]);

  const learnerTopics = normalizeList([
    ...(profile.learn_subjects || []),
    ...(profile.interests || []),
    ...(profile.skills || []),
  ]);

  const mentorText = `${mentorTopics.join(" ")} ${mentor.bio || ""}`;
  const learnerText = learnerTopics.join(" ");

  const topicMatches = topics.reduce((total, topic) => {
    const mentorWeight = scoreTopicInText(topic.topic, mentorText);
    const learnerWeight = scoreTopicInText(topic.topic, learnerText);
    return total + mentorWeight * topic.weight + learnerWeight * Math.max(topic.weight - 1, 1);
  }, 0);

  const ratingBoost = (mentor.rating || 0) * 4;
  const activityBoost = Math.min((mentor.points || 0) / 60, 8) + Math.min((mentor.sessions_completed || 0) / 3, 8);

  return {
    score: topicMatches + ratingBoost + activityBoost,
    overlap: topics
      .filter((topic) => scoreTopicInText(topic.topic, mentorText) > 0)
      .map((topic) => topic.topic)
      .slice(0, 3),
  };
};

export const buildSessionScore = (
  session: {
    title: string | null;
    description: string | null;
    scheduled_at: string | null;
    status: string | null;
  },
  topics: RecommendationTopic[],
) => {
  const text = [session.title || "", session.description || ""].join(" ");

  const topicScore = topics.reduce((total, topic) => total + scoreTopicInText(topic.topic, text) * topic.weight, 0);
  const soonness = session.scheduled_at
    ? Math.max(0, 9 - Math.min(9, Math.ceil((new Date(session.scheduled_at).getTime() - Date.now()) / 86400000)))
    : 1;
  const statusBoost = session.status === "upcoming" ? 3 : 0;

  return {
    score: topicScore + soonness + statusBoost,
    matches: topics
      .filter((topic) => scoreTopicInText(topic.topic, text) > 0)
      .map((topic) => topic.topic)
      .slice(0, 2),
  };
};

export const buildPracticeRecommendations = (
  profile: Pick<RecommendationProfile, "points" | "sessions_completed" | "streak">,
  topics: RecommendationTopic[],
) => {
  const practiceLevel =
    (profile.sessions_completed || 0) + Math.floor((profile.points || 0) / 120) + Math.floor((profile.streak || 0) / 3);

  const difficulty = practiceLevel >= 12 ? "Advanced" : practiceLevel >= 5 ? "Intermediate" : "Foundational";

  return topics.slice(0, 3).map((topic, index) => ({
    id: `${topic.topic}-${index}`,
    topic: topic.topic,
    title: `${topic.topic} challenge`,
    description: `Work through a ${difficulty.toLowerCase()} problem set designed around ${topic.topic} and sharpen the exact skills you are building right now.`,
    difficulty,
    score: Math.round(topic.weight * 10 + Math.max(0, 18 - index * 3) + Math.min(practiceLevel, 12)),
  }));
};
