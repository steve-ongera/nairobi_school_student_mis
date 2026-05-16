// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "../../hooks";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { toggleSidebar } = useTheme();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search logic here
      console.log("Searching for:", searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate initials from full name
  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  // Get user role display name
  const getRoleDisplay = (role) => {
    const roles = {
      admin: "Administrator",
      teacher: "Teacher",
      student: "Student",
      finance: "Finance Officer"
    };
    return roles[role] || role;
  };

  return (
    <header className="header">
      <div className="d-flex align-items-center justify-content-between w-100">

        {/* Logo Section */}
        <Link to="/" className="logo">
          <div className="logo-icon">
            <i className="bi bi-mortarboard-fill" />
          </div>
          <span>SchoolMIS Pro</span>
        </Link>

        {/* Sidebar Toggle */}
        <i className="bi bi-list toggle-sidebar-btn" onClick={toggleSidebar} />

        {/* Search Bar */}
        <div className={`search-bar ${showSearch ? "search-bar-show" : ""}`} ref={searchRef}>
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search students, exams, fees..."
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="Submit search">
              <i className="bi bi-search" />
            </button>
          </form>
        </div>

        {/* Navigation Actions */}
        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center gap-2">

            {/* Mobile Search Toggle */}
            <li className="nav-item d-block d-lg-none">
              <button
                className="nav-icon btn border-0 p-0"
                onClick={() => setShowSearch(!showSearch)}
                aria-label="Toggle search"
              >
                <i className="bi bi-search" />
              </button>
            </li>

            {/* Notifications */}
            <li className="nav-item dropdown">
              <span
                className="nav-icon"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-bell" />
                <span className="badge-number">3</span>
              </span>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <li className="dropdown-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Notifications</h6>
                    <Link to="/notifications" className="small">View all</Link>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li>
                  <Link className="dropdown-item" to="/notifications/payment">
                    <i className="bi bi-cash-coin text-success"></i>
                    <div>
                      <div className="fw-semibold">Fee payment received</div>
                      <small className="text-muted">MPESA – KES 15,000</small>
                    </div>
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li>
                  <Link className="dropdown-item" to="/notifications/exam">
                    <i className="bi bi-journal-check text-primary"></i>
                    <div>
                      <div className="fw-semibold">Exam results published</div>
                      <small className="text-muted">End Term 1 – Form 2</small>
                    </div>
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li>
                  <Link className="dropdown-item" to="/notifications/student">
                    <i className="bi bi-person-plus text-warning"></i>
                    <div>
                      <div className="fw-semibold">New student admitted</div>
                      <small className="text-muted">Form 1 – Stream A</small>
                    </div>
                  </Link>
                </li>
              </ul>
            </li>

            {/* Profile Dropdown */}
            <li className="nav-item dropdown pe-2">
              <span
                className="nav-profile"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="rounded-circle"
                  />
                ) : (
                  <div className="avatar-initials">{getInitials()}</div>
                )}
                <span className="d-none d-md-block">
                  {user?.full_name?.split(" ")[0] || "User"}
                </span>
                <i className="bi bi-chevron-down d-none d-md-block" />
              </span>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <li className="dropdown-header">
                  <h6 className="mb-1">{user?.full_name || user?.email}</h6>
                  <span className="text-capitalize">
                    {getRoleDisplay(user?.role)}
                  </span>
                </li>
                <li><hr className="dropdown-divider" /></li>

                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="bi bi-person"></i>
                    <span>My Profile</span>
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item" to="/change-password">
                    <i className="bi bi-shield-lock"></i>
                    <span>Change Password</span>
                  </Link>
                </li>

                <li>
                  <Link className="dropdown-item" to="/settings">
                    <i className="bi bi-sliders2"></i>
                    <span>Preferences</span>
                  </Link>
                </li>

                <li><hr className="dropdown-divider" /></li>

                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i>
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