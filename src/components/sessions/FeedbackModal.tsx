import { useState, useEffect } from "react";
import { Star, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";
import { toast } from "sonner";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
  onSubmitSuccess?: () => void;
}

const POSITIVE_TAGS = [
  "Clear Explanations",
  "Knowledgeable",
  "Patient",
  "Friendly",
  "Responsive",
];

const NEUTRAL_TAGS = ["Average Experience"];

const NEGATIVE_TAGS = [
  "Unresponsive",
  "Poor Communication",
  "Technical Issues",
  "Misleading Skills",
];

export function FeedbackModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  onSubmitSuccess,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setSelectedTags([]);
      setComment("");
      setIsSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a star rating.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMessage("You must be logged in to submit a review.");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sessionId,
          rating,
          tags: selectedTags,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setIsSuccess(true);
      toast.success("Thank you for your feedback! ⭐");
      setTimeout(() => {
        onClose();
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/95 text-white shadow-2xl p-6 backdrop-blur-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="h-16 w-16 text-emerald-400 mb-4 animate-bounce" />
              <h3 className="text-2xl font-black mb-2">Review Submitted!</h3>
              <p className="text-gray-400">Your feedback has been successfully processed.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 id="modal-title" className="text-2xl font-bold tracking-tight mb-1">
                  Rate Session Peer
                </h3>
                <p className="text-sm text-slate-400">
                  Leave feedback for: <span className="text-cyan-400 font-medium">{sessionTitle}</span>
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Star Rating */}
              <div 
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5"
                role="group"
                aria-label="Star Rating Selection"
              >
                <span className="text-sm text-gray-400 font-semibold">How was your session?</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform active:scale-95"
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        aria-pressed={isSelected}
                      >
                        <Star
                          size={36}
                          className={`transition-colors ${
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-600"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Select Tags */}
              <div className="space-y-3">
                <span className="text-sm text-gray-400 font-semibold block">Select Feedback Tags</span>

                {/* Positive Tags */}
                <div className="space-y-1.5" role="group" aria-label="Positive feedback tags">
                  <span className="text-xs text-emerald-400 font-medium">Positive</span>
                  <div className="flex flex-wrap gap-2">
                    {POSITIVE_TAGS.map((tag) => {
                      const selected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                          aria-pressed={selected}
                          aria-label={`Feedback tag: ${tag}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Neutral Tags */}
                <div className="space-y-1.5" role="group" aria-label="Neutral feedback tags">
                  <span className="text-xs text-amber-400 font-medium">Neutral</span>
                  <div className="flex flex-wrap gap-2">
                    {NEUTRAL_TAGS.map((tag) => {
                      const selected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-amber-500/20 border-amber-400 text-amber-200"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                          aria-pressed={selected}
                          aria-label={`Feedback tag: ${tag}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Negative Tags */}
                <div className="space-y-1.5" role="group" aria-label="Negative feedback tags">
                  <span className="text-xs text-rose-400 font-medium">Negative</span>
                  <div className="flex flex-wrap gap-2">
                    {NEGATIVE_TAGS.map((tag) => {
                      const selected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                            selected
                              ? "bg-rose-500/20 border-rose-400 text-rose-200"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                          aria-pressed={selected}
                          aria-label={`Feedback tag: ${tag}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Comment Field */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <label htmlFor="feedback-comment" className="font-semibold">Optional Comment</label>
                  <span>{comment.length} / 300</span>
                </div>
                <textarea
                  id="feedback-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 300))}
                  placeholder="Share details about your learning experience..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold hover:opacity-90 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
