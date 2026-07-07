import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getSafePeerReviewSubmissionUrl } from "@/utils/peerReviewUrl";
import { ArrowLeft, Send, Star, ExternalLink, Code } from "lucide-react";

export default function ReviewSubmission() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [submission, setSubmission] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;

    const fetchDetails = async () => {
      setLoading(true);

      const { data: subData, error: subError } = await supabase
        .from('peer_submissions')
        .select('*, profiles(name, avatar_url)')
        .eq('id', id)
        .single();

      if (subError || !subData) {
        toast({ title: "Not Found", description: "Submission not found or deleted.", variant: "destructive" });
        navigate("/peer-review");
        return;
      }

      setSubmission(subData);

      const { data: reviewData } = await supabase
        .from('peer_reviews')
        .select('*, profiles(name, avatar_url)')
        .eq('submission_id', id)
        .order('created_at', { ascending: true });

      if (reviewData) setReviews(reviewData);

      setLoading(false);
    };

    fetchDetails();
  }, [id, user, navigate, toast]);

  const handleFeedbackSubmit = async () => {
    if (!user || !id || !feedback.trim()) return;

    setSubmitting(true);

    // Fixes #1675: previously this did two separate calls — an insert into
    // peer_reviews, then a client-side update of peer_submissions.status —
    // and the status update's error was never checked. That update also
    // silently failed under RLS because only the submission owner (not the
    // reviewer) was allowed to update peer_submissions, so a submission
    // could have reviews and still show as "pending".
    //
    // Now both steps happen atomically inside a single SECURITY DEFINER RPC,
    // and any failure (including a failed status transition) is surfaced
    // here instead of being ignored.
    const { data: reviewRow, error: rpcError } = await supabase.rpc(
      "submit_peer_review",
      {
        p_submission_id: id,
        p_feedback: feedback,
      }
    );

    if (rpcError || !reviewRow) {
      toast({
        title: "Error",
        description: rpcError?.message || "Could not submit feedback.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Re-fetch the review with its joined profile, and the submission's
    // current status, so the UI reflects exactly what the RPC committed.
    const [{ data: reviewWithProfile, error: reviewFetchError }, { data: refreshedSubmission, error: submissionFetchError }] =
      await Promise.all([
        supabase
          .from("peer_reviews")
          .select("*, profiles(name, avatar_url)")
          .eq("id", reviewRow.id)
          .single(),
        supabase
          .from("peer_submissions")
          .select("status")
          .eq("id", id)
          .single(),
      ]);

    if (reviewFetchError) {
      // The review was created successfully (the RPC returned it); this is
      // just a best-effort refresh, so fall back to the RPC's own row
      // instead of blocking the success state on a secondary read failing.
      console.error("Failed to refresh review with profile:", reviewFetchError);
    }

    if (submissionFetchError) {
      console.error("Failed to refresh submission status:", submissionFetchError);
    }

    toast({ title: "Success", description: "Feedback submitted successfully." });
    setReviews((prev) => [...prev, reviewWithProfile ?? reviewRow]);
    setFeedback("");

    if (refreshedSubmission?.status) {
      setSubmission((prev: any) => ({ ...prev, status: refreshedSubmission.status }));
    }

    setSubmitting(false);
  };

  const handleRateReview = async (reviewId: string, ratingValue: number) => {
    setRatingLoading(reviewId);
    
    const { error } = await supabase
      .from('peer_reviews')
      .update({ rating: ratingValue })
      .eq('id', reviewId);

    if (error) {
      toast({ title: "Error", description: "Could not save rating.", variant: "destructive" });
    } else {
      toast({ title: "Rated", description: "Thanks for rating the feedback!" });
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, rating: ratingValue } : r));
    }
    
    setRatingLoading(null);
  };

  if (loading || !submission) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const isOwner = submission.user_id === user?.id;
  const isAnon = submission.is_anonymous;
  const authorName = isAnon ? "Anonymous Learner" : (submission.profiles?.name || "Unknown");
  const avatar = isAnon ? `https://api.dicebear.com/9.x/bottts/svg?seed=${submission.id}` : (submission.profiles?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${authorName}`);
  const contentUrlText = typeof submission.content_url === "string" ? submission.content_url.trim() : "";
  const safeContentUrl = getSafePeerReviewSubmissionUrl(submission.content_url);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link to="/peer-review" className="mb-6 inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Submission Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#050816]/50 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
              <img src={avatar} alt={authorName} className="h-12 w-12 rounded-full bg-slate-800" />
              <div>
                <h1 className="text-2xl font-bold text-white">{submission.title}</h1>
                <p className="text-sm text-slate-400">Submitted by {authorName} on {new Date(submission.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {submission.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Context / What to review</h3>
                <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{submission.description}</p>
              </div>
            )}

            {contentUrlText && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Link</h3>
                {safeContentUrl ? (
                  <a href={safeContentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-cyan-400 hover:text-cyan-300">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {contentUrlText}
                  </a>
                ) : (
                  <p className="text-slate-200 break-all">{contentUrlText}</p>
                )}
              </div>
            )}

            {submission.content && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center"><Code className="mr-2 h-4 w-4" /> Content</h3>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 overflow-x-auto">
                  <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap">{submission.content}</pre>
                </div>
              </div>
            )}
          </div>
          
          {/* Feedback Form (Only for non-owners) */}
          {!isOwner && (
            <div className="rounded-2xl border border-white/10 bg-[#050816]/50 p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-xl font-bold text-white">Provide Feedback</h2>
              <Textarea 
                placeholder="Write your constructive feedback here..." 
                className="mb-4 bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[120px]"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button 
                onClick={handleFeedbackSubmit} 
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 font-semibold shadow-lg hover:from-emerald-400 hover:to-green-500"
                disabled={submitting || !feedback.trim()}
              >
                {submitting ? "Submitting..." : <><Send className="mr-2 h-4 w-4" /> Submit Feedback</>}
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Reviews */}
        <div className="md:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Reviews ({reviews.length})
          </h2>
          
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/5 p-6 text-center backdrop-blur-md">
              <p className="text-slate-400">No reviews yet.</p>
              {!isOwner && <p className="text-sm text-slate-500 mt-2">Be the first to provide feedback!</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={review.profiles?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${review.profiles?.name}`} alt="Reviewer" className="h-8 w-8 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-white">{review.profiles?.name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-300 bg-black/20 p-3 rounded-lg border border-white/5 mb-3">{review.feedback}</p>
                  
                  {/* Rating Section */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-1">
                    <span className="text-xs text-slate-400">Helpfulness</span>
                    {isOwner ? (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            disabled={ratingLoading === review.id}
                            onClick={() => handleRateReview(review.id, star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star 
                              className={`h-4 w-4 ${review.rating && review.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600 hover:text-yellow-400'}`} 
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-1">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <Star 
                             key={star} 
                             className={`h-4 w-4 ${review.rating && review.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`} 
                           />
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}