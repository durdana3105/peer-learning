import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("✅ Reset link sent! Check your email.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-6 text-white">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Glow Effects */}
      <div className="absolute left-0 top-0 h-[400px] w-[400px] bg-cyan-500/20 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] bg-blue-600/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-400/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)]">
        {/* Back Button */}
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            <BookOpen className="h-7 w-7 text-black" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Forgot Password
          </h1>

          <p className="mt-2 text-slate-400">
            Enter your email address and we'll send you a password reset link.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-cyan-400"
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 font-bold text-black shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:opacity-90"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        {/* Message */}
        {message && (
          <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-center text-sm text-cyan-300">
            {message}
          </div>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;