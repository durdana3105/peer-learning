import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const hasRecoveryHash =
          window.location.hash.includes("type=recovery");

        // Valid only if Supabase session exists AND came from recovery flow
        if (session && hasRecoveryHash) {
          setIsValidSession(true);
        } else {
          setMessage(
            "Invalid or expired reset link. Please request a new password reset email."
          );
        }
      } catch (err) {
        setMessage("Failed to validate reset session.");
      } finally {
        setLoading(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!isValidSession) {
      setMessage("Unauthorized password reset attempt.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Password updated successfully. Redirecting...");

      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Validating reset session...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Reset Password</h2>

      <form onSubmit={handleReset} style={styles.form}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={styles.input}
        />

        <button type="submit" style={styles.button} disabled={!isValidSession}>
          Update Password
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

const styles = {
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