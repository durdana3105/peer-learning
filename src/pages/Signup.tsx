import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ✅ Proper TypeScript type
type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const Signup = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { user, loading, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    const errs: FormErrors = {};

    if (!name.trim()) errs.name = "Name is required";

    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Invalid email format";

    if (!password) errs.password = "Password is required";
    else if (password.length < 8)
      errs.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      errs.password = "Must include uppercase, lowercase, and number";

    if (password !== confirmPassword)
      errs.confirmPassword = "Passwords don't match";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    setIsLoading(false);

    /*if (data.user) {
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          email: data.user.email,
          name:
            data.user.user_metadata?.name ||
            data.user.email.split("@")[0],
          avatar_url: `https://api.dicebear.com/9.x/initials/svg?seed=${data.user.email}`,
        },
      ]);
    
      console.log("INSERT ERROR:", insertError);
    }*/


    /*  if (error) {
        setIsLoading(false);
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
  */
    // 📦 Step 2: Insert into DB
    /*const { error: dbError } = await supabase.from("users").insert([
      {
        id: data.user?.id,
        name,
        email,
        skills: "",
        learning_goals: "",
      },
    ]);*/

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Account created!",
      description: "Welcome 🎉",
    });

    navigate("/onboarding");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-[#0b1329] to-background px-4 font-[Inter] text-slate-100">

      {/* Glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(var(--theme-color-1),0.15),transparent)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(var(--theme-color-1),0.15)]"
      >
        <div className="mb-7 text-cyan-400">
            <Link
              to="/"
              className="cursor-pointer"
            >
              ← Back to Home
            </Link>
          </div>
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500">
              <BookOpen className="h-5 w-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-200">
              PeerLearn
            </span>
          </Link>

          <h1 className="mt-4 text-2xl font-semibold text-slate-100">
            Create your account
          </h1>
          <p className="text-sm text-slate-300/60 mt-1">
            Start your learning journey today
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name */}
          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-400/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}

          {/* Email */}
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-400/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}

          {/* Password */}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-400/50 focus:border-cyan-400"
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}

          {/* Confirm Password */}
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-400/50 focus:border-cyan-400"
            />

            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}

          {/* Button */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-semibold shadow-[0_0_15px_rgba(var(--theme-color-1),0.4)]"
            >
              {isLoading ? "Creating..." : "Sign Up"}
            </Button>
          </motion.div>

        </form>

        {/* Login redirect */}
        <p className="mt-6 text-center text-sm text-slate-300/70">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Log in
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Signup;
