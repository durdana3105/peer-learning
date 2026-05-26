import User from "../models/User.js";

// 📚 Calculate compatibility score
const calculateCompatibilityScore = (currentUser, otherUser) => {
  let score = 0;

  // Skills Match
  const commonSkills = currentUser.skills.filter((skill) =>
    otherUser.skills.includes(skill)
  );

  score += commonSkills.length * 10;

  // Interests Match
  const commonInterests = currentUser.interests.filter((interest) =>
    otherUser.interests.includes(interest)
  );

  score += commonInterests.length * 10;

  // Learning Goals Match
  const commonGoals = currentUser.learningGoals.filter((goal) =>
    otherUser.learningGoals.includes(goal)
  );

  score += commonGoals.length * 15;

  // Learning Style Match
  if (
    currentUser.learningStyle &&
    currentUser.learningStyle === otherUser.learningStyle
  ) {
    score += 15;
  }

  // Language Match
  if (
    currentUser.preferredLanguage &&
    currentUser.preferredLanguage === otherUser.preferredLanguage
  ) {
    score += 10;
  }

  // Availability Match
  if (
    currentUser.availability &&
    currentUser.availability === otherUser.availability
  ) {
    score += 10;
  }

  // Timezone Match
  if (
    currentUser.timezone &&
    currentUser.timezone === otherUser.timezone
  ) {
    score += 10;
  }

  return Math.min(score, 100);
};

// 🚀 Get Recommended Study Partners
export const getRecommendedPartners = async (req, res) => {
  try {
    const currentUserEmail = req.user.email;

    const currentUser = await User.findOne({
    email: currentUserEmail,
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all other users
    const users = await User.find({
      email: { $ne: currentUserEmail },
    });

    // Generate recommendations
    const recommendations = users.map((user) => {
      const compatibilityScore = calculateCompatibilityScore(
        currentUser,
        user
      );

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        interests: user.interests,
        learningGoals: user.learningGoals,
        availability: user.availability,
        learningStyle: user.learningStyle,
        preferredLanguage: user.preferredLanguage,
        timezone: user.timezone,
        compatibilityScore,
      };
    });

    // Sort highest compatibility first
    recommendations.sort(
      (a, b) => b.compatibilityScore - a.compatibilityScore
    );

    res.status(200).json({
      success: true,
      count: recommendations.length,
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