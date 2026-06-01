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

    // Calculate unique related skills for the current user upfront
    const allRelatedSkills = [];
    if (currentUser.skills && Array.isArray(currentUser.skills)) {
      currentUser.skills.forEach(skill => {
        allRelatedSkills.push(...getRelatedSkills(skill));
      });
    }
    const uniqueRelatedSkills = [...new Set(allRelatedSkills)].filter(
      s => !currentUser.skills.includes(s)
    );

    // Build the aggregation pipeline for in-database scoring
    const pipeline = [
      { $match: { email: { $ne: currentUserEmail } } },
      {
        $addFields: {
          commonSkillsCount: {
            $size: { $setIntersection: [{ $ifNull: ["$skills", []] }, currentUser.skills || []] }
          },
          relatedSkillsCount: {
            $size: { $setIntersection: [{ $ifNull: ["$skills", []] }, uniqueRelatedSkills] }
          },
          commonInterestsCount: {
            $size: { $setIntersection: [{ $ifNull: ["$interests", []] }, currentUser.interests || []] }
          },
          commonGoalsCount: {
            $size: { $setIntersection: [{ $ifNull: ["$learningGoals", []] }, currentUser.learningGoals || []] }
          },
          styleMatchScore: {
            $cond: [
              {
                $and: [
                  { $ne: [currentUser.learningStyle, null] },
                  { $eq: ["$learningStyle", currentUser.learningStyle] }
                ]
              },
              5,
              0
            ]
          },
          languageMatchScore: {
            $cond: [
              {
                $and: [
                  { $ne: [currentUser.preferredLanguage, null] },
                  { $eq: ["$preferredLanguage", currentUser.preferredLanguage] }
                ]
              },
              3,
              0
            ]
          },
          availabilityMatchScore: {
            $cond: [
              {
                $and: [
                  { $ne: [currentUser.availability, null] },
                  { $eq: ["$availability", currentUser.availability] }
                ]
              },
              3,
              0
            ]
          },
          timezoneMatchScore: {
            $cond: [
              {
                $and: [
                  { $ne: [currentUser.timezone, null] },
                  { $eq: ["$timezone", currentUser.timezone] }
                ]
              },
              3,
              0
            ]
          }
        }
      },
      {
        $addFields: {
          rawScore: {
            $add: [
              { $multiply: ["$commonSkillsCount", 10] },
              { $multiply: ["$relatedSkillsCount", 6] },
              { $multiply: ["$commonInterestsCount", 3] },
              { $multiply: ["$commonGoalsCount", 5] },
              "$styleMatchScore",
              "$languageMatchScore",
              "$availabilityMatchScore",
              "$timezoneMatchScore"
            ]
          }
        }
      },
      {
        $addFields: {
          compatibilityScore: { $min: ["$rawScore", 100] }
        }
      },
      { $sort: { compatibilityScore: -1 } },
      {
        $facet: {
          metadata: [{ $count: "totalCount" }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                name: 1,
                skills: { $ifNull: ["$skills", []] },
                interests: { $ifNull: ["$interests", []] },
                learningGoals: { $ifNull: ["$learningGoals", []] },
                availability: 1,
                learningStyle: 1,
                preferredLanguage: 1,
                timezone: 1,
                compatibilityScore: 1
              }
            }
          ]
        }
      }
    ];

    const results = await User.aggregate(pipeline);
    
    const totalCount = results[0].metadata[0] ? results[0].metadata[0].totalCount : 0;
    const paginatedUsers = results[0].data;

    // Run the JS logic strictly on the paginated slice to generate exact reason strings
    const recommendations = paginatedUsers.map(user => {
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
        compatibilityScore: result.compatibilityScore, // Matches DB score exactly
        reason: result.reasons[0] || "You have similar learning interests and compatible skills."
      };
    });

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