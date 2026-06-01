import { getSupabaseAdmin } from "../utils/supabase.js";
import { getRelatedSkills } from "../utils/skillGraph.js";

// 📚 Calculate compatibility score
const calculateCompatibilityScore = (currentUser, otherUser) => {
  let score = 0;
  const reasons = [];

  // Match based on Supabase profile schema: skills, interests, teach_subjects, learn_subjects
  const currentSkills = currentUser.skills || [];
  const otherSkills = otherUser.skills || [];
  const currentInterests = currentUser.interests || [];
  const otherInterests = otherUser.interests || [];
  const currentTeach = currentUser.teach_subjects || [];
  const otherTeach = otherUser.teach_subjects || [];
  const currentLearn = currentUser.learn_subjects || [];
  const otherLearn = otherUser.learn_subjects || [];

  // ✅ Exact Skill Matches
  const commonSkills = currentSkills.filter((skill) =>
    otherSkills.includes(skill)
  );
  if (commonSkills.length > 0) {
    score += commonSkills.length * 10;
    reasons.push(`You both share ${commonSkills.slice(0, 2).join(", ")} skills.`);
  }

  // ✅ Related Skill Matches
  let relatedSkillMatches = [];
  currentSkills.forEach((skill) => {
    const relatedSkills = getRelatedSkills(skill) || [];
    relatedSkills.forEach((relatedSkill) => {
      if (otherSkills.includes(relatedSkill) && !commonSkills.includes(relatedSkill)) {
        relatedSkillMatches.push(relatedSkill);
      }
    });
  });
  relatedSkillMatches = [...new Set(relatedSkillMatches)];
  if (relatedSkillMatches.length > 0) {
    score += relatedSkillMatches.length * 6;
    reasons.push(`Related technologies include ${relatedSkillMatches.slice(0, 2).join(", ")}.`);
  }

  // ✅ Interests Match
  const commonInterests = currentInterests.filter((interest) =>
    otherInterests.includes(interest)
  );
  if (commonInterests.length > 0) {
    score += commonInterests.length * 3;
    reasons.push(`Shared interests in ${commonInterests.slice(0, 2).join(", ")}.`);
  }

  // ✅ Mentorship Match (CurrentUser teaches what OtherUser wants to learn, or vice versa)
  const currentTeachesOtherLearns = currentTeach.filter((subject) => otherLearn.includes(subject));
  if (currentTeachesOtherLearns.length > 0) {
    score += currentTeachesOtherLearns.length * 8;
    reasons.push(`You can teach them ${currentTeachesOtherLearns.slice(0, 2).join(", ")}.`);
  }

  const currentLearnsOtherTeaches = currentLearn.filter((subject) => otherTeach.includes(subject));
  if (currentLearnsOtherTeaches.length > 0) {
    score += currentLearnsOtherTeaches.length * 8;
    reasons.push(`They can teach you ${currentLearnsOtherTeaches.slice(0, 2).join(", ")}.`);
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
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, message: "Supabase client not configured" });
    }

    const currentUserEmail = req.user.email;
    
    // Fetch current user from Supabase profiles
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('profiles')
      .select('skills, interests, teach_subjects, learn_subjects')
      .eq('email', currentUserEmail)
      .single();

    if (currentUserError || !currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Parse and clamp pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || PAGE_SIZE));
    const skip = (page - 1) * limit;

    // Fetch potential matches from Supabase (everyone except current user)
    // SECURITY/PERF: Bound the fetch pool to a maximum of 1000 candidates.
    // This prevents catastrophic O(N) memory exhaustion and Node.js Event Loop blocking 
    // when the platform scales to hundreds of thousands of users.
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, skills, interests, teach_subjects, learn_subjects')
      .neq('email', currentUserEmail)
      .limit(1000);

    if (usersError) {
       console.error("Supabase Users fetch error:", usersError);
       return res.status(500).json({ success: false, message: "Database Error" });
    }

    // Score all users in memory
    const scored = (users || []).map((user) => {
      const result = calculateCompatibilityScore(currentUser, user);
      return {
        _id: user.id, // mapped from 'id' to '_id' to maintain frontend compatibility if needed
        name: user.name,
        skills: user.skills || [],
        interests: user.interests || [],
        teach_subjects: user.teach_subjects || [],
        learn_subjects: user.learn_subjects || [],
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