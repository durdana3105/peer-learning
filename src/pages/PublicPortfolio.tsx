import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GitHubCalendar } from "react-github-calendar";
import {
  Award,
  BookOpenCheck,
  ExternalLink,
  Github,
  Linkedin,
  Rocket,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { SkillBadge } from "@/components/SkillBadge";
import { useSkillEndorsements } from "@/hooks/useSkillEndorsements";

type Achievement = {
  title: string;
  description: string;
};

type Project = {
  title: string;
  description: string;
  url: string;
  tech: string;
};

type LearningProgress = {
  focus: string;
  completed: number;
  goal: number;
};

type PortfolioRow = {
  profile_id: string;
  headline: string;
  github_url: string;
  linkedin_url: string;
  skills: string[];
  achievements: Achievement[];
  projects: Project[];
  learning_progress: LearningProgress;
  profiles: {
    name: string | null;
    bio: string | null;
    avatar_url: string | null;
    badges: string[] | null;
    points: number | null;
    sessions_completed: number | null;
  } | null;
};

const parseGithubUsername = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes("github.com")) return "";
    return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
  } catch {
    return "";
  }
};

const normalizeArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return "";
  }
  return trimmed;
};

const PublicPortfolio = () => {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState<PortfolioRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadPortfolio = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data: portfolioData, error: portfolioError } = await (supabase as any)
          .from("portfolio_profiles")
          .select(`
            profile_id,
            headline,
            github_url,
            linkedin_url,
            skills,
            achievements,
            projects,
            learning_progress
          `)
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();

        if (isCancelled) return;

        if (portfolioError) {
          throw portfolioError;
        }

        if (!portfolioData) {
          console.warn("No public portfolio found for slug:", slug);
          setPortfolio(null);
          return;
        }

        const pd = portfolioData as any;

        if (!pd.profile_id) {
          console.warn("Portfolio row is missing profile_id");
          setPortfolio(null);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            name,
            bio,
            avatar_url,
            badges,
            points,
            sessions_completed
          `)
          .eq("id", pd.profile_id)
          .maybeSingle();

        if (isCancelled) return;

        if (profileError) {
          console.error("Profile query failed:", profileError);
        }

        const progress = pd.learning_progress as Partial<LearningProgress> | null;

        setPortfolio({
          profile_id: pd.profile_id,
          headline: pd.headline || "",
          github_url: sanitizeUrl(pd.github_url),
          linkedin_url: sanitizeUrl(pd.linkedin_url),
          skills: pd.skills || [],
          achievements: normalizeArray<Achievement>(pd.achievements),
          projects: normalizeArray<Project>(pd.projects).map((p: Project) => ({ ...p, url: sanitizeUrl(p.url) })),
          learning_progress: {
            focus:
              typeof progress?.focus === "string"
                ? progress.focus
                : "Learning Journey",
            completed: Number(progress?.completed || 0),
            goal: Number(progress?.goal || 100),
          },
          profiles: profileData,
        });
      } catch (err) {
        if (isCancelled) return;
        console.error("Failed to load public portfolio:", err);
        setPortfolio(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void loadPortfolio();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const { endorsements, loading: endorsementsLoading, toggleEndorsement, currentUserId } =
    useSkillEndorsements({
      profileUserId: portfolio?.profile_id ?? "",
      skills: portfolio?.skills ?? [],
    });

  const isOwnProfile = currentUserId === portfolio?.profile_id;

  const githubUsername = useMemo(
    () => parseGithubUsername(portfolio?.github_url || ""),
    [portfolio?.github_url],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-center text-white">
        <div>
          <UserRound className="mx-auto mb-4 h-12 w-12 text-slate-500" />
          <h1 className="text-3xl font-bold">Portfolio not found</h1>
          <p className="mt-3 text-slate-400">This public portfolio may be unpublished or the link may be incorrect.</p>
          <Button asChild className="mt-6 bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const profile = portfolio.profiles;
  const name = profile?.name || "PeerLearn member";
  const progressPercent = Math.min(
    100,
    (portfolio.learning_progress.completed / Math.max(portfolio.learning_progress.goal, 1)) * 100,
  );

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <img
                src={profile?.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${name}`}
                alt={name}
                className="h-20 w-20 rounded-full border border-white/20 bg-white/10 object-cover"
              />
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Portfolio</p>
                <h1 className="mt-1 text-4xl font-black tracking-tight md:text-6xl">{name}</h1>
              </div>
            </div>

            <p className="max-w-3xl text-2xl font-semibold text-slate-100">
              {portfolio.headline || "Learning in public and building with peers."}
            </p>
            {profile?.bio && <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{profile.bio}</p>}

            <div className="mt-8 flex flex-wrap gap-3">
              {portfolio.github_url && (
                <Button asChild className="bg-white text-slate-950 hover:bg-slate-200">
                  <a href={portfolio.github_url} target="_blank" rel="noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              )}
              {portfolio.linkedin_url && (
                <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <a href={portfolio.linkedin_url} target="_blank" rel="noreferrer">
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">XP</p>
                <p className="mt-1 text-3xl font-bold text-cyan-200">{profile?.points || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Sessions</p>
                <p className="mt-1 text-3xl font-bold text-emerald-200">{profile?.sessions_completed || 0}</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm text-slate-300">
                <span>{portfolio.learning_progress.focus}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
            <BookOpenCheck className="h-6 w-6 text-cyan-300" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {portfolio.skills.length > 0 ? (
              portfolio.skills.map((skill) => (
                <SkillBadge
                  key={skill}
                  skill={skill}
                  endorsementCount={endorsements[skill]?.count ?? 0}
                  hasEndorsed={endorsements[skill]?.hasEndorsed ?? false}
                  onEndorse={(value) => void toggleEndorsement(value)}
                  canEndorse={Boolean(currentUserId) && !isOwnProfile}
                  loading={endorsementsLoading}
                />
              ))
            ) : (
              <p className="text-slate-400">No skills added yet.</p>
            )}
          </div>
        </section>

        {githubUsername && (
          <section className="rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
              <Github className="h-6 w-6 text-slate-200" />
              GitHub activity
            </h2>
            <div className="overflow-x-auto">
              <GitHubCalendar username={githubUsername} colorScheme="dark" />
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
            <Rocket className="h-6 w-6 text-emerald-300" />
            Projects
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {portfolio.projects.length > 0 ? (
              portfolio.projects.map((project, index) => (
                <article key={`${project.title}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  {project.description && <p className="mt-3 text-slate-300">{project.description}</p>}
                  {project.tech && <p className="mt-4 text-sm text-cyan-200">{project.tech}</p>}
                </article>
              ))
            ) : (
              <p className="text-slate-400">No projects added yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
            <Award className="h-6 w-6 text-amber-300" />
            Achievements
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {portfolio.achievements.length > 0 ? (
              portfolio.achievements.map((achievement, index) => (
                <article key={`${achievement.title}-${index}`} className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <h3 className="text-xl font-semibold">{achievement.title}</h3>
                  {achievement.description && <p className="mt-3 text-slate-300">{achievement.description}</p>}
                </article>
              ))
            ) : (
              <p className="text-slate-400">No achievements added yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default PublicPortfolio;

// Fix for #1159: Refined typings

// fix/handle-invalid-routes
