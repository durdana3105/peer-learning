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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="flex items-center justify-center gap-2">
            <BookOpen />
            <span className="text-xl font-bold">PeerLearn</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}

          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmPassword}
            </p>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Sign Up"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;