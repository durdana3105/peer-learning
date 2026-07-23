import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python",
  "Java", "C++", "SQL", "MongoDB", "Express.js",
  "Next.js", "GraphQL", "Docker", "Git", "REST APIs",
  "Machine Learning", "Data Structures", "Algorithms",
  "System Design", "CSS", "HTML", "Vue.js", "Angular",
];

const steps = [
  "Basic Info",
  "Skills",
  "Experience",
  "Mentorship",
  "Success",
];

const mentorshipOptions = [
  "Live Sessions",
  "Mock Interviews",
  "Career Guidance",
  "Project Mentorship",
];

export default function MentorForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    college: "",
    bio: "",
    github: "",
    linkedin: "",
    skills: [] as string[],
    mentorship_types: [] as string[],
  });

// Clear validation error reactively when user fixes input (#1614)
  useEffect(() => {
    if (!error) return;
    const isValid =
      (step === 0 && validateBasicInfo()) ||
      (step === 1 && validateSkills()) ||
      (step === 2 && validateExperience()) ||
      (step === 3 && validateMentorship());
    if (isValid) setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, step]);

  useEffect(() => {
    setAvailableSkills(DEFAULT_SKILLS);
  }, []);

  const handleAddCustomSkill = () => {
    const skill = customSkill.trim();
    if (!skill) return;

    if (!availableSkills.includes(skill)) {
      setAvailableSkills((prev) => [...prev, skill]);
    }

    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills : [...prev.skills, skill],
    }));

    setCustomSkill("");
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
    setAvailableSkills((prev) => prev.filter((s) => s !== skill));
  };

  const toggleMentorship = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      mentorship_types: prev.mentorship_types.includes(type)
        ? prev.mentorship_types.filter((t) => t !== type)
        : [...prev.mentorship_types, type],
    }));
  };

  const validateBasicInfo = () => {
    return (
      formData.full_name.trim() !== "" &&
      formData.college.trim() !== "" &&
      formData.bio.trim() !== "" &&
      formData.full_name.trim().length > 2 &&
      formData.college.trim().length > 2 &&
      formData.bio.trim().length > 20
    );
  };

  const validateSkills = () => {
    return formData.skills.length > 0;
  };

  const validateExperience = () => {
    return (
      formData.github.trim() !== "" &&
      formData.linkedin.trim() !== ""
    );
  };

  const validateMentorship = () => {
    return formData.mentorship_types.length > 0;
  };

  const handleSubmit = async () => {
    if (!validateMentorship()) {
      setError("Please select at least one mentorship type");
      return;
    }
    setLoading(true);
    setError("");
    let isTimeout = false;
    const timeout = setTimeout(() => {
      isTimeout = true;
      setLoading(false);
      setError("Submission timed out. Please check your network and try again.");
    }, 10_000);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (isTimeout) return;
      if (!user) {
        if (!isTimeout) clearTimeout(timeout);
        setError("You must be logged in to submit an application.");
        setLoading(false);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("mentors")
        .insert([
          {
            user_id: user.id,
            full_name: formData.full_name,
            college: formData.college,
            bio: formData.bio,
            github: formData.github,
            linkedin: formData.linkedin,
            skills: formData.skills,
            mentorship_types: formData.mentorship_types,
          },
        ]);
      if (isTimeout) return;
      clearTimeout(timeout);
      if (error) {
        console.error(error);
        setError(error.message || "Something went wrong!");
        setLoading(false);
        return;
      }
      setStep(4);
    } catch (err) {
      if (isTimeout) return;
      clearTimeout(timeout);
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      if (!isTimeout) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/5 p-10 backdrop-blur-2xl">

      {/* Progress */}
      {step !== 4 && (
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            {steps.slice(0, 4).map((s, i) => (
              <div
                key={i}
                className={`text-sm ${i <= step ? "text-cyan-400" : "text-slate-500"}`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{ width: `${((step + 1) / 4) * 100}%` }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {/* STEP 1 */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-3xl font-black">Basic Information</h2>
            <input
              placeholder="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none transition focus:border-cyan-400"
            />
            <input
              placeholder="College Name"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none transition focus:border-cyan-400"
            />
            <textarea
              placeholder="Short Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="h-32 w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none transition focus:border-cyan-400"
            />
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-black">Skills & Expertise</h2>
            <div className="mt-8 flex flex-wrap gap-4 mb-6">
              {availableSkills.map((skill) => {
                const isSelected = formData.skills.includes(skill);
                return (
                  <div
                    key={skill}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSkill(skill)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleSkill(skill);
                      }
                    }}
                    className={`flex cursor-pointer select-none items-center gap-2 rounded-full px-5 py-3 transition-all duration-300 ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black"
                        : "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                    }`}
                  >
                    <span>{skill}</span>
                    {isSelected && (
                      <button
                        type="button"
                        aria-label={`Remove ${skill}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSkill(skill);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-black transition hover:bg-black/40"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Add custom skill..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomSkill()}
                className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 outline-none transition focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 transition hover:bg-white/20"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-3xl font-black">Experience</h2>
            <input
              placeholder="https://github.com/Username"
              value={formData.github}
              onChange={(e) => setFormData({ ...formData, github: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none transition focus:border-cyan-400"
            />
            <input
              placeholder="https://www.linkedin.com/in/Username"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 outline-none transition focus:border-cyan-400"
            />
          </div>
        )}

        {/* STEP 4 */}
        {step === 3 && (
          <div>
            <h2 className="text-3xl font-black">Mentorship Type</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {mentorshipOptions.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleMentorship(item)}
                  className={`rounded-2xl p-5 text-left transition-all duration-300 ${
                    formData.mentorship_types.includes(item)
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black"
                      : "border border-white/10 bg-white/5"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {step === 4 && (
          <div className="space-y-6 py-10 text-center">
            <CheckCircle2 className="mx-auto text-cyan-400" size={90} />
            <h2 className="text-5xl font-black">Application Submitted 🎉</h2>
            <p className="mx-auto max-w-xl text-lg leading-8 text-slate-300/70">
              Your mentor profile is now under review. Once approved, you can
              start conducting mentorship sessions on PeerLearn.
            </p>
          </div>
        )}
      </motion.div>

      {error && (
        <div className="mt-6 rounded-2xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-500/30 via-pink-500/25 to-purple-500/30 px-5 py-4 text-sm font-semibold text-pink-100 shadow-lg shadow-pink-500/20 backdrop-blur-xl">
          {error}
        </div>
      )}

      {/* Buttons */}
      {step !== 4 && (
        <div className="mt-10 flex justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 transition disabled:opacity-30"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 0 && !validateBasicInfo()) {
                  setError("Please fill all basic information fields");
                  return;
                }
                if (step === 1 && !validateSkills()) {
                  setError("Please select at least one skill");
                  return;
                }
                if (step === 2 && !validateExperience()) {
                  setError("Please fill GitHub and LinkedIn profiles");
                  return;
                }
                setError("");
                setStep(step + 1);
              }}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-3 font-semibold text-black transition hover:scale-105"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-3 font-semibold text-black transition hover:scale-105 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}