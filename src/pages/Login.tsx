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

// ✅ Auto redirect if already logged in
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
  navigate("/dashboard"); // ✅ redirect after login
}


};

// 🔥 FIXED GOOGLE LOGIN (IMPORTANT)
const handleGoogleLogin = async () => {
const { error } = await supabase.auth.signInWithOAuth({
provider: "google",
options: {
redirectTo: "https://peer-learning1.vercel.app/dashboard",
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

if (loading) {
return ( <div className="flex min-h-screen items-center justify-center"> <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /> </div>
);
}

return ( <div className="flex min-h-screen items-center justify-center bg-background px-4">
<motion.div
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
className="w-full max-w-md"
> <div className="mb-8 text-center"> <Link to="/" className="inline-flex items-center gap-2"> <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero"> <BookOpen className="h-5 w-5 text-primary-foreground" /> </div> <span className="text-2xl font-bold">PeerLearn</span> </Link> <h1 className="mt-6 text-2xl font-bold">Welcome back</h1> </div>


    <form onSubmit={handleSubmit} className="space-y-4">

      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {errors.email && (
        <p className="text-red-500 text-sm">{errors.email}</p>
      )}

      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {errors.password && (
        <p className="text-red-500 text-sm">{errors.password}</p>
      )}

      <div className="text-right">
        <Link to="/forgot-password" className="text-sm text-primary">
          Forgot Password?
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={rememberMe}
          onCheckedChange={(c) => setRememberMe(!!c)}
        />
        <Label>Remember me</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Logging in..." : "Log in"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
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

    <p className="mt-6 text-center text-sm">
      Don’t have an account?{" "}
      <Link to="/signup" className="text-primary">
        Sign up
      </Link>
    </p>
  </motion.div>
</div>


);
};

export default Login;
