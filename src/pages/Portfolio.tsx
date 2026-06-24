import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Copy,
  ExternalLink,
  Github,
  Linkedin,
  Plus,
  Save,
  Share2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

type PortfolioForm = {
  slug: string;
  headline: string;
  github_url: string;
  linkedin_url: string;
  skills: string;
  achievements: Achievement[];
  projects: Project[];
  learning_progress: LearningProgress;
  is_published: boolean;
};

const emptyAchievement: Achievement = { title: "", description: "" };
const emptyProject: Project = { title: "", description: "", url: "", tech: "" };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const normalizeList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const normalizeAchievements = (value: unknown): Achievement[] =>
  Array.isArray(value)
    ? value.map((item) => ({
        title: typeof item?.title === "string" ? item.title : "",
        description: typeof item?.description === "string" ? item.description : "",
      }))
    : [{ ...emptyAchievement }];

const normalizeProjects = (value: unknown): Project[] =>
  Array.isArray(value)
    ? value.map((item) => ({
        title: typeof item?.title === "string" ? item.title : "",
        description: typeof item?.description === "string" ? item.description : "",
        url: typeof item?.url === "string" ? item.url : "",
        tech: typeof item?.tech === "string" ? item.tech : "",
      }))
    : [{ ...emptyProject }];

const Portfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [form, setForm] = useState<PortfolioForm>({
    slug: "",
    headline: "",
    github_url: "",
    linkedin_url: "",
    skills: "",
    achievements: [{ ...emptyAchievement }],
    projects: [{ ...emptyProject }],
    learning_progress: { focus: "", completed: 0, goal: 100 },
    is_published: false,
  });

  const publicUrl = useMemo(() => {
    if (!form.slug) return "";
    return `${window.location.origin}/portfolio/${form.slug}`;
  }, [form.slug]);

  // Fetch the user's profile and portfolio data on component mount.
  // Includes a safety timeout and parallel data fetching to optimize performance.
  useEffect(() => {
    let isMounted = true;
    let timeout: NodeJS.Timeout;

    const loadPortfolio = async () => {
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) setLoading(true);

      // Safety timeout: if queries hang, stop loading after 10 seconds
      timeout = setTimeout(() => {
        if (isMounted) {
          setLoading(false);
          toast({
            title: "Loading timed out",
            description: "Some data may not have loaded. Please refresh to try again.",
            variant: "destructive",
          });
        }
      }, 10_000);

      try {
          // Run both queries in parallel instead of sequentially
        const [profileResult, portfolioResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("name, skills")
            .eq("id", user.id)
            .maybeSingle(),
          (supabase as any)
            .from("portfolio_profiles")
            .select("*")
            .eq("profile_id", user.id)
            .maybeSingle(),
        ]);

        clearTimeout(timeout);
        if (!isMounted) return;

        const { data: profile, error: profileError } = profileResult;
        const { data: portfolio, error: portfolioError } = portfolioResult;

        if (profileError) {
          toast({
            title: "Profile could not load",
            description: profileError.message,
            variant: "destructive",
          });
        }

        const fallbackSlug = slugify(profile?.name || user.email?.split("@")[0] || "learner");
        setProfileName(profile?.name || user.email?.split("@")[0] || "Learner");

        if (portfolioError) {
          toast({
            title: "Portfolio could not load",
            description: portfolioError.message,
            variant: "destructive",
          });
        }

        if (portfolio) {
          const p = portfolio as any;
          const progress = p.learning_progress as Partial<LearningProgress> | null;
          setForm({
            slug: p.slug,
            headline: p.headline || "",
            github_url: p.github_url || "",
            linkedin_url: p.linkedin_url || "",
            skills: normalizeList(p.skills).join(", "),
            achievements: normalizeAchievements(p.achievements),
            projects: normalizeProjects(p.projects),
            learning_progress: {
              focus: typeof progress?.focus === "string" ? progress.focus : "",
              completed: Number(progress?.completed || 0),
              goal: Number(progress?.goal || 100),
            },
            is_published: p.is_published,
          });
        } else {
          setForm((current) => ({
            ...current,
            slug: fallbackSlug,
            skills: normalizeList(profile?.skills).join(", "),
          }));
        }
      } catch (error) {
        clearTimeout(timeout);
        if (!isMounted) return;

        toast({
          title: "Portfolio could not load",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadPortfolio();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [user?.id, user?.email, toast]);

  const updateAchievement = (index: number, achievement: Achievement) => {
    setForm((current) => ({
      ...current,
      achievements: current.achievements.map((item, itemIndex) =>
        itemIndex === index ? achievement : item,
      ),
    }));
  };

  const updateProject = (index: number, project: Project) => {
    setForm((current) => ({
      ...current,
      projects: current.projects.map((item, itemIndex) =>
        itemIndex === index ? project : item,
      ),
    }));
  };

  // Saves the portfolio to the database via an upsert operation.
  // Validates the uniqueness of the slug and uses a local timeout to prevent the UI from hanging on slow networks.
  const savePortfolio = async () => {
    if (!user) return;

    const slug = slugify(form.slug);
    if (!slug) {
      toast({
        title: "Choose a public URL",
        description: "Your portfolio needs a short slug before it can be saved.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { data: existingSlugUser, error: slugCheckError } = await (supabase as any)
      .from("portfolio_profiles")
      .select("profile_id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugCheckError) {
      setSaving(false);
      toast({
        title: "Error checking URL",
        description: "Failed to verify if the URL is available.",
        variant: "destructive",
      });
      return;
    }

    if (existingSlugUser && (existingSlugUser as any).profile_id !== user.id) {
      setSaving(false);
      toast({
        title: "URL already taken",
        description: "This public URL is already in use by someone else. Please choose another one.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      profile_id: user.id,
      slug,
      headline: form.headline.trim(),
      github_url: form.github_url.trim(),
      linkedin_url: form.linkedin_url.trim(),
      skills: form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      achievements: form.achievements.filter((item) => item.title.trim()),
      projects: form.projects.filter((item) => item.title.trim()),
      learning_progress: form.learning_progress,
      is_published: form.is_published,
    };

    let isTimeout = false;
    const timeout = setTimeout(() => {
      isTimeout = true;
      setSaving(false);
      toast({
        title: "Save timed out",
        description: "The connection to the database timed out. Please check your connection and try again.",
        variant: "destructive",
      });
    }, 10_000);

      const { error } = await (supabase as any)
        .from("portfolio_profiles")
        .upsert(payload, { onConflict: "profile_id" });

      if (isTimeout) {
        console.warn("Portfolio save completed, but it already timed out locally.");
        return;
      }
      clearTimeout(timeout);

      if (error) {
        console.error("Portfolio upsert returned database error:", error);
        toast({
          title: "Portfolio was not saved",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setForm((current) => ({ ...current, slug }));
      toast({
        title: "Portfolio saved",
        description: form.is_published ? "Your public page is live." : "Your draft is saved.",
      });
    } catch (error) {
      if (isTimeout) {
        console.warn("Portfolio save threw exception, but it already timed out locally.");
        return;
      }
      clearTimeout(timeout);
      console.error("Portfolio save threw exception:", error);
      toast({
        title: "Portfolio was not saved",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      if (!isTimeout) {
        setSaving(false);
      }
    }
  };

  const copyShareLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast({ title: "Share link copied" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
              <Share2 className="h-4 w-4" />
              Public portfolio
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Build your portfolio</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Showcase your skills, achievements, projects, learning progress, and social profiles from one shareable page.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {form.is_published && publicUrl && (
              <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                <Link to={`/portfolio/${form.slug}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View public page
                </Link>
              </Button>
            )}
            <Button onClick={savePortfolio} disabled={saving} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save portfolio"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="headline" className="text-slate-200">Headline</Label>
                  <Input
                    id="headline"
                    value={form.headline}
                    onChange={(event) => setForm({ ...form, headline: event.target.value })}
                    placeholder="Frontend learner building accessible apps"
                    className="mt-2 border-white/10 bg-slate-950/60 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="slug" className="text-slate-200">Public URL</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })}
                    placeholder="your-name"
                    className="mt-2 border-white/10 bg-slate-950/60 text-white"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="github" className="text-slate-200">GitHub</Label>
                  <div className="relative mt-2">
                    <Github className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="github"
                      value={form.github_url}
                      onChange={(event) => setForm({ ...form, github_url: event.target.value })}
                      placeholder="https://github.com/username"
                      className="border-white/10 bg-slate-950/60 pl-9 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="linkedin" className="text-slate-200">LinkedIn</Label>
                  <div className="relative mt-2">
                    <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="linkedin"
                      value={form.linkedin_url}
                      onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="border-white/10 bg-slate-950/60 pl-9 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <Label htmlFor="skills" className="text-slate-200">Skills</Label>
                <Input
                  id="skills"
                  value={form.skills}
                  onChange={(event) => setForm({ ...form, skills: event.target.value })}
                  placeholder="React, Python, UI Design"
                  className="mt-2 border-white/10 bg-slate-950/60 text-white"
                />
                <p className="mt-2 text-xs text-slate-400">Separate skills with commas.</p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Projects</h2>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setForm({ ...form, projects: [...form.projects, { ...emptyProject }] })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add project
                </Button>
              </div>

              <div className="space-y-4">
                {form.projects.map((project, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">Project {index + 1}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white"
                        aria-label={`Remove project ${index + 1}`}
                        onClick={() => setForm({ ...form, projects: form.projects.filter((_, itemIndex) => itemIndex !== index) })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={project.title}
                        onChange={(event) => updateProject(index, { ...project, title: event.target.value })}
                        placeholder="Project title"
                        className="border-white/10 bg-slate-950/60 text-white"
                      />
                      <Input
                        value={project.url}
                        onChange={(event) => updateProject(index, { ...project, url: event.target.value })}
                        placeholder="Project URL"
                        className="border-white/10 bg-slate-950/60 text-white"
                      />
                    </div>
                    <Input
                      value={project.tech}
                      onChange={(event) => updateProject(index, { ...project, tech: event.target.value })}
                      placeholder="Tech stack"
                      className="mt-3 border-white/10 bg-slate-950/60 text-white"
                    />
                    <Textarea
                      value={project.description}
                      onChange={(event) => updateProject(index, { ...project, description: event.target.value })}
                      placeholder="What did you build and learn?"
                      className="mt-3 border-white/10 bg-slate-950/60 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">Achievements</h2>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setForm({ ...form, achievements: [...form.achievements, { ...emptyAchievement }] })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add achievement
                </Button>
              </div>

              <div className="space-y-4">
                {form.achievements.map((achievement, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-slate-950/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">Achievement {index + 1}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-300 hover:bg-white/10 hover:text-white"
                        aria-label={`Remove achievement ${index + 1}`}
                        onClick={() => setForm({ ...form, achievements: form.achievements.filter((_, itemIndex) => itemIndex !== index) })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={achievement.title}
                      onChange={(event) => updateAchievement(index, { ...achievement, title: event.target.value })}
                      placeholder="Achievement title"
                      className="border-white/10 bg-slate-950/60 text-white"
                    />
                    <Textarea
                      value={achievement.description}
                      onChange={(event) => updateAchievement(index, { ...achievement, description: event.target.value })}
                      placeholder="Certificate, milestone, rank, contribution, or award details"
                      className="mt-3 border-white/10 bg-slate-950/60 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Publish</h2>
                  <p className="mt-1 text-sm text-slate-400">Turn on public sharing when your page is ready.</p>
                </div>
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                />
              </div>

              <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Shareable URL</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm text-cyan-200">{publicUrl || "Set a slug to create a URL"}</p>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" aria-label="Copy shareable link" onClick={copyShareLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Learning progress</h2>
              <div className="mt-4 space-y-4">
                <Input
                  value={form.learning_progress.focus}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      learning_progress: { ...form.learning_progress, focus: event.target.value },
                    })
                  }
                  placeholder="Current focus, e.g. Full-stack React"
                  className="border-white/10 bg-slate-950/60 text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min={0}
                    value={form.learning_progress.completed}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        learning_progress: {
                          ...form.learning_progress,
                          completed: Number(event.target.value),
                        },
                      })
                    }
                    className="border-white/10 bg-slate-950/60 text-white"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={form.learning_progress.goal}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        learning_progress: {
                          ...form.learning_progress,
                          goal: Number(event.target.value),
                        },
                      })
                    }
                    className="border-white/10 bg-slate-950/60 text-white"
                  />
                </div>
                <Progress
                  value={Math.min(100, (form.learning_progress.completed / Math.max(form.learning_progress.goal, 1)) * 100)}
                  className="h-3"
                />
              </div>
            </div>

            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-6">
              <Award className="mb-4 h-8 w-8 text-cyan-300" />
              <h2 className="text-xl font-semibold">{profileName}'s portfolio preview</h2>
              <p className="mt-2 text-sm text-slate-300">
                Your published page will combine your profile, social links, project proof, and progress into a public learner identity.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;

// Fix for #1164: Added skeleton loading state
