import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { user, loading } = useAuth();
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

  const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

console.log("SIGNUP DATA:", data);

if (data.user) {
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
}

    if (error) {
      setIsLoading(false);
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // 📦 Step 2: Insert into DB
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: data.user?.id,
        name,
        email,
        skills: "",
        learning_goals: "",
      },
    ]);

    setIsLoading(false);

    if (dbError) {
      toast({
        title: "Database error",
        description: dbError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome 🎉",
      });
      navigate("/dashboard");
    }
  };

 if (loading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-950">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-400 border-t-transparent" />
    </div>
  );
}

return (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 px-4 font-[Inter] text-emerald-100">

    {/* Glow background */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.15),transparent)] pointer-events-none" />

    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(34,197,94,0.15)]"
    >

      {/* Logo */}
      <div className="mb-8 text-center">
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500">
            <BookOpen className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-bold tracking-tight text-emerald-200">
            PeerLearn
          </span>
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-emerald-100">
          Create your account
        </h1>
        <p className="text-sm text-emerald-300/60 mt-1">
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
          className="bg-white/5 border border-white/10 text-emerald-100 placeholder:text-emerald-400/50 focus:border-green-400 focus:ring-1 focus:ring-green-400"
        />
        {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}

        {/* Email */}
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/5 border border-white/10 text-emerald-100 placeholder:text-emerald-400/50 focus:border-green-400 focus:ring-1 focus:ring-green-400"
        />
        {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}

        {/* Password */}
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-white/5 border border-white/10 text-emerald-100 placeholder:text-emerald-400/50 focus:border-green-400"
        />
        {errors.password && (
          <p className="text-red-400 text-sm">{errors.password}</p>
        )}

        {/* Confirm Password */}
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-white/5 border border-white/10 text-emerald-100 placeholder:text-emerald-400/50 focus:border-green-400"
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-sm">
            {errors.confirmPassword}
          </p>
        )}

        {/* Button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold shadow-[0_0_15px_rgba(34,197,94,0.4)]"
          >
            {isLoading ? "Creating..." : "Sign Up"}
          </Button>
        </motion.div>

      </form>

      {/* Login redirect */}
      <p className="mt-6 text-center text-sm text-emerald-300/70">
        Already have an account?{" "}
        <Link to="/login" className="text-green-400 hover:underline">
          Log in
        </Link>
      </p>

    </motion.div>
  </div>
);
};

export default Signup;