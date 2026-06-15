import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setSubmitted(true);
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .forgot-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #0f172a 0%,
            #1e293b 50%,
            #111827 100%
          );
        }

        .forgot-page::before,
        .forgot-page::after {
          content: "";
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          filter: blur(90px);
          z-index: 0;
        }

        .forgot-page::before {
          background: rgba(59, 130, 246, 0.2);
          top: -120px;
          left: -120px;
        }

        .forgot-page::after {
          background: rgba(139, 92, 246, 0.2);
          bottom: -120px;
          right: -120px;
        }

        .forgot-card {
          width: 100%;
          max-width: 430px;
          padding: 40px 32px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .icon-box {
          width: 70px;
          height: 70px;
          margin: 0 auto 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .title {
          color: #fff;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          top: 50%;
          left: 15px;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .input {
          width: 100%;
          padding: 14px 16px 14px 45px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.06);
          color: white;
          font-size: 15px;
          outline: none;
          transition: all 0.3s ease;
        }

        .input::placeholder {
          color: rgba(255,255,255,0.45);
        }

        .input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.15);
        }

        .button {
          padding: 14px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          color: white;
          font-size: 15px;
          font-weight: 600;
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #8b5cf6 100%
          );
          transition: all 0.25s ease;
        }

        .button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.3);
        }

        .button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 15px;
          color: #fca5a5;
          font-size: 14px;
        }

        .back-link {
          margin-top: 24px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #cbd5e1;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s ease;
        }

        .back-link:hover {
          color: white;
        }

        .success-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .success-icon {
          font-size: 56px;
          margin-bottom: 15px;
        }

        .success-title {
          color: white;
          font-size: 1.8rem;
          margin-bottom: 12px;
        }

        .success-text {
          color: rgba(255,255,255,0.75);
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .email-highlight {
          color: white;
          font-weight: 600;
          word-break: break-word;
        }

        @media (max-width: 480px) {
          .forgot-card {
            padding: 30px 20px;
          }

          .title {
            font-size: 1.75rem;
          }

          .success-title {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <div className="forgot-page">
        <div className="forgot-card">
          {!submitted ? (
            <>
              <div className="icon-box">
                <Lock size={30} />
              </div>

              <h1 className="title">Forgot Password?</h1>

              <p className="subtitle">
                No worries. Enter your email address and we'll send you a secure
                password reset link.
              </p>

              <form className="form" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />

                  <input
                    type="email"
                    className="input"
                    placeholder="Enter your email address"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button type="submit" className="button" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              {message && <div className="error-message">{message}</div>}

              <Link to="/login" className="back-link">
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </>
          ) : (
            <div className="success-container">
              <div className="success-icon">✅</div>

              <h2 className="success-title">Check Your Email</h2>

              <p className="success-text">
                We've sent a password reset link to:
              </p>

              <div className="email-highlight">{email}</div>

              <p className="success-text" style={{ marginTop: "15px" }}>
                Please check your inbox (and spam folder) and follow the
                instructions to reset your password.
              </p>

              <Link to="/login" className="back-link">
                <ArrowLeft size={16} />
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
