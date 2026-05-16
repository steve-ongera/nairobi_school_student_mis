// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useRole } from "../../hooks";

/* ─── Atomic components ──────────────────────────────────────────── */

/** Single flat nav item (no children) */
const NavItem = ({ to, icon, label }) => (
  <li className="nav-item">
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? "" : "collapsed"}`}
    >
      <i className={`bi ${icon}`} />
      <span>{label}</span>
    </NavLink>
  </li>
);

/**
 * Collapsible nav group.
 * `children` should be <SubItem> elements.
 */
const NavGroup = ({ icon, label, children }) => {
  const location = useLocation();
  // Flatten children to an array so .some() works regardless of count
  const childArray = Array.isArray(children) ? children.flat() : [children];
  const isActive = childArray.some(
    (c) => c?.props?.to && location.pathname.startsWith(c.props.to)
  );

  const collapseId = `nav-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <li className="nav-item">
      <a
        className={`nav-link ${isActive ? "" : "collapsed"}`}
        data-bs-toggle="collapse"
        href={`#${collapseId}`}
        role="button"
        aria-expanded={isActive}
      >
        <i className={`bi ${icon}`} />
        <span>{label}</span>
        <i className="bi bi-chevron-down ms-auto" />
      </a>

      <ul
        id={collapseId}
        className={`nav-content collapse ${isActive ? "show" : ""}`}
      >
        {children}
      </ul>
    </li>
  );
};

/** Sub-item inside a NavGroup */
const SubItem = ({ to, label }) => (
  <li>
    <NavLink to={to} className={({ isActive }) => (isActive ? "active" : "")}>
      <i className="bi bi-circle" />
      {label}
    </NavLink>
  </li>
);

/** Section heading label */
const NavHeading = ({ children }) => (
  <li className="nav-heading">{children}</li>
);

/* ─── Main sidebar ───────────────────────────────────────────────── */

export default function Sidebar() {
  const {
    isAdmin,
    isTeacher,
    isStudent,
    isFinance,
  } = useRole();

  return (
    <aside id="sidebar" className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">

        {/* ════════════════════════════════════════════════════
            ADMIN
            ════════════════════════════════════════════════════ */}
        {isAdmin && (
          <>
            <NavHeading>Main</NavHeading>
            <NavItem to="/admin/dashboard" icon="bi-speedometer2" label="Dashboard" />

            <NavHeading>Students</NavHeading>
            <NavGroup icon="bi-person-lines-fill" label="Students">
              <SubItem to="/admin/students"         label="All Students" />
              <SubItem to="/admin/students/new"     label="Admit Student" />
              <SubItem to="/admin/students/promote" label="Promotions" />
            </NavGroup>

            <NavHeading>Academics</NavHeading>
            <NavGroup icon="bi-buildings" label="Academics">
              <SubItem to="/admin/academics/years"      label="Academic Years" />
              <SubItem to="/admin/academics/classrooms" label="Classrooms" />
              <SubItem to="/admin/academics/forms"      label="Forms" />
              <SubItem to="/admin/academics/streams"    label="Streams" />
              <SubItem to="/admin/academics/subjects"   label="Subjects" />
            </NavGroup>

            <NavGroup icon="bi-journal-text" label="Exams">
              <SubItem to="/admin/exams"              label="All Exams" />
              <SubItem to="/admin/exams/new"          label="Create Exam" />
              <SubItem to="/admin/exams/results"      label="Results" />
              <SubItem to="/admin/exams/report-cards" label="Report Cards" />
            </NavGroup>

            <NavHeading>Staff</NavHeading>
            <NavGroup icon="bi-person-badge" label="Teachers">
              <SubItem to="/admin/teachers"             label="All Teachers" />
              <SubItem to="/admin/teachers/new"         label="Add Teacher" />
              <SubItem to="/admin/teachers/allocations" label="Subject Allocation" />
            </NavGroup>

            <NavHeading>Finance</NavHeading>
            <NavGroup icon="bi-cash-stack" label="Finance">
              <SubItem to="/admin/finance/fee-structure" label="Fee Structure" />
              <SubItem to="/admin/finance/invoices"      label="Invoices" />
              <SubItem to="/admin/finance/payments"      label="Payments" />
              <SubItem to="/admin/finance/mpesa"         label="MPESA" />
            </NavGroup>

            <NavHeading>Attendance</NavHeading>
            <NavItem
              to="/admin/attendance"
              icon="bi-calendar-check"
              label="Attendance"
            />

            <NavHeading>Settings</NavHeading>
            <NavGroup icon="bi-gear" label="Settings">
              <SubItem to="/admin/settings/school"   label="School Settings" />
              <SubItem to="/admin/settings/grading"  label="Grading Scale" />
            </NavGroup>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            FINANCE (non-admin)
            ════════════════════════════════════════════════════ */}
        {isFinance && !isAdmin && (
          <>
            <NavHeading>Finance</NavHeading>
            <NavItem to="/admin/finance/invoices"      icon="bi-receipt"    label="Invoices" />
            <NavItem to="/admin/finance/payments"      icon="bi-cash"       label="Payments" />
            <NavItem to="/admin/finance/mpesa"         icon="bi-phone"      label="MPESA" />
            <NavItem to="/admin/finance/fee-structure" icon="bi-list-ul"    label="Fee Structure" />
          </>
        )}

        {/* ════════════════════════════════════════════════════
            TEACHER
            ════════════════════════════════════════════════════ */}
        {isTeacher && (
          <>
            <NavHeading>Teacher Portal</NavHeading>
            <NavItem to="/teacher/dashboard" icon="bi-speedometer2" label="Dashboard" />

            <NavGroup icon="bi-pencil-square" label="Marks">
              <SubItem to="/teacher/marks/subjects"  label="My Subjects" />
              <SubItem to="/teacher/marks/entry"     label="Enter Marks" />
              <SubItem to="/teacher/marks/upload"    label="Upload Excel" />
              <SubItem to="/teacher/marks/analysis"  label="Class Analysis" />
            </NavGroup>

            <NavItem to="/teacher/attendance"      icon="bi-calendar-check"   label="Take Attendance" />
            <NavItem to="/teacher/reports/stream"  icon="bi-bar-chart-line"   label="Stream Report" />
          </>
        )}

        {/* ════════════════════════════════════════════════════
            STUDENT
            ════════════════════════════════════════════════════ */}
        {isStudent && (
          <>
            <NavHeading>Student Portal</NavHeading>
            <NavItem to="/student/dashboard" icon="bi-speedometer2" label="Dashboard" />

            <NavGroup icon="bi-journal-check" label="Results">
              <SubItem to="/student/results"             label="My Results" />
              <SubItem to="/student/results/report-card" label="Report Card" />
            </NavGroup>

            <NavGroup icon="bi-cash-coin" label="Fees">
              <SubItem to="/student/fees/statement" label="Fee Statement" />
              <SubItem to="/student/fees/pay"       label="Pay via MPESA" />
              <SubItem to="/student/fees/payments"  label="Payment History" />
            </NavGroup>

            <NavItem to="/student/attendance" icon="bi-calendar-event" label="My Attendance" />
            <NavItem to="/student/profile"    icon="bi-person"         label="My Profile" />
          </>
        )}

      </ul>
    </aside>
  );
}