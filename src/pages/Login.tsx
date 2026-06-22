import { supabase, supabaseMisconfigured } from "@/integrations/supabase/client";
import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, ArrowRight } from "lucide-react";
import googleIcon from "@/assets/google-icon.svg";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";


type Errors = {
  email?: string;
  password?: string;
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const { user, loading, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const errs: Errors = {};

    if (!email.trim()) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    const { error } = await signIn(email, password);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back 🚀",
      });

      navigate("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    if (supabaseMisconfigured) {
      toast({
        title: "Not configured",
        description:
          "Supabase environment variables are not set. Configure VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("signInWithOAuth error:", error);
        toast({
          title: "Google login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Uncaught exception in signInWithOAuth:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #020617 0%, #0d0d2b 40%, #020617 100%)' }}>

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Glow Orbs */}
      <div className="absolute -top-20 -left-20 h-[450px] w-[450px] orb orb-cyan opacity-50" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] orb orb-indigo opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] orb orb-purple opacity-25" />

      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-16 z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-5 py-2 text-cyan-300">
            ✨ Student Powered Learning Ecosystem
          </div>

          <h1 className="text-6xl font-extrabold leading-tight">
            Learn From
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Seniors.
            </span>
            <br />
            Grow With
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {" "}
              Peers.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-300 leading-relaxed">
            Join live mentorship sessions, collaborate with classmates,
            solve doubts instantly, and become part of a futuristic
            collaborative learning community.
          </p>

          <div className="mt-8 flex gap-4">
            <Button 
              onClick={() => navigate("/signup")}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-6 text-black font-semibold hover:scale-105 transition-all"
            >
              Join as Learner
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/become-mentor")}
              className="rounded-xl border-cyan-400/20 bg-white/5 px-8 py-6 text-cyan-300 hover:bg-cyan-500/10"
            >
              Become a Mentor
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
              🔥 120 students joined today
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
              🎥 12 live sessions running
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
              💬 45 active discussions
            </div>
          </div>
        </motion.div>
      </div>

      {/* RIGHT LOGIN CARD */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, type: 'spring' }}
          className="w-full max-w-md relative"
          style={{
            background: 'rgba(13, 13, 43, 0.7)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '28px',
            boxShadow: '0 0 60px rgba(99,102,241,0.2), 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            padding: '2.5rem',
          }}
        >
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[28px]" style={{ background: 'linear-gradient(90deg, #22d3ee, #6366f1, #a855f7)' }} />

          <div className="mb-7 text-indigo-400">
            <Link to="/" className="cursor-pointer hover:text-indigo-300 transition-colors">
              ← Back to Home
            </Link>
          </div>
          {/* LOGO */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1, #a855f7)', boxShadow: '0 0 25px rgba(99,102,241,0.5)' }}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', background: 'linear-gradient(135deg, #22d3ee, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PeerLearn
              </span>
            </Link>

            <h2 className="mt-8 text-3xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome Back 👋
            </h2>
            <p className="mt-2 text-slate-400">Continue your futuristic learning journey</p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <Input
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input h-12 rounded-xl text-white placeholder:text-slate-500"
              />

              {errors.email && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input h-12 rounded-xl text-white placeholder:text-slate-500 pr-12"
              />

              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errors.password && (
              <p className="text-sm text-red-400">
                {errors.password}
              </p>
            )}

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                Forgot Password?
              </Link>
            </div>

            {/* LOGIN BUTTON */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1, #a855f7)', boxShadow: '0 0 25px rgba(99,102,241,0.4)' }}
              >
                {isLoading ? "Logging in..." : "Log In"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            {/* GOOGLE */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="h-12 w-full glass-button rounded-xl text-slate-200 hover:text-white border-white/10"
            >
              <img src={googleIcon} alt="google" className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
          </form>

          {/* SIGNUP */}
          <p className="mt-8 text-center text-sm text-slate-400">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-cyan-400 hover:text-cyan-300"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
