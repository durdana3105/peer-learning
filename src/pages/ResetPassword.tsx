import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { runSupabaseAuthRequest } from "@/lib/supabaseAuthErrors";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const isRecoveryLink = hashParams.get("type") === "recovery";

    if (!isRecoveryLink) {
      setIsRecoverySession(false);
      setIsCheckingRecovery(false);
      setMessage("Invalid or expired reset link. Request a new password reset email.");
      return () => {
        cancelled = true;
      };
    }

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setIsRecoverySession(false);
      setIsCheckingRecovery(false);
      setMessage("Invalid or expired reset link. Request a new password reset email.");
    }, 10000);

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        window.clearTimeout(timeoutId);
        setIsRecoverySession(true);
        setIsCheckingRecovery(false);
        setMessage("");
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isCheckingRecovery) {
      setMessage("Checking reset link. Please wait a moment.");
      return;
    }

    if (!isRecoverySession) {
      setMessage("Invalid or expired reset link. Request a new password reset email.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { error } = await runSupabaseAuthRequest(() =>
      supabase.auth.updateUser({ password })
    );

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated successfully! Redirecting to login...");
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <h2>Reset Password</h2>

      <form onSubmit={handleReset} style={styles.form}>
        <input
          type="password"
          placeholder="Enter new password"
          required
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Confirm new password"
          required
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button} disabled={isCheckingRecovery || !isRecoverySession}>
          Reset Password
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "300px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};

export default ResetPassword;
