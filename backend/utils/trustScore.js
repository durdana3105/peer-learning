import { getSupabaseAdmin } from "./supabase.js";

/**
 * Calculates a weighted moving average trust score.
 * Formula:
 *   weight = e^(-ageInDays / 90)
 *   weightedScore = Σ(rating × weight) / Σ(weight)
 *   confidenceFactor = min(totalReviews / 10, 1)
 *   trustScore = weightedScore × confidenceFactor
 * Rounded to 1 decimal place and clamped between 0 and 5.
 * 
 * @param {Array} reviews List of reviews with rating and created_at
 * @returns {number} The calculated trust score
 */
export const calculateTrustScore = (reviews) => {
  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return 0;
  }

  let weightedScoreSum = 0;
  let weightSum = 0;
  const now = Date.now();

  reviews.forEach((review) => {
    const createdAtTime = new Date(review.created_at || review.createdAt).getTime();
    const ageInMs = now - createdAtTime;
    const ageInDays = Math.max(0, ageInMs / (1000 * 60 * 60 * 24));
    const weight = Math.exp(-ageInDays / 90);

    weightedScoreSum += review.rating * weight;
    weightSum += weight;
  });

  const weightedScore = weightSum > 0 ? (weightedScoreSum / weightSum) : 0;
  const confidenceFactor = Math.min(totalReviews / 10, 1);
  const trustScore = weightedScore * confidenceFactor;

  // Round to one decimal place
  const rounded = Math.round(trustScore * 10) / 10;

  // Clamp 0 to 5
  return Math.max(0, Math.min(5, rounded));
};

/**
 * Automatically assigns mentor badges based on trust metrics.
 * 
 * @param {number} score Trust score
 * @param {number} totalReviews Total review count
 * @returns {string|null} The badge name or null
 */
export const calculateMentorBadge = (score, totalReviews) => {
  if (score >= 4.5 && totalReviews >= 20) {
    return "Top Mentor";
  }
  if (score >= 4.0 && totalReviews >= 10) {
    return "Trusted Peer";
  }
  if (score >= 4.0 && totalReviews >= 5) {
    return "Rising Mentor";
  }
  return null;
};

/**
 * Recalculates all trust metrics for a user and updates their profile in the database.
 * 
 * @param {string} userId The profile user ID to update
 * @returns {Promise<object>} The updated metrics
 */
export const calculateTrustMetrics = async (userId) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase admin client not initialized.");
  }

  // Fetch all reviews for this user
  const { data: reviews, error } = await supabase
    .from("session_reviews")
    .select("rating, tags, created_at")
    .eq("reviewee_id", userId);

  if (error) {
    throw new Error(`Failed to fetch reviews: ${error.message}`);
  }

  const totalReviews = reviews ? reviews.length : 0;

  let averageRating = 0;
  let positiveTagsCount = 0;
  let negativeTagsCount = 0;
  let trustScore = 0;
  let mentorBadge = null;

  if (totalReviews > 0) {
    // Calculate average rating
    const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    averageRating = Math.round((ratingSum / totalReviews) * 10) / 10;

    // Positive/negative tags
    const positiveTagsList = ["Clear Explanations", "Knowledgeable", "Patient", "Friendly", "Responsive"];
    const negativeTagsList = ["Unresponsive", "Poor Communication", "Technical Issues", "Misleading Skills"];

    reviews.forEach((r) => {
      const tags = r.tags || [];
      tags.forEach((tag) => {
        if (positiveTagsList.includes(tag)) {
          positiveTagsCount++;
        } else if (negativeTagsList.includes(tag)) {
          negativeTagsCount++;
        }
      });
    });

    // Calculate trust score
    trustScore = calculateTrustScore(reviews);

    // Calculate mentor badge
    mentorBadge = calculateMentorBadge(trustScore, totalReviews);
  }

  // Update profile in the database only if this calculation is newer/has more reviews
  let updateQuery = supabase
    .from("profiles")
    .update({
      trust_score: trustScore,
      total_reviews: totalReviews,
      average_rating: averageRating,
      positive_tags_count: positiveTagsCount,
      negative_tags_count: negativeTagsCount,
      mentor_badge: mentorBadge,
    })
    .eq("id", userId);

  if (totalReviews > 0) {
    updateQuery = updateQuery.lt("total_reviews", totalReviews);
  } else {
    updateQuery = updateQuery.eq("total_reviews", 0);
  }

  const { error: updateError } = await updateQuery;

  if (updateError) {
    throw new Error(`Failed to update profile metrics: ${updateError.message}`);
  }

  return {
    trustScore,
    totalReviews,
    averageRating,
    positiveTagsCount,
    negativeTagsCount,
    mentorBadge,
  };
};
