import User from "../models/User.js";
import { getRelatedSkills } from "../utils/skillGraph.js";
// 📚 Calculate compatibility score
const calculateCompatibilityScore = (currentUser, otherUser) => {
  let score = 0;

  const reasons = [];

  // ✅ Exact Skill Matches
  const commonSkills = currentUser.skills.filter((skill) =>
    otherUser.skills.includes(skill)
  );

  if (commonSkills.length > 0) {
    score += commonSkills.length * 10;

    reasons.push(
      `You both share ${commonSkills.slice(0, 2).join(", ")} skills.`
    );
  }

  // ✅ Related Skill Matches
  let relatedSkillMatches = [];

  currentUser.skills.forEach((skill) => {
    const relatedSkills = getRelatedSkills(skill);

    relatedSkills.forEach((relatedSkill) => {
      if (
        otherUser.skills.includes(relatedSkill) &&
        !commonSkills.includes(relatedSkill)
      ) {
        relatedSkillMatches.push(relatedSkill);
      }
    });
  });

  relatedSkillMatches = [...new Set(relatedSkillMatches)];

  if (relatedSkillMatches.length > 0) {
    score += relatedSkillMatches.length * 6;

    reasons.push(
      `Related technologies include ${relatedSkillMatches
        .slice(0, 2)
        .join(", ")}.`
    );
  }

  // ✅ Interests Match
  const commonInterests = currentUser.interests.filter((interest) =>
    otherUser.interests.includes(interest)
  );

  if (commonInterests.length > 0) {
    score += commonInterests.length * 3;

    reasons.push(
      `Shared interests in ${commonInterests.slice(0, 2).join(", ")}.`
    );
  }

  // ✅ Learning Goals Match
  const commonGoals = currentUser.learningGoals.filter((goal) =>
    otherUser.learningGoals.includes(goal)
  );

  if (commonGoals.length > 0) {
    score += commonGoals.length * 5;

    reasons.push(
      `You have similar learning goals.`
    );
  }

  // ✅ Learning Style Match
  if (
    currentUser.learningStyle &&
    currentUser.learningStyle === otherUser.learningStyle
  ) {
    score += 5;
  }

  // ✅ Language Match
  if (
    currentUser.preferredLanguage &&
    currentUser.preferredLanguage === otherUser.preferredLanguage
  ) {
    score += 3;
  }

  // ✅ Availability Match
  if (
    currentUser.availability &&
    currentUser.availability === otherUser.availability
  ) {
    score += 3;
  }

  // ✅ Timezone Match
  if (
    currentUser.timezone &&
    currentUser.timezone === otherUser.timezone
  ) {
    score += 3;
  }

  return {
    compatibilityScore: Math.min(score, 100),
    reasons,
  };
};

const PAGE_SIZE = 20;

// 🚀 Get Recommended Study Partners
export const getRecommendedPartners = async (req, res) => {
  try {
    const currentUserEmail = req.user.email;

    const currentUser = await User.findOne({ email: currentUserEmail });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Parse and clamp pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || PAGE_SIZE));
    const skip = (page - 1) * limit;

    // Exclude the caller's email and only project fields needed for scoring.
    // Email is intentionally omitted from the projection to prevent mass PII
    // enumeration (resolves issue #146).
    const users = await User.find(
      { email: { $ne: currentUserEmail } },
      {
        _id: 1,
        name: 1,
        skills: 1,
        interests: 1,
        learningGoals: 1,
        availability: 1,
        learningStyle: 1,
        preferredLanguage: 1,
        timezone: 1,
      }
    );

    // Score all users in memory, then paginate the sorted result so the page
    // boundary is stable across requests.
    const scored = users.map((user) => {
  const result = calculateCompatibilityScore(currentUser, user);

  return {
    _id: user._id,
    name: user.name,
    skills: user.skills,
    interests: user.interests,
    learningGoals: user.learningGoals,
    availability: user.availability,
    learningStyle: user.learningStyle,
    preferredLanguage: user.preferredLanguage,
    timezone: user.timezone,
    compatibilityScore: result.compatibilityScore,
    reason:
      result.reasons[0] ||
      "You have similar learning interests and compatible skills.",
  };
});

    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    const totalCount = scored.length;
    const recommendations = scored.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: recommendations.length,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};