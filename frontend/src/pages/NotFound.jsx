import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  finance: "/admin/finance/invoices",
};

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f9ff",
        flexDirection: "column",
        textAlign: "center",
        padding: 40,
      }}
    >
      <i className="bi bi-exclamation-circle" style={{ fontSize: 80, color: "#4154f1" }} />
      <h1 style={{ fontSize: 80, fontWeight: 800, color: "#dee0f2", lineHeight: 1 }}>404</h1>
      <h2 style={{ color: "#012970", fontWeight: 700 }}>Page Not Found</h2>
      <p className="text-muted mb-4">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="d-flex gap-2 justify-content-center">
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2" />Go Back
        </button>
        <button className="btn btn-outline-primary" onClick={() => navigate("/")}>
          <i className="bi bi-house me-2" />Home
        </button>
      </div>
    </div>
  );
}

export function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = ROLE_HOME[user?.role] || "/login";
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f9ff",
        flexDirection: "column",
        textAlign: "center",
        padding: 40,
      }}
    >
      <i className="bi bi-shield-x" style={{ fontSize: 72, color: "#dc3545" }} />
      <h2 style={{ color: "#012970", fontWeight: 700, marginTop: 20 }}>Access Denied</h2>
      <p className="text-muted mb-2">You don't have permission to view this page.</p>
      {user && (
        <p className="text-muted mb-4">
          Your role: <span className="badge bg-secondary text-capitalize">{user.role}</span>
        </p>
      )}
      <button className="btn btn-primary" onClick={() => navigate(home)}>
        <i className="bi bi-arrow-left me-2" />Back to My Portal
      </button>
    </div>
  );
}

export default NotFound;