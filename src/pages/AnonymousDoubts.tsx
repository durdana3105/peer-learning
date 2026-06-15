import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
const MAX_CHARS = 500;
type Doubt = {
  id: string;
  content: string;
  subject: string;
  anonymous: boolean;
  upvotes: number;
  created_at: string;
};

export default function AnonymousDoubts() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("doubts")
      .select("id, content, subject, anonymous, upvotes, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load doubts.");
    } else {
      setDoubts(data ?? []);
    }
    setLoading(false);
  };

  const addDoubt = async () => {
    const trimmedText = text.trim();
    const trimmedSubject = subject.trim();
    if (!trimmedText || !trimmedSubject) return;
   if (text.length > MAX_CHARS) { toast.error(`Doubt exceeds ${MAX_CHARS} character limit.`); return; }
    if (!user) { toast.error("Please log in to post a doubt."); return; }

    setSubmitting(true);
    const { error } = await (supabase as any).from("doubts").insert({
      user_id: anonymous ? null : user.id,
      content: trimmedText,
      subject: trimmedSubject,
      anonymous,
    });

    if (error) {
      toast.error("Failed to post doubt.");
    } else {
      toast.success("Doubt posted!");
      setText("");
      setSubject("");
      setAnonymous(false);
      fetchDoubts();
    }
    setSubmitting(false);
  };

  const upvote = async (id: string) => {
      if (!user) { toast.error("Please log in to upvote."); return; }
    
       // Optimistic UI update
       setDoubts((prev) => prev.map((d) => (d.id === id ? { ...d, upvotes: d.upvotes + 1 } : d)));
    
       const { error } = await (supabase as any)
         .from("doubts")
         .update({ upvotes: doubts.find((d) => d.id === id)!.upvotes + 1 })
         .eq("id", id);
    
       if (error) {
         // Rollback on failure
         setDoubts((prev) => prev.map((d) => (d.id === id ? { ...d, upvotes: d.upvotes - 1 } : d)));
         toast.error("Failed to register upvote.");
       }
    };
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Anonymous Doubt Posting</h1>

      {/* Post a Doubt */}
      <div className="border rounded-xl p-4 mb-8 space-y-3">
    

<div className="relative">

   <span className={`absolute bottom-2 right-2 text-xs select-none ${
     text.length > MAX_CHARS ? "text-red-500 font-semibold"
    : text.length >= MAX_CHARS * 0.9 ? "text-amber-500"
    : "text-slate-400"}`}
  >
     {text.length}/{MAX_CHARS}
   </span>
 </div>
        <input
          className="border p-2 w-full rounded"
          placeholder="Subject Tag (e.g. React, DSA)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={() => setAnonymous(!anonymous)}
          />
          Post Anonymously
        </label>
        <button
          onClick={addDoubt}
          disabled={submitting || !text.trim() || !subject.trim() || text.length > MAX_CHARS}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Doubt"}
        </button>
      </div>

      {/* Doubts List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : doubts.length === 0 ? (
        <p className="text-center text-slate-400">No doubts yet. Be the first to ask!</p>
      ) : (
        <div className="space-y-4">
          {doubts.map((d) => (
            <div key={d.id} className="border p-4 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold">{d.anonymous ? "Anonymous" : "User"}</h2>
                  <p className="mt-1">{d.content}</p>
                  <span className="text-xs text-slate-400">{d.subject}</span>
                </div>
                <button
                  onClick={() => upvote(d.id)}
                  className="ml-4 px-3 py-1 rounded-full text-sm bg-slate-100 hover:bg-blue-100"
                >
                  👍 {d.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}