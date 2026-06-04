import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Circle, Plus, Trophy, Calendar, Map } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type MentorshipMilestonesProps = {
  userId: string;
  isMentor: boolean;
};

export function MentorshipMilestones({ userId, isMentor }: MentorshipMilestonesProps) {
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState("");
  const [newMenteeId, setNewMenteeId] = useState("");
  const [isCreatingPath, setIsCreatingPath] = useState(false);

  const fetchPaths = async () => {
    try {
      const { data, error } = await supabase
        .from("mentorship_paths")
        .select(`
          *,
          mentorship_milestones (*)
        `)
        .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaths(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load mentorship paths");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, [userId]);

  const createPath = async () => {
    if (!newGoal || !newMenteeId) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const { error } = await supabase.from("mentorship_paths").insert({
        mentor_id: userId,
        mentee_id: newMenteeId,
        goal: newGoal,
      });
      if (error) throw error;
      toast.success("Mentorship path created!");
      setIsCreatingPath(false);
      setNewGoal("");
      setNewMenteeId("");
      fetchPaths();
    } catch (err: any) {
      toast.error("Failed to create path: " + err.message);
    }
  };

  const addMilestone = async (pathId: string, title: string) => {
    if (!title) return;
    try {
      const { error } = await supabase.from("mentorship_milestones").insert({
        path_id: pathId,
        title,
      });
      if (error) throw error;
      fetchPaths();
      toast.success("Milestone added!");
    } catch (err: any) {
      toast.error("Failed to add milestone: " + err.message);
    }
  };

  const toggleMilestone = async (milestoneId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from("mentorship_milestones")
        .update({ is_completed: !isCompleted })
        .eq("id", milestoneId);
      if (error) throw error;
      fetchPaths();
    } catch (err: any) {
      toast.error("Failed to update milestone: " + err.message);
    }
  };

  if (loading) return <div className="text-gray-400">Loading mentorship paths...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Map className="text-cyan-400" />
          Mentorship Roadmaps
        </h2>
        {isMentor && (
          <Dialog open={isCreatingPath} onOpenChange={setIsCreatingPath}>
            <DialogTrigger asChild>
              <button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90">
                <Plus size={16} /> New Roadmap
              </button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Create Mentorship Roadmap</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Mentee User ID</label>
                  <input
                    type="text"
                    value={newMenteeId}
                    onChange={(e) => setNewMenteeId(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white"
                    placeholder="UUID of the mentee"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Learning Goal</label>
                  <input
                    type="text"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white"
                    placeholder="e.g. Become a Full-Stack Developer"
                  />
                </div>
                <button
                  onClick={createPath}
                  className="w-full bg-cyan-500 text-white font-bold py-2.5 rounded-lg hover:bg-cyan-600 transition"
                >
                  Create Roadmap
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {paths.length === 0 ? (
        <p className="text-slate-400">No active mentorship roadmaps found.</p>
      ) : (
        <div className="grid gap-6">
          {paths.map((path) => {
            const milestones = path.mentorship_milestones || [];
            const completedCount = milestones.filter((m: any) => m.is_completed).length;
            const progress = milestones.length === 0 ? 0 : Math.round((completedCount / milestones.length) * 100);
            const isFullyCompleted = milestones.length > 0 && progress === 100;

            return (
              <div key={path.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                {isFullyCompleted && (
                  <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-400 px-4 py-1 rounded-bl-xl font-semibold flex items-center gap-2 text-sm">
                    <Trophy size={16} /> Completed
                  </div>
                )}
                
                <h3 className="text-lg font-bold text-white mb-2">{path.goal}</h3>
                <p className="text-sm text-slate-400 mb-4">
                  {isMentor ? "Mentee ID" : "Mentor ID"}: {isMentor ? path.mentee_id : path.mentor_id}
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-cyan-400 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Milestones List */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300">Milestones</h4>
                  {milestones.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No milestones set yet.</p>
                  ) : (
                    milestones.map((m: any) => (
                      <div key={m.id} className="flex items-start gap-3 group">
                        <button
                          onClick={() => toggleMilestone(m.id, m.is_completed)}
                          className={`mt-0.5 transition-colors ${m.is_completed ? "text-green-400" : "text-slate-600 hover:text-cyan-400"}`}
                        >
                          {m.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </button>
                        <div className={`flex-1 ${m.is_completed ? "text-slate-500 line-through" : "text-slate-200"}`}>
                          <p className="text-sm">{m.title}</p>
                          {m.due_date && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar size={12} /> {new Date(m.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Milestone Input (Mentor only) */}
                  {isMentor && (
                    <div className="pt-3 mt-3 border-t border-slate-800">
                      <input
                        type="text"
                        placeholder="Add a new milestone (press Enter)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addMilestone(path.id, e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
