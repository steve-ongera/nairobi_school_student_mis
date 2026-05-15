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

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="header d-flex align-items-center">
      <div className="d-flex align-items-center justify-content-between w-100">
        {/* Logo */}
        <Link to="/" className="logo d-flex align-items-center">
          <i className="bi bi-mortarboard-fill text-primary me-2" style={{ fontSize: 26 }} />
          <span>SchoolMIS</span>
        </Link>

        {/* Toggle sidebar */}
        <i
          className="bi bi-list toggle-sidebar-btn"
          onClick={toggleSidebar}
          style={{ cursor: "pointer" }}
        />

        {/* Search */}
        <div className={`search-bar ${showSearch ? "search-bar-show" : ""}`}>
          <form className="search-form d-flex align-items-center">
            <input type="text" placeholder="Search students, exams, fees…" />
            <button type="submit">
              <i className="bi bi-search" />
            </button>
          </form>
        </div>

        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">
            {/* Search toggle (mobile) */}
            <li className="nav-item d-block d-lg-none">
              <span
                className="nav-icon bi bi-search"
                onClick={() => setShowSearch((s) => !s)}
                style={{ cursor: "pointer", fontSize: 22, color: "#012970", marginRight: 15 }}
              />
            </li>

            {/* Notifications */}
            <li className="nav-item dropdown">
              <span
                className="nav-link nav-icon"
                data-bs-toggle="dropdown"
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-bell" />
                <span className="badge-number badge bg-primary">3</span>
              </span>
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
                <li className="dropdown-header">
                  You have <b>3</b> new notifications
                  <Link to="/notifications">
                    <span className="badge rounded-pill bg-primary p-2 ms-2">View all</span>
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
              </ul>
            </li>

            {/* Profile */}
            <li className="nav-item dropdown pe-3">
              <span
                className="nav-link nav-profile d-flex align-items-center pe-0"
                data-bs-toggle="dropdown"
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "#4154f1", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14,
                  }}
                >
                  {initials}
                </div>
                <span className="d-none d-md-block ps-2">
                  {user?.full_name?.split(" ")[0]}
                </span>
              </span>
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6>{user?.full_name}</h6>
                  <span className="text-capitalize">{user?.role}</span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/profile">
                    <i className="bi bi-person" />
                    <span>My Profile</span>
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/change-password">
                    <i className="bi bi-lock" />
                    <span>Change Password</span>
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center text-danger"
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