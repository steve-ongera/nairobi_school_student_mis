import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks";

const ROLE_REDIRECT = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent: "/student/dashboard",
  finance: "/admin/finance/invoices",
};

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_REDIRECT[user.role] || "/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-area">
          <i className="bi bi-mortarboard-fill" style={{ fontSize: 48, color: "#4154f1" }} />
          <h2>SchoolMIS Kenya</h2>
          <p>Sign in to your portal</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-sm py-2 px-3 mb-3" role="alert">
            <i className="bi bi-exclamation-circle me-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-600 text-primary-dark">Email Address</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope" /></span>
              <input
                type="email"
                className="form-control"
                placeholder="you@school.ac.ke"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-600 text-primary-dark">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock" /></span>
              <input
                type={showPass ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPass((s) => !s)}
                tabIndex={-1}
              >
                <i className={`bi bi-eye${showPass ? "-slash" : ""}`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Signing in…
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <small className="text-muted">
            Forgot your password?{" "}
            <a href="mailto:admin@school.ac.ke">Contact your administrator</a>
          </small>
        </div>

        <div className="mt-3 pt-3 border-top">
          <div className="row text-center g-2">
            {[
              { role: "Admin", icon: "bi-shield-check", color: "#012970" },
              { role: "Teacher", icon: "bi-person-badge", color: "#4154f1" },
              { role: "Student", icon: "bi-person-circle", color: "#2eca6a" },
              { role: "Finance", icon: "bi-cash-stack", color: "#ff771d" },
            ].map((p) => (
              <div key={p.role} className="col-3">
                <div className="p-2 rounded" style={{ background: "#f6f9ff" }}>
                  <i className={`bi ${p.icon}`} style={{ color: p.color, fontSize: 20 }} />
                  <div style={{ fontSize: 11, color: "#899bbd", marginTop: 4 }}>{p.role}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center mt-2 mb-0" style={{ fontSize: 11, color: "#aab7cf" }}>
            Multi-role portal system
          </p>
        </div>
      </div>
    </div>
  );
}