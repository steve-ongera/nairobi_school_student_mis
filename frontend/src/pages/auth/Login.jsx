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

const ROLES = [
  { role: "Admin",   icon: "bi-shield-check" },
  { role: "Teacher", icon: "bi-person-badge" },
  { role: "Student", icon: "bi-person-circle" },
  { role: "Finance", icon: "bi-cash-stack" },
];

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
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Open+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        .lp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Open Sans', sans-serif;
          background: #f0f5ff;
        }

        /* ─── Left blue panel ─────────────────────── */
        .lp-left {
          flex: 1;
          background: linear-gradient(155deg, #012970 0%, #1a73e8 60%, #4ba3f5 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 48px;
          position: relative;
          overflow: hidden;
        }
        .lp-left::before {
          content: '';
          position: absolute;
          width: 520px; height: 520px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          top: -190px; right: -170px;
          pointer-events: none;
        }
        .lp-left::after {
          content: '';
          position: absolute;
          width: 340px; height: 340px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          bottom: -110px; left: -90px;
          pointer-events: none;
        }
        .lp-left-inner {
          position: relative; z-index: 1;
          max-width: 380px;
          text-align: center;
        }

        .lp-logo-ring {
          width: 90px; height: 90px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 22px;
          backdrop-filter: blur(8px);
        }
        .lp-logo-ring i { font-size: 42px; color: #fff; }

        .lp-left h1 {
          font-family: 'Nunito', sans-serif;
          font-size: 28px; font-weight: 900;
          color: #fff; margin: 0 0 6px;
          letter-spacing: -0.5px;
        }
        .lp-left > .lp-left-inner > p {
          font-size: 13.5px;
          color: rgba(255,255,255,0.72);
          margin: 0 0 40px;
          line-height: 1.6;
        }

        .lp-role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          width: 100%;
        }
        .lp-role-tile {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 16px 10px 12px;
          text-align: center;
          backdrop-filter: blur(6px);
          transition: background 0.2s, transform 0.2s;
        }
        .lp-role-tile:hover {
          background: rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }
        .lp-role-tile i {
          font-size: 24px; color: #fff;
          display: block; margin-bottom: 7px;
        }
        .lp-role-tile span {
          font-size: 11px; font-weight: 700;
          color: rgba(255,255,255,0.85);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .lp-tagline {
          margin-top: 32px;
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ─── Right form panel ────────────────────── */
        .lp-right {
          width: 480px;
          flex-shrink: 0;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 52px 52px;
          box-shadow: -4px 0 40px rgba(1,41,112,0.07);
        }
        .lp-right-inner { width: 100%; max-width: 360px; }

        .lp-head { margin-bottom: 32px; }
        .lp-head h2 {
          font-family: 'Nunito', sans-serif;
          font-size: 26px; font-weight: 800;
          color: #012970; margin: 0 0 5px;
        }
        .lp-head p { font-size: 13px; color: #899bbd; margin: 0; }

        /* Error */
        .lp-error {
          display: flex; align-items: center; gap: 9px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 9px;
          padding: 11px 14px;
          font-size: 13px; color: #dc2626;
          margin-bottom: 20px;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-5px)}
          60%{transform:translateX(5px)}
        }
        .lp-error i { flex-shrink: 0; }

        /* Fields */
        .lp-field { margin-bottom: 20px; }
        .lp-label {
          display: block;
          font-size: 11.5px; font-weight: 700;
          color: #374151;
          margin-bottom: 7px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .lp-input-wrap {
          display: flex; align-items: center;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          background: #f9fbff;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          overflow: hidden;
        }
        .lp-input-wrap:focus-within {
          border-color: #1a73e8;
          box-shadow: 0 0 0 3px rgba(26,115,232,0.12);
          background: #fff;
        }
        .lp-ico {
          padding: 0 14px;
          color: #bbc8db;
          font-size: 16px;
          flex-shrink: 0;
          display: flex; align-items: center;
        }
        .lp-ico i { line-height: 0; }
        .lp-input-wrap input {
          flex: 1;
          border: 0; outline: 0;
          background: transparent;
          font-size: 14px;
          color: #1f2937;
          padding: 12px 10px 12px 0;
          font-family: 'Open Sans', sans-serif;
        }
        .lp-input-wrap input::placeholder { color: #c8d3e4; }
        .lp-eye {
          border: 0; background: none;
          padding: 0 14px; cursor: pointer;
          color: #bbc8db; font-size: 16px;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .lp-eye:hover { color: #1a73e8; }

        /* Submit */
        .lp-btn {
          width: 100%;
          padding: 13px;
          background: #1a73e8;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 15px; font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 16px rgba(26,115,232,0.3);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          margin-top: 6px;
        }
        .lp-btn:hover:not(:disabled) {
          background: #1557b0;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(26,115,232,0.38);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Divider */
        .lp-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 26px 0;
          font-size: 11px; color: #d1d5db;
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .lp-divider::before,.lp-divider::after {
          content:''; flex:1; border-top: 1px solid #e9edf5;
        }

        /* Trust badges */
        .lp-trust { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .lp-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #6b7280;
          background: #f4f7fd;
          border: 1px solid #e5ebf5;
          border-radius: 20px;
          padding: 4px 11px;
        }
        .lp-badge i { color: #1a73e8; font-size: 12px; }

        .lp-foot {
          margin-top: 26px;
          text-align: center;
          font-size: 12px; color: #aab7cf;
          line-height: 1.7;
        }
        .lp-foot a { color: #1a73e8; font-weight: 600; text-decoration: none; }
        .lp-foot a:hover { color: #1557b0; text-decoration: underline; }

        @media (max-width: 960px) {
          .lp-root { flex-direction: column; }
          .lp-left { padding: 40px 24px; }
          .lp-role-grid { grid-template-columns: repeat(4,1fr); }
          .lp-right { width: 100%; padding: 36px 24px 48px; }
        }
        @media (max-width: 520px) {
          .lp-role-grid { grid-template-columns: repeat(2,1fr); }
        }
      `}</style>

      <div className="lp-root">

        {/* ── Left branding panel ─────────────────────── */}
        <div className="lp-left">
          <div className="lp-left-inner">
            <div className="lp-logo-ring">
              <i className="bi bi-mortarboard-fill" />
            </div>
            <h1>SchoolMIS Kenya</h1>
            <p>Comprehensive School Management Information System for modern institutions</p>

            <div className="lp-role-grid">
              {ROLES.map(({ role, icon }) => (
                <div className="lp-role-tile" key={role}>
                  <i className={`bi ${icon}`} />
                  <span>{role}</span>
                </div>
              ))}
            </div>

            <p className="lp-tagline">Multi-role secure portal</p>
          </div>
        </div>

        {/* ── Right form panel ────────────────────────── */}
        <div className="lp-right">
          <div className="lp-right-inner">

            <div className="lp-head">
              <h2>Welcome back</h2>
              <p>Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="lp-error">
                <i className="bi bi-exclamation-triangle-fill" />
                {error}
              </div>
            )}

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
                    required autoFocus autoComplete="email"
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
                    required autoComplete="current-password"
                  />
                  <button
                    type="button" className="lp-eye"
                    onClick={() => setShowPw(s => !s)}
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

            <div className="lp-divider">Secure access</div>

            <div className="lp-trust">
              <span className="lp-badge"><i className="bi bi-shield-check" /> Encrypted</span>
              <span className="lp-badge"><i className="bi bi-person-lock" /> Role-based</span>
              <span className="lp-badge"><i className="bi bi-clock-history" /> Session-safe</span>
            </div>

            <div className="lp-foot">
              <span>
                Forgot password?{" "}
                <a href="mailto:admin@school.ac.ke">Contact admin</a>
              </span>
              <br />
              <span>© {new Date().getFullYear()} SchoolMIS — Kencom Softwares Ltd</span>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}