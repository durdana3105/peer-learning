import { supabase, supabaseMisconfigured } from "@/integrations/supabase/client";
import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="relative flex min-h-screen overflow-hidden bg-[#020817] text-white">

      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* GLOW EFFECTS */}
      <div className="absolute top-0 left-0 h-[500px] w-[500px] bg-cyan-500/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] bg-blue-600/20 blur-[140px]" />

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
            <Button className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-6 text-black font-semibold hover:scale-105 transition-all">
              Join as Learner
            </Button>

            <Button
              variant="outline"
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
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md rounded-3xl border border-cyan-400/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)]"
        >
          <div className="mb-7 text-cyan-400">
            <Link
              to="/"
              className="cursor-pointer"
            >
              ← Back to Home
            </Link>
          </div>
          {/* LOGO */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                <BookOpen className="h-6 w-6 text-black" />
              </div>

              <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                PeerLearn
              </span>
            </Link>

            <h2 className="mt-8 text-3xl font-bold text-white">
              Welcome Back
            </h2>

            <p className="mt-2 text-slate-400">
              Continue your futuristic learning journey
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <Input
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
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
                className="h-12 border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-cyan-400"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(!!c)}
                />

                <Label className="text-slate-300">
                  Remember me
                </Label>
              </div>

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
                className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:opacity-90"
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
              className="h-12 w-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="google"
                className="mr-2 h-5 w-5"
              />

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
