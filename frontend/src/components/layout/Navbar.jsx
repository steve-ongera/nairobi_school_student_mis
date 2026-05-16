// src/components/layout/Navbar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../../hooks";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useTheme();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Generate 1-2 letter initials from full name
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="header d-flex align-items-center">
      <div className="d-flex align-items-center justify-content-between w-100">

        {/* ── Logo ───────────────────────────────────────────── */}
        <Link to="/" className="logo d-flex align-items-center">
          <i
            className="bi bi-mortarboard-fill text-primary me-2"
            style={{ fontSize: 26 }}
          />
          <span>SchoolMIS</span>
        </Link>

        {/* ── Toggle sidebar ─────────────────────────────────── */}
        <i
          className="bi bi-list toggle-sidebar-btn"
          onClick={toggleSidebar}
        />

        {/* ── Search bar ─────────────────────────────────────── */}
        <div className={`search-bar ${showSearch ? "search-bar-show" : ""}`}>
          <form
            className="search-form d-flex align-items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              placeholder="Search students, exams, fees…"
              aria-label="Search"
            />
            <button type="submit" aria-label="Submit search">
              <i className="bi bi-search" />
            </button>
          </form>
        </div>

        {/* ── Right-side icons ───────────────────────────────── */}
        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">

            {/* Mobile search toggle */}
            <li className="nav-item d-block d-lg-none">
              <button
                className="btn border-0 p-0"
                style={{ fontSize: 22, color: "var(--primary-deep)" }}
                onClick={() => setShowSearch((s) => !s)}
                aria-label="Toggle search"
              >
                <i className="bi bi-search" />
              </button>
            </li>

            {/* ── Notifications ────────────────────────────── */}
            <li className="nav-item dropdown">
              <span
                className="nav-link nav-icon"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-bell" />
                <span className="badge-number badge bg-primary">3</span>
              </span>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
                <li className="dropdown-header">
                  You have <b>3</b> new notifications
                  <Link to="/notifications">
                    <span className="badge rounded-pill bg-primary p-2 ms-2">
                      View all
                    </span>
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li className="notification-item">
                  <i className="bi bi-cash-coin text-success" />
                  <div>
                    <h4>Fee payment received</h4>
                    <p>MPESA – KES 15,000</p>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li className="notification-item">
                  <i className="bi bi-journal-check text-primary" />
                  <div>
                    <h4>Exam results published</h4>
                    <p>End Term 1 – Form 2</p>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li className="notification-item">
                  <i className="bi bi-person-plus text-warning" />
                  <div>
                    <h4>New student admitted</h4>
                    <p>Form 1 – Stream A</p>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li className="dropdown-footer">
                  <Link to="/notifications">Show all notifications</Link>
                </li>
              </ul>
            </li>

            {/* ── Profile ──────────────────────────────────── */}
            <li className="nav-item dropdown pe-3">
              <span
                className="nav-link nav-profile d-flex align-items-center pe-0 gap-2"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ cursor: "pointer" }}
              >
                {/* Avatar: show photo if available, else initials */}
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="rounded-circle"
                    style={{ width: 36, height: 36, objectFit: "cover" }}
                  />
                ) : (
                  <div className="avatar-initials">{initials}</div>
                )}

                <span className="d-none d-md-block fw-semibold" style={{ fontSize: 14 }}>
                  {user?.full_name?.split(" ")[0] ?? "User"}
                </span>
                <i className="bi bi-chevron-down d-none d-md-block" style={{ fontSize: 11 }} />
              </span>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header px-4 py-3">
                  <h6 className="mb-1">{user?.full_name}</h6>
                  <span className="text-capitalize text-muted" style={{ fontSize: 12 }}>
                    {user?.role}
                  </span>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/profile">
                    <i className="bi bi-person text-primary" />
                    <span>My Profile</span>
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/change-password">
                    <i className="bi bi-lock text-secondary" />
                    <span>Change Password</span>
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/settings">
                    <i className="bi bi-gear text-secondary" />
                    <span>Account Settings</span>
                  </Link>
                </li>

                <li><hr className="dropdown-divider" /></li>

                <li>
                  <button
                    className="dropdown-item d-flex align-items-center text-danger w-100"
                    style={{ border: 0, background: "none" }}
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right" />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            </li>

          </ul>
        </nav>
      </div>
    </header>
  );
}