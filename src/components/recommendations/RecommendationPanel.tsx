import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CalendarClock,
  GraduationCap,
  RefreshCw,
  Sparkles,
  BookOpen,
  Target,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  buildMentorScore,
  buildPracticeRecommendations,
  buildResourceScore,
  buildSessionScore,
  inferTopics,
  type RecommendationProfile,
  type RecommendationTopic,
} from "@/lib/recommendations";
import { useResources } from "@/hooks/useResources";

type MentorCandidate = RecommendationProfile & {
  avatar_url: string | null;
  badges: string[] | null;
  is_mentor: boolean;
};

type RecommendationPanelProps = {
  profile: RecommendationProfile | null;
  sessions: Array<{
    id: number;
    title: string | null;
    description: string | null;
    scheduled_at: string | null;
    status: string | null;
    mentor_id: string | null;
    student_id: string | null;
  }>;
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const getTopicLabels = (topics: RecommendationTopic[]) => topics.slice(0, 4).map((topic) => topic.topic);

const RecommendationPanel = ({ profile, sessions }: RecommendationPanelProps) => {
  const navigate = useNavigate();

  const [mentors, setMentors] = useState<MentorCandidate[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  const {
    resources,
    loading: resourcesLoading,
    refetch: refetchResources,
  } = useResources();

  useEffect(() => {
    const fetchMentors = async () => {
      setLoadingMentors(true);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, bio, avatar_url, skills, interests, teach_subjects, learn_subjects, rating, sessions_completed, points, streak, badges, is_mentor",
        )
        .eq("is_mentor", true)
        .neq("id", profile?.id || "")
        .order("points", { ascending: false })
        .limit(50);

      if (!error && data) {
        setMentors(data as MentorCandidate[]);
      } else {
        setMentors([]);
      }

      setLoadingMentors(false);
    };

    void fetchMentors();
  }, [profile?.id]);

  const inferredTopics = useMemo(() => {
    if (!profile) return [];

    return inferTopics(profile);
  }, [profile]);

  const recommendedResources = useMemo(() => {
    if (!profile) return [];

    return resources
      .map((resource) => ({
        ...resource,
        ...buildResourceScore(resource, inferredTopics),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }, [resources, inferredTopics, profile]);

  const recommendedMentors = useMemo(() => {
    if (!profile) return [];

    return mentors
      .map((mentor) => ({
        ...mentor,
        ...buildMentorScore(mentor, profile, inferredTopics),
      }))
      .filter((mentor) => mentor.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }, [inferredTopics, mentors, profile]);

  const recommendedSessions = useMemo(() => {
    return sessions
      .map((session) => ({
        ...session,
        ...buildSessionScore(session, inferredTopics),
      }))
      .filter((session) => session.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }, [inferredTopics, sessions]);

  const practiceRecommendations = useMemo(() => {
    if (!profile) return [];

    return buildPracticeRecommendations(profile, inferredTopics);
  }, [inferredTopics, profile]);

  const isLoading = !profile || resourcesLoading || loadingMentors;

  const refreshRecommendations = async () => {
    setLoadingMentors(true);

    const { data } = await supabase
      .from("profiles")
      .select(
        "id, name, bio, avatar_url, skills, interests, teach_subjects, learn_subjects, rating, sessions_completed, points, streak, badges, is_mentor",
      )
      .eq("is_mentor", true)
      .neq("id", profile?.id || "")
      .order("points", { ascending: false })
      .limit(50);

    setMentors((data || []) as MentorCandidate[]);
    setLoadingMentors(false);
    await refetchResources();
  };

  if (!profile) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-white/8 via-white/5 to-cyan-500/5 p-6 backdrop-blur-2xl"
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
            <Sparkles className="h-4 w-4" />
            AI recommendation engine
          </div>

          <div>
            <h2 className="text-2xl font-black text-white md:text-3xl">Personalized learning recommendations</h2>
            <CardDescription className="mt-2 max-w-3xl text-slate-300">
              Suggestions are ranked from your skills, interests, streak, points, and upcoming activity so the feed adapts as you learn.
            </CardDescription>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/ai")}>
            <Brain className="h-4 w-4" />
            Ask AI
          </Button>

          <Button onClick={refreshRecommendations} className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:from-cyan-300 hover:to-blue-400">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {getTopicLabels(inferredTopics).map((topic) => (
          <Badge key={topic} variant="outline" className="border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-200">
            {topic}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-white/10 bg-white/5">
              <CardContent className="space-y-4 p-5">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <motion.div variants={sectionVariants} initial="hidden" animate="show">
            <Card className="h-full border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <BookOpen className="h-5 w-5 text-cyan-300" />
                  Resources to open next
                </CardTitle>
                <CardDescription>Matched to the subjects you are already exploring.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedResources.length > 0 ? (
                  recommendedResources.map((resource) => (
                    <div key={resource.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-500/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-white">{resource.title}</p>
                            <Badge variant="secondary" className="shrink-0 bg-cyan-400/10 text-cyan-200">
                              {Math.round(resource.score)} fit
                            </Badge>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-300">
                            {resource.description || "A resource that lines up with your current learning path."}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(resource.hits || []).map((hit: { topic: string; score: number }) => (
                          <Badge key={hit.topic} variant="outline" className="border-white/10 text-xs text-slate-200">
                            {hit.topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
                    Add more resources or update your profile interests to unlock sharper suggestions here.
                  </p>
                )}

                <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/resources")}>
                  Open Resource Hub
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={sectionVariants} initial="hidden" animate="show">
            <Card className="h-full border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <GraduationCap className="h-5 w-5 text-emerald-300" />
                  Mentors who match your goals
                </CardTitle>
                <CardDescription>Recommended from mentor skills, teaching subjects, and activity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedMentors.length > 0 ? (
                  recommendedMentors.map((mentor) => (
                    <div key={mentor.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-emerald-400/30 hover:bg-emerald-500/5">
                      <div className="flex items-start gap-4">
                        <img
                          src={mentor.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${mentor.name}`}
                          alt={mentor.name || "Mentor"}
                          className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-semibold text-white">{mentor.name || "Mentor"}</p>
                            <Badge variant="secondary" className="shrink-0 bg-emerald-400/10 text-emerald-200">
                              {Math.round(mentor.score)} fit
                            </Badge>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-300">{mentor.bio || "Experienced mentor ready to help you level up."}</p>
                          <div className="flex flex-wrap gap-2">
                            {(mentor.overlap || []).map((topic) => (
                              <Badge key={topic} variant="outline" className="border-white/10 text-xs text-slate-200">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
                    No mentor matches yet. Add interests or learner subjects to see stronger mentor suggestions.
                  </p>
                )}

                <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/discover")}>
                  Browse Mentors
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={sectionVariants} initial="hidden" animate="show">
            <Card className="h-full border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Target className="h-5 w-5 text-amber-300" />
                  Practice problems
                </CardTitle>
                <CardDescription>Short challenges generated from your highest-signal topics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {practiceRecommendations.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-amber-400/30 hover:bg-amber-500/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="text-sm leading-relaxed text-slate-300">{item.description}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 bg-amber-400/10 text-amber-200">
                        {item.difficulty}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-400">
                      <span>{item.topic}</span>
                      <span>{item.score} match</span>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/ai")}>
                  Generate more practice
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={sectionVariants} initial="hidden" animate="show">
            <Card className="h-full border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Users className="h-5 w-5 text-blue-300" />
                  Study groups and sessions
                </CardTitle>
                <CardDescription>Live and upcoming sessions ranked by topic fit and urgency.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedSessions.length > 0 ? (
                  recommendedSessions.map((session) => (
                    <div key={session.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-blue-400/30 hover:bg-blue-500/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <p className="truncate font-semibold text-white">{session.title || "Study session"}</p>
                          <p className="text-sm leading-relaxed text-slate-300">
                            {session.description || "An active collaborative session that matches your current learning path."}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 bg-blue-400/10 text-blue-200">
                          {Math.round(session.score)} fit
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(session.matches || []).map((topic: string) => (
                          <Badge key={topic} variant="outline" className="border-white/10 text-xs text-slate-200">
                            {topic}
                          </Badge>
                        ))}
                        {session.scheduled_at ? (
                          <Badge variant="outline" className="border-white/10 text-xs text-slate-200">
                            <CalendarClock className="mr-1 h-3 w-3" />
                            {new Date(session.scheduled_at).toLocaleString()}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">
                    No session matches right now. Check back when new groups or study rooms are scheduled.
                  </p>
                )}

                <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10" onClick={() => navigate("/sessions")}>
                  Explore Sessions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.section>
  );
};

export default RecommendationPanel;
