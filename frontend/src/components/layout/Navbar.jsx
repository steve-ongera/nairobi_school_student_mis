// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../../hooks";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useTheme();
  const navigate  = useNavigate();
  const searchRef = useRef(null);

  const [showSearch,  setShowSearch]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getRoleDisplay = (role) => {
    const roles = {
      admin:   "Administrator",
      teacher: "Teacher",
      student: "Student",
      finance: "Finance Officer",
    };
    return roles[role] || role;
  };

  return (
    <header className="header">

      {/* ── LEFT: Logo + sidebar toggle ──────────────────────── */}
      <div className="header-left">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <i className="bi bi-mortarboard-fill" />
          </div>
          <span className="logo-text">SchoolMIS Pro</span>
        </Link>
        <i className="bi bi-list toggle-sidebar-btn" onClick={toggleSidebar} />
      </div>

      {/* ── CENTRE: Search bar ───────────────────────────────── */}
      <div
        className={`header-search${showSearch ? " header-search--open" : ""}`}
        ref={searchRef}
      >
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search students, exams, fees…"
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" aria-label="Submit search">
            <i className="bi bi-search" />
          </button>
        </form>
      </div>

      {/* ── RIGHT: Action icons ──────────────────────────────── */}
      <nav className="header-actions">

        {/* Mobile: show search input */}
        <button
          className="header-icon-btn d-lg-none"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Toggle search"
        >
          <i className="bi bi-search" />
        </button>

        {/* Notifications dropdown */}
        <div className="nav-item dropdown">
          <span
            className="header-icon-btn"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="bi bi-bell" />
            <span className="badge-number">3</span>
          </span>

          <ul className="dropdown-menu dropdown-menu-end">
            <li className="dropdown-header">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Notifications</h6>
                <Link to="/notifications" className="small">View all</Link>
              </div>
            </li>
            <li><hr className="dropdown-divider" /></li>

            <li>
              <Link className="dropdown-item" to="/notifications/payment">
                <i className="bi bi-cash-coin text-success" />
                <div>
                  <div className="fw-semibold">Fee payment received</div>
                  <small className="text-muted">MPESA – KES 15,000</small>
                </div>
              </Link>
            </li>
            <li><hr className="dropdown-divider" /></li>

            <li>
              <Link className="dropdown-item" to="/notifications/exam">
                <i className="bi bi-journal-check text-primary" />
                <div>
                  <div className="fw-semibold">Exam results published</div>
                  <small className="text-muted">End Term 1 – Form 2</small>
                </div>
              </Link>
            </li>
            <li><hr className="dropdown-divider" /></li>

            <li>
              <Link className="dropdown-item" to="/notifications/student">
                <i className="bi bi-person-plus text-warning" />
                <div>
                  <div className="fw-semibold">New student admitted</div>
                  <small className="text-muted">Form 1 – Stream A</small>
                </div>
              </Link>
            </li>
          </ul>
        </div>

        {/* Profile dropdown */}
        <div className="nav-item dropdown">
          <span
            className="nav-profile"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="rounded-circle" />
            ) : (
              <div className="avatar-initials">{getInitials()}</div>
            )}
           
            <i className="bi bi-chevron-down profile-chevron" />
          </span>

          <ul className="dropdown-menu dropdown-menu-end">
            <li className="dropdown-header">
              <h6 className="mb-1">{user?.full_name || user?.email}</h6>
              <span className="text-capitalize">{getRoleDisplay(user?.role)}</span>
            </li>
            <li><hr className="dropdown-divider" /></li>

            <li>
              <Link className="dropdown-item" to="/profile">
                <i className="bi bi-person" /><span>My Profile</span>
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" to="/change-password">
                <i className="bi bi-shield-lock" /><span>Change Password</span>
              </Link>
            </li>
            <li>
              <Link className="dropdown-item" to="/settings">
                <i className="bi bi-sliders2" /><span>Preferences</span>
              </Link>
            </li>
            <li><hr className="dropdown-divider" /></li>

            <li>
              <button className="dropdown-item text-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" /><span>Sign Out</span>
              </button>
            </li>
          </ul>
        </div>

      </nav>
    </header>
  );
}