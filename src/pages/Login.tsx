import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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

  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ✅ Redirect if already logged in
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const errs: Errors = {};
    if (!email.trim()) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ✅ Normal login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back 🎉",
      });
      navigate("/dashboard");
    }
  };

  // 🔥 FIXED GOOGLE LOGIN (THIS WAS BROKEN BEFORE)
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 px-4 font-[Inter] text-emerald-100">

      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.15),transparent)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(34,197,94,0.15)]"
      >

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500">
              <BookOpen className="h-5 w-5 text-black" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-emerald-200">
              PeerLearn
            </span>
          </Link>

          <h1 className="mt-6 text-2xl font-semibold text-emerald-100">
            Welcome back
          </h1>
          <p className="text-sm text-emerald-300/60 mt-1">
            Continue your learning journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/5 border border-white/10 text-emerald-100 placeholder:text-emerald-400/50 focus:border-green-400 focus:ring-1 focus:ring-green-400"
          />
          {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}

          {/* Password */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border border-white/10 text-emerald-100 placeholder:text-emerald-400/50 focus:border-green-400"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {errors.password && (
            <p className="text-red-400 text-sm">{errors.password}</p>
          )}

          {/* Forgot */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-emerald-300 hover:text-green-400">
              Forgot Password?
            </Link>
          </div>

          {/* Remember */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(c) => setRememberMe(!!c)}
            />
            <Label className="text-emerald-300/80">Remember me</Label>
          </div>

          {/* Login Button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold shadow-[0_0_15px_rgba(34,197,94,0.4)]"
            >
              {isLoading ? "Logging in..." : "Log in"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-white/10 text-emerald-200 hover:bg-white/5"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="google"
              className="w-5 h-5"
            />
            Continue with Google
          </Button>

        </form>

        {/* Signup */}
        <p className="mt-6 text-center text-sm text-emerald-300/70">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-green-400 hover:underline">
            Sign up
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Login;