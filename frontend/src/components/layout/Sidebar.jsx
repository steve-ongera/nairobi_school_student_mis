// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useRole } from "../../hooks";
import { useState, useEffect } from "react";

/* ─── Atomic components ──────────────────────────────────────────── */

/** Single flat nav item (no children) */
const NavItem = ({ to, icon, label }) => (
  <li className="nav-item">
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? "" : "collapsed"}`}
      end
    >
      <i className={`bi ${icon}`} />
      <span>{label}</span>
    </NavLink>
  </li>
);

/**
 * Collapsible nav group
 */
const NavGroup = ({ icon, label, children, defaultOpen = false }) => {
  const location = useLocation();
  const childArray = Array.isArray(children) ? children.flat() : [children];
  const isActive = childArray.some(
    (c) => c?.props?.to && location.pathname.startsWith(c.props.to)
  );
  
  const [isOpen, setIsOpen] = useState(isActive || defaultOpen);
  const collapseId = `nav-${label.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => {
    setIsOpen(isActive);
  }, [isActive]);

  const toggleOpen = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <li className="nav-item">
      <a
        className={`nav-link ${isOpen ? "" : "collapsed"}`}
        onClick={toggleOpen}
        href={`#${collapseId}`}
        role="button"
        aria-expanded={isOpen}
      >
        <i className={`bi ${icon}`} />
        <span>{label}</span>
        <i className="bi bi-chevron-down ms-auto" />
      </a>

      <div
        id={collapseId}
        className={`nav-content ${isOpen ? "show" : ""}`}
        style={{ display: isOpen ? "block" : "none" }}
      >
        <ul className="nav-content-list">
          {children}
        </ul>
      </div>
    </li>
  );
};

/** Sub-item inside a NavGroup */
const SubItem = ({ to, label }) => (
  <li>
    <NavLink to={to} className={({ isActive }) => (isActive ? "active" : "")}>
      <i className="bi bi-circle" />
      <span>{label}</span>
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
    <aside className="sidebar">
      <ul className="sidebar-nav">

        {/* ════════════════════════════════════════════════════
            ADMIN PORTAL
            ════════════════════════════════════════════════════ */}
        {isAdmin && (
          <>
            <NavHeading>Main</NavHeading>
            <NavItem to="/admin/dashboard" icon="bi-grid-1x2-fill" label="Dashboard" />

            <NavHeading>Student Management</NavHeading>
            <NavGroup icon="bi-people-fill" label="Students">
              <SubItem to="/admin/students"         label="All Students" />
              <SubItem to="/admin/students/new"     label="Admit Student" />
              <SubItem to="/admin/students/promote" label="Promotions" />
              <SubItem to="/admin/students/archive" label="Graduated" />
            </NavGroup>

            <NavHeading>Academic Operations</NavHeading>
            <NavGroup icon="bi-building" label="Academics">
              <SubItem to="/admin/academics/years"      label="Academic Years" />
              <SubItem to="/admin/academics/classrooms" label="Classrooms" />
              <SubItem to="/admin/academics/forms"      label="Forms" />
              <SubItem to="/admin/academics/streams"    label="Streams" />
              <SubItem to="/admin/academics/subjects"   label="Subjects" />
              <SubItem to="/admin/academics/timetable"  label="Timetable" />
            </NavGroup>

            <NavGroup icon="bi-file-text-fill" label="Examinations">
              <SubItem to="/admin/exams"              label="All Exams" />
              <SubItem to="/admin/exams/new"          label="Create Exam" />
              <SubItem to="/admin/exams/results"      label="Results" />
              <SubItem to="/admin/exams/report-cards" label="Report Cards" />
              <SubItem to="/admin/exams/analytics"    label="Analytics" />
            </NavGroup>

            <NavHeading>Staff Management</NavHeading>
            <NavGroup icon="bi-person-badge-fill" label="Teachers">
              <SubItem to="/admin/teachers"             label="All Teachers" />
              <SubItem to="/admin/teachers/new"         label="Add Teacher" />
              <SubItem to="/admin/teachers/allocations" label="Subject Allocation" />
              <SubItem to="/admin/teachers/attendance"  label="Teacher Attendance" />
            </NavGroup>

            <NavHeading>Financial Hub</NavHeading>
            <NavGroup icon="bi-cash-stack" label="Finance">
              <SubItem to="/admin/finance/dashboard"     label="Dashboard" />
              <SubItem to="/admin/finance/fee-structure" label="Fee Structure" />
              <SubItem to="/admin/finance/invoices"      label="Invoices" />
              <SubItem to="/admin/finance/payments"      label="Payments" />
              <SubItem to="/admin/finance/mpesa"         label="MPESA Integration" />
              <SubItem to="/admin/finance/reports"       label="Financial Reports" />
            </NavGroup>

            <NavHeading>Attendance Tracking</NavHeading>
            <NavItem to="/admin/attendance" icon="bi-calendar-check-fill" label="Attendance Overview" />

            <NavHeading>System Configuration</NavHeading>
            <NavGroup icon="bi-gear-fill" label="Settings">
              <SubItem to="/admin/settings/school"   label="School Settings" />
              <SubItem to="/admin/settings/grading"  label="Grading Scale" />
              <SubItem to="/admin/settings/roles"    label="User Roles" />
              <SubItem to="/admin/settings/backup"   label="Backup & Restore" />
            </NavGroup>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            FINANCE PORTAL
            ════════════════════════════════════════════════════ */}
        {isFinance && !isAdmin && (
          <>
            <NavHeading>Finance Dashboard</NavHeading>
            <NavItem to="/finance/dashboard" icon="bi-speedometer2" label="Overview" />
            
            <NavHeading>Financial Operations</NavHeading>
            <NavItem to="/finance/invoices"      icon="bi-receipt"    label="Invoices" />
            <NavItem to="/finance/payments"      icon="bi-cash"       label="Payments" />
            <NavItem to="/finance/mpesa"         icon="bi-phone"      label="MPESA" />
            <NavItem to="/finance/fee-structure" icon="bi-list-ul"    label="Fee Structure" />
            <NavItem to="/finance/reports"       icon="bi-graph-up"   label="Reports" />
          </>
        )}

        {/* ════════════════════════════════════════════════════
            TEACHER PORTAL
            ════════════════════════════════════════════════════ */}
        {isTeacher && (
          <>
            <NavHeading>Teacher Workspace</NavHeading>
            <NavItem to="/teacher/dashboard" icon="bi-speedometer2" label="Dashboard" />

            <NavGroup icon="bi-pencil-square" label="Mark Management">
              <SubItem to="/teacher/marks/subjects"  label="My Subjects" />
              <SubItem to="/teacher/marks/entry"     label="Enter Marks" />
              <SubItem to="/teacher/marks/upload"    label="Bulk Upload" />
              <SubItem to="/teacher/marks/analysis"  label="Performance Analysis" />
            </NavGroup>

            <NavItem to="/teacher/attendance"      icon="bi-calendar-check-fill"   label="Attendance" />
            <NavItem to="/teacher/reports"         icon="bi-bar-chart-line-fill"   label="Class Reports" />
            <NavItem to="/teacher/timetable"       icon="bi-calendar-week"         label="My Timetable" />
          </>
        )}

        {/* ════════════════════════════════════════════════════
            STUDENT PORTAL
            ════════════════════════════════════════════════════ */}
        {isStudent && (
          <>
            <NavHeading>Student Hub</NavHeading>
            <NavItem to="/student/dashboard" icon="bi-speedometer2" label="Dashboard" />

            <NavGroup icon="bi-journal-check" label="Academic Results">
              <SubItem to="/student/results"             label="My Results" />
              <SubItem to="/student/results/report-card" label="Report Card" />
              <SubItem to="/student/results/transcript"  label="Transcript" />
            </NavGroup>

            <NavGroup icon="bi-cash-coin" label="Fee Management">
              <SubItem to="/student/fees/statement" label="Fee Statement" />
              <SubItem to="/student/fees/pay"       label="Pay Fees" />
              <SubItem to="/student/fees/payments"  label="Payment History" />
            </NavGroup>

            <NavItem to="/student/attendance" icon="bi-calendar-event-fill" label="Attendance" />
            <NavItem to="/student/timetable"  icon="bi-calendar-week"       label="Timetable" />
            <NavItem to="/student/profile"    icon="bi-person-circle"       label="My Profile" />
          </>
        )}

      </ul>
    </aside>
  );
}