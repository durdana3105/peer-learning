import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, User, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function PeerReviewDashboard() {
  const { user } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch pending requests from others
      const { data: pending } = await supabase
        .from('peer_submissions')
        .select('*, profiles(name, avatar_url)')
        .neq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch my submissions
      const { data: mine } = await supabase
        .from('peer_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch my reviews
      const { data: reviews } = await supabase
        .from('peer_reviews')
        .select('*, peer_submissions(title, is_anonymous, profiles(name))')
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false });

      if (pending) setPendingSubmissions(pending);
      if (mine) setMySubmissions(mine);
      if (reviews) setMyReviews(reviews);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  const renderSubmissionCard = (sub: any, isMine: boolean = false) => {
    const isAnon = sub.is_anonymous;
    const authorName = isAnon ? "Anonymous Learner" : (sub.profiles?.name || "Unknown");
    const avatar = isAnon ? `https://api.dicebear.com/9.x/bottts/svg?seed=${sub.id}` : (sub.profiles?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${authorName}`);

    return (
      <motion.div 
        key={sub.id}
        whileHover={{ scale: 1.01 }}
        className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {!isMine && (
              <img src={avatar} alt={authorName} className="h-10 w-10 rounded-full bg-slate-800" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{sub.title}</h3>
              {!isMine && <p className="text-sm text-slate-400">by {authorName}</p>}
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${sub.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
            {sub.status === 'pending' ? <><Clock className="mr-1 inline h-3 w-3" /> Pending</> : <><CheckCircle className="mr-1 inline h-3 w-3" /> Reviewed</>}
          </span>
        </div>
        
        <p className="line-clamp-2 text-sm text-slate-300">{sub.description}</p>
        
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">{new Date(sub.created_at).toLocaleDateString()}</span>
          <Link to={`/peer-review/${sub.id}`}>
            <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              {isMine ? "View Feedback" : "Review Submission"}
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText className="text-cyan-400" /> Peer Review Hub
          </h1>
          <p className="mt-2 text-slate-400">Request feedback on your projects, essays, and code snippets, or review others' work to help them learn.</p>
        </div>
        <Link to="/peer-review/new">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold shadow-lg hover:from-cyan-400 hover:to-blue-500">
            Submit for Review
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="mine">My Submissions</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.length === 0 ? (
             <div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center backdrop-blur-md">
               <FileText className="mx-auto mb-3 h-10 w-10 text-slate-500" />
               <p className="text-lg font-medium text-slate-300">No pending requests</p>
               <p className="text-sm text-slate-500">You're all caught up! Check back later for more peer review requests.</p>
             </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingSubmissions.map(sub => renderSubmissionCard(sub, false))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          {mySubmissions.length === 0 ? (
             <div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center backdrop-blur-md">
               <User className="mx-auto mb-3 h-10 w-10 text-slate-500" />
               <p className="text-lg font-medium text-slate-300">You haven't submitted anything yet</p>
               <Link to="/peer-review/new">
                  <Button variant="link" className="text-cyan-400">Submit your first project</Button>
               </Link>
             </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {mySubmissions.map(sub => renderSubmissionCard(sub, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {myReviews.length === 0 ? (
             <div className="rounded-xl border border-white/5 bg-white/5 p-8 text-center backdrop-blur-md">
               <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-500" />
               <p className="text-lg font-medium text-slate-300">You haven't reviewed anything yet</p>
               <p className="text-sm text-slate-500">Help a peer out by reviewing a pending request.</p>
             </div>
          ) : (
            <div className="grid gap-4">
              {myReviews.map(review => (
                <div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Re: {review.peer_submissions?.title}</h3>
                    {review.rating ? (
                      <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
                        Helpfulness: {review.rating}/5
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Not rated yet</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-300 bg-black/20 p-3 rounded-lg border border-white/5">{review.feedback}</p>
                  <div className="mt-3 text-right">
                    <Link to={`/peer-review/${review.submission_id}`}>
                      <Button variant="link" size="sm" className="text-cyan-400">View Full Submission</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
