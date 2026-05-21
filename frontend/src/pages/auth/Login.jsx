// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks";

const ROLE_REDIRECT = {
  admin:   "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent:  "/student/dashboard",
  finance: "/admin/finance/invoices",
};

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_REDIRECT[user.role] || "/");
    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .lp-root {
          min-height: 100vh;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Inter', sans-serif;
        }

        .lp-card {
          background: #ffffff;
          border-radius: 15px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -8px rgba(0,0,0,0.08);
          width: 100%;
          max-width: 420px;
          padding: 48px 44px;
          border: 1px solid #e2e8f0;
        }

        /* Logo */
        .lp-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 36px;
        }

        .lp-logo img {
          width: 80px;
          height: 80px;
          object-fit: contain;
          margin-bottom: 16px;
        }

        .lp-logo-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 8px 20px rgba(37,99,235,0.25);
        }

        .lp-logo-icon i {
          font-size: 26px;
          color: #fff;
        }

        .lp-logo h1 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .lp-logo p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          text-align: center;
        }

        /* Divider */
        .lp-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 0 0 28px;
        }

        /* Error */
        .lp-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          color: #dc2626;
          margin-bottom: 20px;
          animation: lp-shake 0.35s ease;
        }

        @keyframes lp-shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-4px); }
          75%      { transform: translateX(4px); }
        }

        /* Fields */
        .lp-field {
          margin-bottom: 18px;
        }

        .lp-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
        }

        .lp-input-wrap {
          display: flex;
          align-items: center;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s;
          overflow: hidden;
        }

        .lp-input-wrap:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }

        .lp-ico {
          padding: 0 13px;
          color: #94a3b8;
          font-size: 15px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .lp-input-wrap input {
          flex: 1;
          border: 0;
          outline: 0;
          background: transparent;
          font-size: 14px;
          color: #0f172a;
          padding: 11px 10px 11px 0;
          font-family: 'Inter', sans-serif;
        }

        .lp-input-wrap input::placeholder {
          color: #cbd5e1;
        }

        .lp-eye {
          border: 0;
          background: none;
          padding: 0 13px;
          cursor: pointer;
          color: #94a3b8;
          font-size: 15px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .lp-eye:hover { color: #2563eb; }

        /* Submit button */
        .lp-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.3);
          letter-spacing: 0.01em;
        }

        .lp-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.38);
        }

        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Footer */
        .lp-foot {
          margin-top: 28px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.8;
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
        }

        .lp-foot a {
          color: #2563eb;
          font-weight: 600;
          text-decoration: none;
        }

        .lp-foot a:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .lp-card { padding: 36px 28px; }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-card">

          {/* Logo & Heading */}
          <div className="lp-logo">
            <img src="/logo.jpg" alt="SchoolMIS Logo" />
            <h1>SchoolMIS</h1>
            <p>Sign in to access your dashboard</p>
          </div>

          <div className="lp-divider" />

          {/* Error */}
          {error && (
            <div className="lp-error">
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-email">Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-ico"><i className="bi bi-envelope" /></span>
                <input
                  id="lp-email"
                  type="email"
                  placeholder="you@school.ac.ke"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-password">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-ico"><i className="bi bi-lock" /></span>
                <input
                  id="lp-password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi bi-eye${showPw ? "-slash" : ""}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? (
                <><span className="spinner-border spinner-border-sm" role="status" /> Signing in…</>
              ) : (
                <><i className="bi bi-box-arrow-in-right" /> Sign In</>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="lp-foot">
            Forgot password? <a href="mailto:admin@school.ac.ke">Contact admin</a>
            <br />
            © {new Date().getFullYear()} SchoolMIS — Kencom Softwares Ltd
          </div>

        </div>
      </div>
    </>
  );
}