import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorText, setErrorText] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorText("Email is required");
      return;
    }
    setErrorText("");
    setIsLoading(true);

    try {
      // Use window.location.origin so the reset link works in every environment
      // (localhost, staging, production) without any code change.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      setIsLoading(false);

      if (error) {
        toast({
          title: "Error sending reset link",
          description: error.message,
          variant: "destructive",
        });
        setErrorText(error.message);
      } else {
        toast({
          title: "Reset link sent! 🚀",
          description: "Check your email for the password recovery link.",
        });
        setIsSent(true);
      }
    } catch (err) {
      setIsLoading(false);
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({
        title: "Error sending reset link",
        description: errMsg,
        variant: "destructive",
      });
      setErrorText(errMsg);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#020817] text-white">
      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* GLOW EFFECTS */}
      <div className="absolute top-0 left-0 h-[500px] w-[500px] bg-cyan-500/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] bg-blue-600/20 blur-[140px]" />

      {/* CENTERED CARD */}
      <div className="flex w-full items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md rounded-3xl border border-cyan-400/10 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)]"
        >
          <div className="mb-7 text-cyan-400">
            <Link to="/login" className="cursor-pointer">
              ← Back to Login
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
              Forgot Password
            </h2>

            <p className="mt-2 text-slate-400">
              Recover your futuristic learning account
            </p>
          </div>

          {isSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-3xl">
                ✉️
              </div>
              <h3 className="text-xl font-semibold text-white">Check your email</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                We've sent a password reset link to <span className="font-semibold text-cyan-300">{email}</span>. Please click the link in the email to set a new password.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:opacity-90">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            /* FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400"
                />

                {errorText && (
                  <p className="mt-2 text-sm text-red-400">
                    {errorText}
                  </p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:opacity-90"
                >
                  {isLoading ? "Sending link..." : "Send Reset Link"}

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </form>
          )}

          {/* SIGNUP / BACK */}
          <p className="mt-8 text-center text-sm text-slate-400">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-cyan-400 hover:text-cyan-300"
            >
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
