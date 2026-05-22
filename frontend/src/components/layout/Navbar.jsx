// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../../hooks";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]           = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [notifOpen, setNotifOpen]               = useState(false);
  const [profileOpen, setProfileOpen]           = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen]     = useState(false);

  const notifRef   = useRef(null);
  const profileRef = useRef(null);
  const mobileRef  = useRef(null);

  /* ── Close dropdowns on outside click ─────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (mobileRef.current  && !mobileRef.current.contains(e.target))  setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Close mobile panel on resize to desktop ──────────────── */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1200) {
        setMobileMenuOpen(false);
        setShowMobileSearch(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Backdrop body scroll lock ────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowMobileSearch(false);
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getRoleLabel = (role) => ({
    admin:   "Administrator",
    teacher: "Teacher",
    student: "Student",
    finance: "Finance Officer",
  }[role] || role || "");

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          TOPBAR
          ═══════════════════════════════════════════════════════ */}
      <header className="header">

        {/* LEFT */}
        <div className="header__left">
          {/* Sidebar toggle */}
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list" />
          </button>

          {/* Logo */}
          <Link to="/" className="logo">
            <div className="logo__mark">
              <i className="bi bi-mortarboard-fill" />
            </div>
            <div className="logo__wordmark desktop-only">
              <span className="logo__name">SchoolMIS Pro</span>
              <span className="logo__tagline">Kenya Secondary</span>
            </div>
          </Link>
        </div>

        {/* CENTRE — desktop search */}
        <div className="header__search desktop-only">
          <form className="search-box" onSubmit={handleSearch}>
            <i className="bi bi-search search-box__icon" />
            <input
              className="search-box__input"
              type="search"
              placeholder="Search students, exams, fees…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
            />
            <span className="search-box__kbd">⌘K</span>
          </form>
        </div>

        {/* RIGHT */}
        <div className="header__actions">

          {/* Mobile search toggle */}
          <button
            className="icon-btn mobile-only"
            onClick={() => setShowMobileSearch((v) => !v)}
            aria-label="Search"
          >
            <i className="bi bi-search" />
          </button>

          {/* Notifications */}
          <div className="dropdown" ref={notifRef}>
            <button
              className="icon-btn"
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <i className="bi bi-bell" />
              <span className="badge-count">3</span>
            </button>

            <ul className={`dropdown-menu${notifOpen ? " is-open" : ""}`} style={{ minWidth: 320 }}>
              <li>
                <div className="dropdown-menu__header">
                  <div className="dropdown-menu__header-title">Notifications</div>
                  <div className="dropdown-menu__header-sub">3 unread messages</div>
                </div>
              </li>

              {[
                { icon: "bi-cash-coin",    color: "success", title: "Fee payment received",  desc: "MPESA – KES 15,000",     to: "/notifications/payment" },
                { icon: "bi-journal-check",color: "info",    title: "Exam results published", desc: "End Term 1 – Form 2",   to: "/notifications/exam"    },
                { icon: "bi-person-plus",  color: "warning", title: "New student admitted",   desc: "Form 1 – Stream A",     to: "/notifications/student" },
              ].map(({ icon, color, title, desc, to }) => (
                <li key={to}>
                  <Link
                    className="notification-item"
                    to={to}
                    onClick={() => setNotifOpen(false)}
                  >
                    <div className={`notification-icon notification-icon--${color}`}>
                      <i className={`bi ${icon}`} />
                    </div>
                    <div className="notification-body">
                      <div className="notification-title">{title}</div>
                      <div className="notification-desc">{desc}</div>
                    </div>
                    <span className="notification-time">now</span>
                  </Link>
                  <div className="dropdown-divider" />
                </li>
              ))}

              <li>
                <div className="dropdown-footer">
                  <Link to="/notifications" onClick={() => setNotifOpen(false)}>View all notifications</Link>
                </div>
              </li>
            </ul>
          </div>

          <div className="header__divider desktop-only" />

          {/* Profile — desktop */}
          <div className="dropdown desktop-only" ref={profileRef}>
            <button
              className="user-btn"
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
              aria-expanded={profileOpen}
            >
              <div className="user-avatar">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt={user.full_name} />
                  : getInitials()}
              </div>
              <div className="user-info">
                <span className="user-info__name">{user?.full_name?.split(" ")[0] || "User"}</span>
                <span className="user-info__role">{getRoleLabel(user?.role)}</span>
              </div>
              <i className={`bi bi-chevron-down user-btn__chevron`} aria-hidden />
            </button>

            <ul className={`dropdown-menu${profileOpen ? " is-open" : ""}`}>
              <li>
                <div className="dropdown-menu__header">
                  <div className="dropdown-menu__header-title">{user?.full_name || user?.email}</div>
                  <div className="dropdown-menu__header-sub">{getRoleLabel(user?.role)}</div>
                </div>
              </li>
              <div className="dropdown-divider" />
              {[
                { to: "/profile",         icon: "bi-person",         label: "My Profile"       },
                { to: "/change-password", icon: "bi-shield-lock",    label: "Change Password"  },
                { to: "/settings",        icon: "bi-sliders2",       label: "Preferences"      },
              ].map(({ to, icon, label }) => (
                <li key={to}>
                  <Link className="dropdown-item" to={to} onClick={() => setProfileOpen(false)}>
                    <i className={`bi ${icon}`} /> {label}
                  </Link>
                </li>
              ))}
              <div className="dropdown-divider" />
              <li>
                <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right" /> Sign Out
                </button>
              </li>
            </ul>
          </div>

          {/* Mobile hamburger */}
          <button
            className="icon-btn mobile-only"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <i className={`bi ${mobileMenuOpen ? "bi-x-lg" : "bi-three-dots-vertical"}`} />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          MOBILE SEARCH BAR (slides down under header)
          ═══════════════════════════════════════════════════════ */}
      {showMobileSearch && (
        <div className="mobile-search-bar mobile-only">
          <form className="mobile-search-bar__form" onSubmit={handleSearch}>
            <input
              className="form-control"
              type="search"
              placeholder="Search students, exams, fees…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primary" type="submit" aria-label="Search">
              <i className="bi bi-search" />
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setShowMobileSearch(false)}
              aria-label="Close"
            >
              <i className="bi bi-x-lg" />
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MOBILE PANEL (right-side slide-in)
          ═══════════════════════════════════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`sidebar-backdrop${mobileMenuOpen ? " is-visible" : ""} mobile-only`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden
      />

      <div className={`mobile-panel mobile-only${mobileMenuOpen ? " is-open" : ""}`} ref={mobileRef}>
        {/* Header */}
        <div className="mobile-panel__header">
          <div className="user-avatar">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.full_name} />
              : getInitials()}
          </div>
          <div>
            <div className="mobile-panel__user-name">{user?.full_name || user?.email}</div>
            <div className="mobile-panel__user-role">{getRoleLabel(user?.role)}</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="mobile-panel__nav">
          {[
            { to: "/profile",         icon: "bi-person",         label: "My Profile"       },
            { to: "/change-password", icon: "bi-shield-lock",    label: "Change Password"  },
            { to: "/settings",        icon: "bi-sliders2",       label: "Preferences"      },
            { to: "/notifications",   icon: "bi-bell",           label: "Notifications", badge: 3 },
          ].map(({ to, icon, label, badge }) => (
            <Link
              key={to}
              className="mobile-panel__item"
              to={to}
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className={`bi ${icon}`} />
              {label}
              {badge && <span className="badge-count ms-auto">{badge}</span>}
            </Link>
          ))}

          <div className="mobile-panel__sep" />

          <button className="mobile-panel__item mobile-panel__item--danger" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right" /> Sign Out
          </button>
        </nav>
      </div>
    </>
  );
}