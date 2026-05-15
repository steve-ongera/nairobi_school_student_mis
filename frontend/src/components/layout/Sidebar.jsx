import { NavLink, useLocation } from "react-router-dom";
import { useRole } from "../../hooks";

const NavItem = ({ to, icon, label }) => (
  <li className="nav-item">
    <NavLink
      to={to}
      className={({ isActive }) =>
        `nav-link ${isActive ? "" : "collapsed"}`
      }
    >
      <i className={`bi ${icon}`} />
      <span>{label}</span>
    </NavLink>
  </li>
);

const NavGroup = ({ icon, label, children }) => {
  const location = useLocation();
  const isActive = children.some((c) => location.pathname.startsWith(c.props.to));
  return (
    <li className="nav-item">
      <a
        className={`nav-link ${isActive ? "" : "collapsed"}`}
        data-bs-toggle="collapse"
        href={`#nav-${label.replace(/\s/g, "")}`}
      >
        <i className={`bi ${icon}`} />
        <span>{label}</span>
        <i className="bi bi-chevron-down ms-auto" />
      </a>
      <ul
        id={`nav-${label.replace(/\s/g, "")}`}
        className={`nav-content collapse ${isActive ? "show" : ""}`}
      >
        {children}
      </ul>
    </li>
  );
};

const SubItem = ({ to, label }) => (
  <li>
    <NavLink to={to} className={({ isActive }) => (isActive ? "active" : "")}>
      <i className="bi bi-circle" />
      {label}
    </NavLink>
  </li>
);

export default function Sidebar() {
  const { isAdmin, isTeacher, isStudent, isFinance, isAdminOrFinance, isAdminOrTeacher } = useRole();

  return (
    <aside id="sidebar" className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">

        {/* ─── ADMIN ──────────────────────────────────────────── */}
        {isAdmin && (
          <>
            <li className="nav-heading">Main</li>
            <NavItem to="/admin/dashboard" icon="bi-grid" label="Dashboard" />

            <li className="nav-heading">Students</li>
            <NavGroup icon="bi-person-lines-fill" label="Students">
              <SubItem to="/admin/students" label="All Students" />
              <SubItem to="/admin/students/new" label="Admit Student" />
              <SubItem to="/admin/students/promote" label="Promotions" />
            </NavGroup>

            <li className="nav-heading">Academics</li>
            <NavGroup icon="bi-buildings" label="Academics">
              <SubItem to="/admin/academics/years" label="Academic Years" />
              <SubItem to="/admin/academics/classrooms" label="Classrooms" />
              <SubItem to="/admin/academics/forms" label="Forms" />
              <SubItem to="/admin/academics/streams" label="Streams" />
              <SubItem to="/admin/academics/subjects" label="Subjects" />
            </NavGroup>

            <NavGroup icon="bi-journal-text" label="Exams">
              <SubItem to="/admin/exams" label="All Exams" />
              <SubItem to="/admin/exams/new" label="Create Exam" />
              <SubItem to="/admin/exams/results" label="Results" />
              <SubItem to="/admin/exams/report-cards" label="Report Cards" />
            </NavGroup>

            <li className="nav-heading">Staff</li>
            <NavGroup icon="bi-person-badge" label="Teachers">
              <SubItem to="/admin/teachers" label="All Teachers" />
              <SubItem to="/admin/teachers/new" label="Add Teacher" />
              <SubItem to="/admin/teachers/allocations" label="Subject Allocation" />
            </NavGroup>

            <li className="nav-heading">Finance</li>
            <NavGroup icon="bi-cash-stack" label="Finance">
              <SubItem to="/admin/finance/fee-structure" label="Fee Structure" />
              <SubItem to="/admin/finance/invoices" label="Invoices" />
              <SubItem to="/admin/finance/payments" label="Payments" />
              <SubItem to="/admin/finance/mpesa" label="MPESA" />
            </NavGroup>

            <li className="nav-heading">Attendance</li>
            <NavItem to="/admin/attendance" icon="bi-calendar-check" label="Attendance" />

            <li className="nav-heading">Settings</li>
            <NavGroup icon="bi-gear" label="Settings">
              <SubItem to="/admin/settings/school" label="School Settings" />
              <SubItem to="/admin/settings/grading" label="Grading Scale" />
            </NavGroup>
          </>
        )}

        {/* ─── FINANCE (non-admin) ─────────────────────────────── */}
        {isFinance && !isAdmin && (
          <>
            <li className="nav-heading">Finance</li>
            <NavItem to="/admin/finance/invoices" icon="bi-receipt" label="Invoices" />
            <NavItem to="/admin/finance/payments" icon="bi-cash" label="Payments" />
            <NavItem to="/admin/finance/mpesa" icon="bi-phone" label="MPESA" />
            <NavItem to="/admin/finance/fee-structure" icon="bi-list-ul" label="Fee Structure" />
          </>
        )}

        {/* ─── TEACHER ────────────────────────────────────────── */}
        {isTeacher && (
          <>
            <li className="nav-heading">Teacher Portal</li>
            <NavItem to="/teacher/dashboard" icon="bi-grid" label="Dashboard" />
            <NavGroup icon="bi-pencil-square" label="Marks">
              <SubItem to="/teacher/marks/subjects" label="My Subjects" />
              <SubItem to="/teacher/marks/entry" label="Enter Marks" />
              <SubItem to="/teacher/marks/upload" label="Upload Excel" />
              <SubItem to="/teacher/marks/analysis" label="Class Analysis" />
            </NavGroup>
            <NavItem to="/teacher/attendance" icon="bi-calendar-check" label="Take Attendance" />
            <NavItem to="/teacher/reports/stream" icon="bi-bar-chart-line" label="Stream Report" />
          </>
        )}

        {/* ─── STUDENT ────────────────────────────────────────── */}
        {isStudent && (
          <>
            <li className="nav-heading">Student Portal</li>
            <NavItem to="/student/dashboard" icon="bi-grid" label="Dashboard" />
            <NavGroup icon="bi-journal-check" label="Results">
              <SubItem to="/student/results" label="My Results" />
              <SubItem to="/student/results/report-card" label="Report Card" />
            </NavGroup>
            <NavGroup icon="bi-cash-coin" label="Fees">
              <SubItem to="/student/fees/statement" label="Fee Statement" />
              <SubItem to="/student/fees/pay" label="Pay via MPESA" />
              <SubItem to="/student/fees/payments" label="Payment History" />
            </NavGroup>
            <NavItem to="/student/attendance" icon="bi-calendar-event" label="My Attendance" />
            <NavItem to="/student/profile" icon="bi-person" label="My Profile" />
          </>
        )}
      </ul>
    </aside>
  );
}