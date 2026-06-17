import { getSupabaseAdmin } from "../utils/supabase.js";
import { getRelatedSkills } from "../utils/skillGraph.js";

// 📚 Calculate compatibility score purely for textual reasons now
const calculateCompatibilityScore = (currentUser, otherUser) => {
  let score = 0;
  const reasons = [];

  const currentSkills = currentUser.skills || [];
  const otherSkills = otherUser.skills || [];
  const currentInterests = currentUser.interests || [];
  const otherInterests = otherUser.interests || [];
  const currentTeach = currentUser.teach_subjects || [];
  const otherTeach = otherUser.teach_subjects || [];
  const currentLearn = currentUser.learn_subjects || [];
  const otherLearn = otherUser.learn_subjects || [];

  const commonSkills = currentSkills.filter((skill) => otherSkills.includes(skill));
  if (commonSkills.length > 0) {
    score += commonSkills.length * 10;
    reasons.push(`You both share ${commonSkills.slice(0, 2).join(", ")} skills.`);
  }

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

  const commonInterests = currentInterests.filter((interest) => otherInterests.includes(interest));
  if (commonInterests.length > 0) {
    score += commonInterests.length * 3;
    reasons.push(`Shared interests in ${commonInterests.slice(0, 2).join(", ")}.`);
  }

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

export const getRecommendedPartners = async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, message: "Supabase client not configured" });
    }

    const currentUserId = req.user.id;
    const currentUserEmail = req.user.email;
    
    // Fetch current user from Supabase profiles
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('profiles')
      .select('skills, interests, teach_subjects, learn_subjects')
      .eq('id', currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || PAGE_SIZE));
    const skip = (page - 1) * limit;

    // Calculate related skills
    const currentSkills = currentUser.skills || [];
    let allRelatedSkills = [];
    currentSkills.forEach((skill) => {
      const related = getRelatedSkills(skill) || [];
      allRelatedSkills.push(...related);
    });
    allRelatedSkills = [...new Set(allRelatedSkills)];

    // Fetch matching users natively via Supabase RPC (O(N) executed in C++ Postgres core, paginated)
    const { data: matchedUsers, error: usersError } = await supabaseAdmin.rpc('match_users', {
      target_email: currentUserEmail,
      target_skills: currentSkills,
      target_related_skills: allRelatedSkills,
      target_interests: currentUser.interests || [],
      target_teach: currentUser.teach_subjects || [],
      target_learn: currentUser.learn_subjects || [],
      page_limit: limit,
      page_offset: skip
    });

    if (usersError) {
       console.error("Supabase RPC match_users error:", usersError);
       return res.status(500).json({ success: false, message: "Database Error" });
    }

    // Now format the 20 returned users with reasons
    const recommendations = (matchedUsers || []).map((user) => {
      // We pass through calculateCompatibilityScore ONLY to get the rich reason string
      // The score is already calculated perfectly by the database.
      const result = calculateCompatibilityScore(currentUser, user);
      return {
        _id: user.id,
        name: user.name,
        skills: user.skills || [],
        interests: user.interests || [],
        teach_subjects: user.teach_subjects || [],
        learn_subjects: user.learn_subjects || [],
        compatibilityScore: user.compatibility_score, // Trust the database score
        reason: result.reasons[0] || "You have similar learning interests and compatible skills.",
      };
    });

    // In a real paginated RPC, getting exact total Count requires a separate count query. 
    // We'll estimate or just provide length for now since counting 1M rows can also be slow.
    res.status(200).json({
      success: true,
      count: recommendations.length,
      total: recommendations.length > 0 ? skip + limit + 1 : skip, // Rough pagination cursor hack
      page,
      totalPages: recommendations.length === limit ? page + 1 : page,
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSupabaseDiscover = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search || "";
    const filter = req.query.filter || "All";
    const page = Math.min(Math.max(1, parseInt(req.query.page, 10) || 1), 1000);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 100), 100);
    const skip = (page - 1) * limit;
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch only the columns used for compatibility scoring so we avoid
    // pulling large, unused fields (e.g. bio, avatar_url) across the wire
    // for every discover request.
    const { data: currentUser, error: meError } = await supabaseAdmin
      .from("profiles")
      .select("skills, learning_goals, interests, learn_subjects, teach_subjects, learning_style, preferred_language, timezone")
      .eq("id", userId)
      .single();

    if (meError || !currentUser) {
      return res.status(404).json({ success: false, message: "User profile not found" });
    }

    let query = supabaseAdmin
      .from("profiles")
      .select("id, name, skills, interests, learning_goals, teach_subjects, learn_subjects, learning_style, preferred_language, timezone")
      .neq("id", userId)
      .range(skip, skip + limit - 1);

    if (search.trim()) {
      // Keep only alphanumeric chars, spaces, and hyphens.
      // Crucially, the underscore (_) must be removed even though it is a JS
      // \w character, because in SQL LIKE/ILIKE patterns _ is a single-char
      // wildcard. Leaving it in would let clients pass a string of underscores
      // to match any row, turning every search into a near-full-table scan.
      const safeSearch = search.trim().replace(/[^a-zA-Z0-9\s-]/g, "");
      if (safeSearch) {
        const pattern = `%${safeSearch}%`;
        query = query.or(`name.ilike."${pattern}",skills.ilike."${pattern}"`);
      }
    }

    if (filter !== "All") {
      // Sanitize the filter value the same way as search to prevent LIKE
      // wildcard injection via the filter query parameter.
      const safeFilter = filter.replace(/[^a-zA-Z0-9\s-]/g, "");
      if (safeFilter) {
        query = query.ilike("skills", `%${safeFilter}%`);
      }
    }

    const { data: peers, error: peersError } = await query;

    if (peersError || !peers) {
      return res.status(500).json({ success: false, message: "Failed to fetch peers" });
    }

    const parseArray = (val) => {
      if (Array.isArray(val)) return val.map((s) => s.toLowerCase().trim());
      if (typeof val === "string") return val.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      return [];
    };

    const mySkills = parseArray(currentUser.skills);
    const myGoals = parseArray(currentUser.learning_goals);

    let matched = peers.map((p) => {
      const userSkills = parseArray(p.skills);
      const userGoals = parseArray(p.learning_goals);

      let score = 0;
      const PRIMARY_WEIGHT = 40;
      const SECONDARY_WEIGHT = 30;
      const ALIGNMENT_WEIGHT = 10;

      const maxPossibleScore =
        (myGoals.length > 0 ? PRIMARY_WEIGHT : 0) +
        (mySkills.length > 0 ? SECONDARY_WEIGHT : 0) +
        (myGoals.length > 0 ? ALIGNMENT_WEIGHT : 0) || 1;

      const primaryMatches = userSkills.filter((skill) => myGoals.includes(skill)).length;
      if (primaryMatches > 0 && myGoals.length > 0) {
        score += (primaryMatches / myGoals.length) * PRIMARY_WEIGHT;
      }

      const reciprocalMatches = userGoals.filter((goal) => mySkills.includes(goal)).length;
      if (reciprocalMatches > 0 && mySkills.length > 0) {
        score += (reciprocalMatches / mySkills.length) * SECONDARY_WEIGHT;
      }

      const studyBuddyMatches = userGoals.filter((goal) => myGoals.includes(goal)).length;
      if (studyBuddyMatches > 0 && myGoals.length > 0) {
        score += (studyBuddyMatches / myGoals.length) * ALIGNMENT_WEIGHT;
      }

      const percentage = Math.min(Math.round((score / maxPossibleScore) * 100), 100);

      const teachOverlap   = myGoals.filter((s) => (p.teach_subjects || []).includes(s)).length;
      const learnOverlap   = mySkills.filter((s) => (p.learn_subjects || []).includes(s)).length;
      const interestOverlap = (currentUser.interests || []).filter((s) => (p.interests || []).includes(s)).length;
      const hasBaseOverlap = teachOverlap + learnOverlap + interestOverlap > 0;
      const learningStyleMatch = hasBaseOverlap && currentUser.learning_style && p.learning_style && currentUser.learning_style === p.learning_style ? 15 : 0;
      const languageMatch      = hasBaseOverlap && currentUser.preferred_language && p.preferred_language && currentUser.preferred_language === p.preferred_language ? 10 : 0;
      const timezoneMatch      = hasBaseOverlap && currentUser.timezone && p.timezone && currentUser.timezone === p.timezone ? 10 : 0;

      const maxExtra = Math.max((currentUser.learn_subjects || []).length + (currentUser.teach_subjects || []).length + (currentUser.interests || []).length, 1);
      const baseScore = ((teachOverlap + learnOverlap + interestOverlap) / maxExtra) * 65;
      const matchScore = Math.min(Math.round(baseScore + learningStyleMatch + languageMatch + timezoneMatch), 100);

      const finalScore = Math.max(percentage, matchScore);

      return {
        ...p,
        score: finalScore,
      };
    });

    if (!search && filter === "All") {
      matched = matched.filter((u) => u.score > 0);
    }

    matched.sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      recommendations: matched.slice(0, limit),
    });
  } catch (error) {
    console.error("Supabase Discover Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
