import { getSupabaseAdmin } from "../utils/supabase.js";
import { calculateTrustMetrics } from "../utils/trustScore.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Submits a peer review for a completed learning session.
 */
export const submitReview = async (req, res, next) => {
  try {
    const reviewerId = req.user.id;
    const { sessionId, rating, tags, comment } = req.body;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return next(new HttpError(500, "Supabase client not initialized"));
    }

    // 1. Fetch the session details
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) {
      return next(new HttpError(500, `Database error fetching session: ${sessionError.message}`));
    }
    if (!session) {
      return next(new HttpError(404, "Session not found"));
    }

    // 2. Validate session status (must be 'ended' or 'completed')
    const allowedStatuses = ["ended", "completed"];
    if (!allowedStatuses.includes(session.status?.toLowerCase())) {
      return next(new HttpError(400, `Cannot review a session with status: ${session.status}`));
    }

    // 3. Verify reviewer participated in the session
    const isMentor = session.mentor_id === reviewerId;
    let isLearner = false;

    // Check session_participants to see if reviewer is the learner
    const { data: participation, error: partError } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", reviewerId)
      .maybeSingle();

    if (partError) {
      return next(new HttpError(500, `Database error checking participation: ${partError.message}`));
    }
    if (participation) {
      isLearner = true;
    }

    if (!isMentor && !isLearner) {
      return next(new HttpError(403, "You did not participate in this session"));
    }

    // 4. Determine the reviewee
    let revieweeId = null;
    if (isMentor) {
      // Reviewer is mentor, reviewee is the learner
      // Try to get from student_id / learner_id
      revieweeId = session.student_id || session.learner_id;

      if (!revieweeId) {
        // Fallback: fetch participants that are not the mentor
        const { data: participants, error: pError } = await supabase
          .from("session_participants")
          .select("user_id")
          .eq("session_id", sessionId);

        if (pError) {
          return next(new HttpError(500, `Database error fetching participants: ${pError.message}`));
        }
        
        const learnerPart = participants?.find((p) => p.user_id !== reviewerId);
        if (learnerPart) {
          revieweeId = learnerPart.user_id;
        }
      }
    } else {
      // Reviewer is learner, reviewee is the mentor
      revieweeId = session.mentor_id;
    }

    if (!revieweeId) {
      return next(new HttpError(400, "Could not determine the other participant for this session"));
    }

    // 5. Prevent self-review
    if (reviewerId === revieweeId) {
      return next(new HttpError(400, "You cannot review yourself"));
    }

    // 6. Prevent duplicate reviews (unique constraint session_id + reviewer_id)
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from("session_reviews")
      .select("id")
      .eq("session_id", sessionId)
      .eq("reviewer_id", reviewerId)
      .maybeSingle();

    if (reviewCheckError) {
      return next(new HttpError(500, `Database error checking existing review: ${reviewCheckError.message}`));
    }
    if (existingReview) {
      return next(new HttpError(409, "You have already submitted a review for this session"));
    }

    // 7. Sanitize comment
    const sanitizedComment = comment ? comment.trim().slice(0, 300) : null;

    // 8. Insert the review
    const { data: newReview, error: insertError } = await supabase
      .from("session_reviews")
      .insert({
        session_id: sessionId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        rating,
        tags: tags || [],
        comment: sanitizedComment,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505" || insertError.message?.includes("unique constraint") || insertError.message?.includes("duplicate key")) {
        return next(new HttpError(409, "You have already submitted a review for this session"));
      }
      return next(new HttpError(500, `Database error inserting review: ${insertError.message}`));
    }

    // 9. Recalculate metrics for reviewee
    try {
      await calculateTrustMetrics(revieweeId);
    } catch (metricError) {
      console.error(`Failed to recalculate trust metrics for user ${revieweeId}:`, metricError);
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: newReview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches recent reviews for a specific user profile.
 */
export const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return next(new HttpError(500, "Supabase client not initialized"));
    }

    // Fetch up to 20 reviews ordered by created_at DESC
    const { data: reviews, error } = await supabase
      .from("session_reviews")
      .select("id, rating, tags, comment, created_at, reviewer_id")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return next(new HttpError(500, `Database error fetching reviews: ${error.message}`));
    }

    if (!reviews || reviews.length === 0) {
      return res.json([]);
    }

    // Fetch reviewer profiles
    const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", reviewerIds);

    if (profileError) {
      return next(new HttpError(500, `Database error fetching reviewer profiles: ${profileError.message}`));
    }

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const formattedReviews = reviews.map((r) => {
      const prof = profileMap.get(r.reviewer_id);
      return {
        id: r.id,
        rating: r.rating,
        tags: r.tags || [],
        comment: r.comment || "",
        created_at: r.created_at,
        reviewerName: prof?.name || "Anonymous",
        reviewerAvatar: prof?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${prof?.name || r.reviewer_id}`,
      };
    });

    res.json(formattedReviews);
  } catch (error) {
    next(error);
  }
};

/**
 * Fetches trust metrics for a specific user profile.
 */
export const getUserTrustMetrics = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return next(new HttpError(500, "Supabase client not initialized"));
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("trust_score, average_rating, total_reviews, positive_tags_count, negative_tags_count, mentor_badge")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return next(new HttpError(500, `Database error fetching profile: ${error.message}`));
    }
    if (!profile) {
      return next(new HttpError(404, "Profile not found"));
    }

    res.json({
      trustScore: profile.trust_score || 0,
      averageRating: profile.average_rating || 0,
      totalReviews: profile.total_reviews || 0,
      positiveTagsCount: profile.positive_tags_count || 0,
      negativeTagsCount: profile.negative_tags_count || 0,
      mentorBadge: profile.mentor_badge,
    });
  } catch (error) {
    next(error);
  }
};
