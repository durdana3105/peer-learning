import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ContactFormData = {
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof ContactFormData, string>>;

// --- Rate limit constants (must mirror the DB-level policy values) ---
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const COOLDOWN_MS = 60 * 1000;               // 1 minute between submissions
const STORAGE_KEY = "contact_submissions";

type SubmissionRecord = {
  timestamps: number[];
  lastMessage: string;
};

const getSubmissionRecord = (): SubmissionRecord => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { timestamps: [], lastMessage: "" };
    return JSON.parse(raw) as SubmissionRecord;
  } catch {
    return { timestamps: [], lastMessage: "" };
  }
};

const saveSubmissionRecord = (record: SubmissionRecord) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    console.warn("Unable to save contact submission locally.", error);
  }
};

const checkRateLimit = (
  message: string
): { allowed: boolean; reason?: string } => {
  const now = Date.now();
  const record = getSubmissionRecord();

  const recentTimestamps = record.timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    const oldest = Math.min(...recentTimestamps);
    const resetInMin = Math.ceil(
      (RATE_LIMIT_WINDOW_MS - (now - oldest)) / 60000
    );
    return {
      allowed: false,
      reason: `Too many messages sent. Please wait ${resetInMin} minute${resetInMin !== 1 ? "s" : ""} before trying again.`,
    };
  }

  if (recentTimestamps.length > 0) {
    const lastSubmission = Math.max(...recentTimestamps);
    const cooldownRemaining = COOLDOWN_MS - (now - lastSubmission);
    if (cooldownRemaining > 0) {
      const seconds = Math.ceil(cooldownRemaining / 1000);
      return {
        allowed: false,
        reason: `Please wait ${seconds} second${seconds !== 1 ? "s" : ""} before sending another message.`,
      };
    }
  }

  if (
    record.lastMessage &&
    record.lastMessage.trim().toLowerCase() === message.trim().toLowerCase()
  ) {
    return {
      allowed: false,
      reason: "You already sent this message. Please write a different message.",
    };
  }

  return { allowed: true };
};

const recordSubmission = (message: string) => {
  const now = Date.now();
  const record = getSubmissionRecord();
  const recentTimestamps = record.timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  saveSubmissionRecord({
    timestamps: [...recentTimestamps, now],
    lastMessage: message,
  });
};

// FIX: Phrases that Supabase/PostgreSQL actually returns for RLS violations.
// Supabase does NOT return "rate limit" — it returns RLS policy error text.
// We map all of these to a clear, user-friendly message.
const RLS_ERROR_PHRASES = [
  "violates row-level security policy",
  "new row violates",
  "row-level security",
  "check constraint",
] as const;

function parseSupabaseError(errorMessage: string): string {
  const lower = errorMessage.toLowerCase();

  if (RLS_ERROR_PHRASES.some((phrase) => lower.includes(phrase))) {
    // The DB-level policy blocked this — could be rate limit or duplicate.
    // Give the user an accurate, actionable message.
    return "You've submitted too many messages recently, or sent a duplicate message. Please wait a few minutes before trying again.";
  }

  // Fallback for unexpected errors
  return errorMessage || "An unexpected error occurred. Please try again.";
}

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive",
      });
      return;
    }

    // Client-side rate limit check (fast, no DB round-trip needed)
    const rateLimitCheck = checkRateLimit(formData.message);
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Slow Down",
        description: rateLimitCheck.reason,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await (supabase as any)
        .from("contact_messages")
        .insert([
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
          },
        ]);

      if (error) {
        // FIX: Use parseSupabaseError instead of checking for "rate limit".
        // Supabase RLS violations never contain the phrase "rate limit" —
        // they contain "violates row-level security policy" and similar.
        throw new Error(parseSupabaseError(error.message));
      }

      // Record locally so future submissions are caught client-side first
      recordSubmission(formData.message);

      toast({
        title: "Message Sent! 🎉",
        description:
          "We've received your message and will get back to you shortly.",
      });

      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        subject: "",
        message: "",
      });
      setErrors({});
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      toast({
        title: "Submission Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#071127] to-[#020B1F] text-white">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Glow Effects */}
      <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <section className="container relative z-10 mx-auto px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-5 py-2 text-sm text-cyan-300 backdrop-blur-xl">
            <MessageCircle size={16} />
            We'd Love to Hear From You
          </div>

          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Contact
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
              {" "}
              PeerLearn
            </span>
          </h1>

          <p className="mt-8 text-lg leading-8 text-slate-300/80 md:text-xl">
            Have questions, feedback, partnership ideas, or need support? Reach
            out to our team and we'll get back to you as soon as possible.
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="mt-20 grid gap-10 lg:grid-cols-2">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-[32px] border border-white/10 bg-white/5 p-10 backdrop-blur-2xl"
          >
            <h2 className="text-3xl font-black">Get In Touch</h2>

            <p className="mt-5 leading-8 text-slate-300/75">
              Whether you're a learner, mentor, collaborator, or organization,
              our team is always open to connecting with passionate people.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black">
                  <Mail />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Email</h3>
                  <p className="mt-1 text-slate-300/70">support@peerlearn.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black">
                  <Phone />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Phone</h3>
                  <p className="mt-1 text-slate-300/70">+91 98765 43210</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black">
                  <MapPin />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Location</h3>
                  <p className="mt-1 text-slate-300/70">Punjab, India</p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black">
                  <Clock />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Availability</h3>
                  <p className="mt-1 text-slate-300/70">
                    Monday – Saturday · 9 AM – 8 PM
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 backdrop-blur-xl">
              <h3 className="text-xl font-bold text-cyan-300">
                Want to become a mentor?
              </h3>
              <p className="mt-3 leading-7 text-slate-300/80">
                Join our growing mentor network and help students learn faster,
                build projects, and grow their careers.
              </p>
              <Link to="/become-mentor">
                <Button className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-6 text-black hover:scale-105 transition-all duration-300">
                  Become a Mentor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-[32px] border border-white/10 bg-white/5 p-10 backdrop-blur-2xl"
          >
            <h2 className="text-3xl font-black">Send a Message</h2>

            <p className="mt-4 text-slate-300/75">
              Fill out the form below and our team will respond shortly.
            </p>

            <p className="mt-2 text-xs text-slate-400">
              You can send up to {RATE_LIMIT_MAX} messages every 10 minutes.
            </p>

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="first_name"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    First Name
                  </label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={`h-14 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400 ${errors.first_name ? "border-red-400" : ""}`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Last Name
                  </label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={`h-14 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400 ${errors.last_name ? "border-red-400" : ""}`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`h-14 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400 ${errors.email ? "border-red-400" : ""}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Subject
                </label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className={`h-14 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400 ${errors.subject ? "border-red-400" : ""}`}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Message
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className={`min-h-[180px] rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-cyan-400 ${errors.message ? "border-red-400" : ""}`}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-400">{errors.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-7 text-base font-bold text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(34,211,238,0.45)] disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-24 rounded-[36px] border border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-12 text-center backdrop-blur-2xl"
        >
          <h2 className="text-4xl font-black leading-tight md:text-5xl">
            Let's Build the Future of
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {" "}
              Student Learning
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300/75">
            PeerLearn is built to connect learners, mentors, and innovators.
            Join us in creating a stronger collaborative learning ecosystem.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-5">
            <Link to="/signup">
              <Button className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-7 text-black hover:scale-105 transition-all duration-300">
                Join PeerLearn
              </Button>
            </Link>

            <Link to="/">
              <Button
                variant="outline"
                className="rounded-2xl border border-cyan-400/40 bg-white/5 px-8 py-7 text-cyan-300 hover:bg-cyan-400/10"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
