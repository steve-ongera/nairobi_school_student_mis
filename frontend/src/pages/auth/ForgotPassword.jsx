import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <div className="login-page">
      <div className="login-card text-center">
        <i className="bi bi-envelope-open" style={{ fontSize: 56, color: "#4154f1" }} />
        <h2 style={{ color: "#012970", marginTop: 16 }}>Forgot Password?</h2>
        <p className="text-muted mb-4">
          Password resets are managed by your school administrator.
          Please contact them directly.
        </p>
        <div className="p-3 rounded mb-4" style={{ background: "#f6f9ff" }}>
          <p className="mb-1 fw-600" style={{ color: "#012970" }}>School Admin Contact</p>
          <a href="mailto:admin@school.ac.ke">admin@school.ac.ke</a>
        </div>
        <Link to="/login" className="btn btn-primary w-100">
          <i className="bi bi-arrow-left me-2" />Back to Login
        </Link>
      </div>
    </div>
  );
}