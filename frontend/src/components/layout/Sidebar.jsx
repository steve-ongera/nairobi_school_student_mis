// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from "react-router-dom";
import { useRole, useTheme } from "../../hooks";
import { useState, useEffect, useRef } from "react";

/* ─── Atomic components ──────────────────────────────────────────── */

/** Single flat nav item (no children) */
const NavItem = ({ to, icon, label, onClick }) => (
  <li className="nav-item">
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) => `nav-link${isActive ? " active" : " collapsed"}`}
    >
      <i className={`bi ${icon}`} />
      <span className="nav-link__label">{label}</span>
    </NavLink>
  </li>
);

/** Collapsible nav group */
const NavGroup = ({ icon, label, children, onChildClick }) => {
  const location  = useLocation();
  const childArr  = Array.isArray(children) ? children.flat() : [children];
  const isActive  = childArr.some(
    (c) => c?.props?.to && location.pathname.startsWith(c.props.to)
  );
  const [open, setOpen] = useState(isActive);
  const id = `nav-${label.replace(/\s+/g, "-").toLowerCase()}`;

  useEffect(() => { setOpen(isActive); }, [isActive]);

  return (
    <li className="nav-item">
      <button
        className={`nav-link${open ? "" : " collapsed"}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        style={{ width: "100%", textAlign: "left" }}
      >
        <i className={`bi ${icon}`} />
        <span className="nav-link__label">{label}</span>
        <i className="bi bi-chevron-down nav-link__chevron" />
      </button>

      <ul
        id={id}
        className="nav-sub"
        style={{ display: open ? "flex" : "none" }}
      >
        {/* Clone children and inject onChildClick */}
        {childArr.map((child, i) =>
          child
            ? { ...child, props: { ...child.props, onClick: onChildClick }, key: i }
            : null
        )}
      </ul>
    </li>
  );
};

/** Sub-item inside a NavGroup */
const SubItem = ({ to, label, onClick }) => (
  <li>
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `nav-sub__item${isActive ? " active" : ""}`}
    >
      <span className="nav-link__label">{label}</span>
    </NavLink>
  </li>
);

/** Section heading */
const NavHeading = ({ children }) => (
  <li>
    <span className="nav-section-title">{children}</span>
  </li>
);

/* ─── Main Sidebar ───────────────────────────────────────────────── */

export default function Sidebar() {
  const { isAdmin, isTeacher, isStudent, isFinance } = useRole();
  const { sidebarOpen, closeSidebar } = useTheme();

  /* Close sidebar on route change on mobile */
  const location = useLocation();
  useEffect(() => {
    if (window.innerWidth < 1200) closeSidebar?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* Close sidebar when clicking backdrop (mobile) */
  const handleBackdropClick = () => closeSidebar?.();

  /* Close on nav item click (mobile) */
  const handleItemClick = () => {
    if (window.innerWidth < 1200) closeSidebar?.();
  };

  const childClick = handleItemClick; // alias for NavGroup prop

  return (
    <>
      {/* ── Backdrop (mobile only) ─────────────────────────────── */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? " is-visible" : ""}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* ── Sidebar panel ─────────────────────────────────────── */}
      <aside className={`sidebar${sidebarOpen ? " is-open" : ""}`}>
        <div className="sidebar__scroll">
          <ul className="sidebar-nav">

            {/* ══════════════════════════════════════════════
                ADMIN PORTAL
                ══════════════════════════════════════════════ */}
            {isAdmin && (
              <>
                <NavHeading>Main</NavHeading>
                <NavItem to="/admin/dashboard" icon="bi-grid-1x2-fill" label="Dashboard" onClick={handleItemClick} />

                <NavHeading>Student Management</NavHeading>
                <NavGroup icon="bi-people-fill" label="Students" onChildClick={childClick}>
                  <SubItem to="/admin/students"         label="All Students"  />
                  <SubItem to="/admin/students/new"     label="Admit Student" />
                  <SubItem to="/admin/students/promote" label="Promotions"    />
                  <SubItem to="/admin/students/archive" label="Graduated"     />
                </NavGroup>

                <NavHeading>Academic Operations</NavHeading>
                <NavGroup icon="bi-building" label="Academics" onChildClick={childClick}>
                  <SubItem to="/admin/academics/years"      label="Academic Years" />
                  <SubItem to="/admin/academics/classrooms" label="Classrooms"     />
                  <SubItem to="/admin/academics/forms"      label="Forms"          />
                  <SubItem to="/admin/academics/streams"    label="Streams"        />
                  <SubItem to="/admin/academics/subjects"   label="Subjects"       />
                  <SubItem to="/admin/academics/timetable"  label="Timetable"      />
                </NavGroup>

                <NavGroup icon="bi-file-text-fill" label="Examinations" onChildClick={childClick}>
                  <SubItem to="/admin/exams"              label="All Exams"    />
                  <SubItem to="/admin/exams/new"          label="Create Exam"  />
                  <SubItem to="/admin/exams/results"      label="Results"      />
                  <SubItem to="/admin/exams/report-cards" label="Report Cards" />
                  <SubItem to="/admin/exams/analytics"    label="Analytics"    />
                </NavGroup>

                <NavHeading>Staff Management</NavHeading>
                <NavGroup icon="bi-person-badge-fill" label="Teachers" onChildClick={childClick}>
                  <SubItem to="/admin/teachers"             label="All Teachers"       />
                  <SubItem to="/admin/teachers/new"         label="Add Teacher"        />
                  <SubItem to="/admin/teachers/allocations" label="Subject Allocation" />
                  <SubItem to="/admin/teachers/attendance"  label="Teacher Attendance" />
                </NavGroup>

                <NavHeading>Financial Hub</NavHeading>
                <NavGroup icon="bi-cash-stack" label="Finance" onChildClick={childClick}>
                  <SubItem to="/admin/finance/dashboard"     label="Dashboard"         />
                  <SubItem to="/admin/finance/fee-structure" label="Fee Structure"     />
                  <SubItem to="/admin/finance/invoices"      label="Invoices"          />
                  <SubItem to="/admin/finance/payments"      label="Payments"          />
                  <SubItem to="/admin/finance/mpesa"         label="MPESA Integration" />
                  <SubItem to="/admin/finance/reports"       label="Financial Reports" />
                </NavGroup>

                <NavHeading>Attendance Tracking</NavHeading>
                <NavItem to="/admin/attendance" icon="bi-calendar-check-fill" label="Attendance Overview" onClick={handleItemClick} />

                <NavHeading>System Configuration</NavHeading>
                <NavGroup icon="bi-gear-fill" label="Settings" onChildClick={childClick}>
                  <SubItem to="/admin/settings/school"   label="School Settings" />
                  <SubItem to="/admin/settings/grading"  label="Grading Scale"   />
                  <SubItem to="/admin/settings/roles"    label="User Roles"      />
                  <SubItem to="/admin/settings/backup"   label="Backup & Restore"/>
                </NavGroup>
              </>
            )}

            {/* ══════════════════════════════════════════════
                FINANCE PORTAL
                ══════════════════════════════════════════════ */}
            {isFinance && !isAdmin && (
              <>
                <NavHeading>Finance Dashboard</NavHeading>
                <NavItem to="/finance/dashboard"    icon="bi-speedometer2" label="Overview"      onClick={handleItemClick} />

                <NavHeading>Financial Operations</NavHeading>
                <NavItem to="/finance/invoices"     icon="bi-receipt"      label="Invoices"      onClick={handleItemClick} />
                <NavItem to="/finance/payments"     icon="bi-cash"         label="Payments"      onClick={handleItemClick} />
                <NavItem to="/finance/mpesa"        icon="bi-phone"        label="MPESA"         onClick={handleItemClick} />
                <NavItem to="/finance/fee-structure"icon="bi-list-ul"      label="Fee Structure" onClick={handleItemClick} />
                <NavItem to="/finance/reports"      icon="bi-graph-up"     label="Reports"       onClick={handleItemClick} />
              </>
            )}

            {/* ══════════════════════════════════════════════
                TEACHER PORTAL
                ══════════════════════════════════════════════ */}
            {isTeacher && (
              <>
                <NavHeading>Teacher Workspace</NavHeading>
                <NavItem to="/teacher/dashboard" icon="bi-speedometer2"       label="Dashboard"   onClick={handleItemClick} />

                <NavGroup icon="bi-pencil-square" label="Mark Management" onChildClick={childClick}>
                  <SubItem to="/teacher/marks/subjects" label="My Subjects"         />
                  <SubItem to="/teacher/marks/entry"    label="Enter Marks"         />
                  <SubItem to="/teacher/marks/upload"   label="Bulk Upload"         />
                  <SubItem to="/teacher/marks/analysis" label="Performance Analysis"/>
                </NavGroup>

                <NavItem to="/teacher/attendance" icon="bi-calendar-check-fill"  label="Attendance"   onClick={handleItemClick} />
                <NavItem to="/teacher/reports"    icon="bi-bar-chart-line-fill"  label="Class Reports" onClick={handleItemClick} />
                <NavItem to="/teacher/timetable"  icon="bi-calendar-week"        label="My Timetable"  onClick={handleItemClick} />
              </>
            )}

            {/* ══════════════════════════════════════════════
                STUDENT PORTAL
                ══════════════════════════════════════════════ */}
            {isStudent && (
              <>
                <NavHeading>Student Hub</NavHeading>
                <NavItem to="/student/dashboard" icon="bi-speedometer2" label="Dashboard" onClick={handleItemClick} />

                <NavGroup icon="bi-journal-check" label="Academic Results" onChildClick={childClick}>
                  <SubItem to="/student/results"             label="My Results"   />
                  <SubItem to="/student/results/report-card" label="Report Card"  />
                  <SubItem to="/student/results/transcript"  label="Transcript"   />
                </NavGroup>

                <NavGroup icon="bi-cash-coin" label="Fee Management" onChildClick={childClick}>
                  <SubItem to="/student/fees/statement" label="Fee Statement"    />
                  <SubItem to="/student/fees/pay"       label="Pay Fees"         />
                  <SubItem to="/student/fees/payments"  label="Payment History"  />
                </NavGroup>

                <NavItem to="/student/attendance" icon="bi-calendar-event-fill" label="Attendance" onClick={handleItemClick} />
                <NavItem to="/student/timetable"  icon="bi-calendar-week"       label="Timetable"  onClick={handleItemClick} />
                <NavItem to="/student/profile"    icon="bi-person-circle"       label="My Profile" onClick={handleItemClick} />
              </>
            )}

          </ul>
        </div>
      </aside>
    </>
  );
}