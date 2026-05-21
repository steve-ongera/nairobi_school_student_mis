// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../../hooks";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useTheme();
  const navigate  = useNavigate();
  const searchRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const [showSearch,  setShowSearch]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

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
    <>
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

        {/* ── CENTRE: Search bar (desktop) ─────────────────────── */}
        <div className="header-search-desktop">
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
          {/* Mobile search toggle button */}
          <button
            className="header-icon-btn mobile-search-toggle"
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Toggle search"
          >
            <i className="bi bi-search" />
          </button>

          {/* Mobile menu toggle button */}
          <button
            className="header-icon-btn mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-three-dots-vertical'}`} />
          </button>

          {/* Desktop action items */}
          <div className="desktop-actions">
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
                <span className="profile-name">{user?.full_name?.split(' ')[0] || 'User'}</span>
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
          </div>
        </nav>

        {/* Mobile search overlay */}
        {showSearch && (
          <div className="mobile-search-overlay" ref={searchRef}>
            <form className="mobile-search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search students, exams, fees…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit">
                <i className="bi bi-search" />
              </button>
              <button type="button" onClick={() => setShowSearch(false)}>
                <i className="bi bi-x-lg" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu dropdown */}
      <div className={`mobile-menu-dropdown ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <div className="mobile-menu-header">
            <div className="mobile-user-info">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} />
              ) : (
                <div className="avatar-initials">{getInitials()}</div>
              )}
              <div>
                <div className="mobile-user-name">{user?.full_name || user?.email}</div>
                <div className="mobile-user-role">{getRoleDisplay(user?.role)}</div>
              </div>
            </div>
          </div>
          <div className="mobile-menu-items">
            <Link to="/profile" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <i className="bi bi-person" /> My Profile
            </Link>
            <Link to="/change-password" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <i className="bi bi-shield-lock" /> Change Password
            </Link>
            <Link to="/settings" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <i className="bi bi-sliders2" /> Preferences
            </Link>
            <Link to="/notifications" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <i className="bi bi-bell" /> Notifications
              <span className="badge-number">3</span>
            </Link>
            <hr className="mobile-menu-divider" />
            <button className="mobile-menu-item text-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}