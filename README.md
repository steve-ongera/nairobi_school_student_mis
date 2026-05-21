# HighSchool/ CBC  Management Information System – React + Vite Frontend

Kenya High School Management Information System frontend built with **React 18 + Vite**, styled with the **NiceAdmin Bootstrap 5** theme. Multi-role portal system for Admin, Teacher, Student, and Finance users.

---

## Complete File Structure (65 files)

```
school-mis/
│
├── .env                                        # VITE_API_BASE_URL=http://localhost:8000
├── index.html                                  # HTML entry – Bootstrap 5, Bootstrap Icons, Google Fonts CDN
├── package.json                                # Dependencies: react, react-router-dom, axios, recharts, xlsx
├── vite.config.js                              # Vite + proxy to Django :8000
│
└── src/
    │
    ├── main.jsx                                # ReactDOM.createRoot – wraps App in BrowserRouter + Providers
    ├── App.jsx                                 # All routes, RequireAuth guards, role-based root redirect
    │
    ├── styles/
    │   └── main.css                            # Full NiceAdmin CSS + custom grade/stat card styles
    │
    ├── context/
    │   ├── AuthContext.jsx                     # Auth state: user, login(), logout(), error – JWT storage
    │   └── ThemeContext.jsx                    # Sidebar toggle state, toggleSidebar()
    │
    ├── hooks/
    │   ├── index.js                            # useAuth(), useTheme(), useRole(), useFetch()
    │   └── useDebounce.js                      # useDebounce(value, delay) + usePagination(items, pageSize)
    │
    ├── utils/
    │   ├── api.js                              # Axios instance, JWT interceptor, ALL API call functions
    │   ├── auth.js                             # getAccessToken, setTokens, clearTokens, parseJWT, getStoredUser
    │   ├── formatters.js                       # formatCurrency (KES), formatDate, formatDateTime, statusBadge
    │   └── grading.js                          # getGradeColor, getMeanGrade, isGoodGrade, formatGradeDisplay
    │
    ├── components/
    │   │
    │   ├── layout/
    │   │   ├── Layout.jsx                      # Navbar + Sidebar + <Outlet/> + Footer wrapper
    │   │   ├── Navbar.jsx                      # Top bar: logo, sidebar toggle, notifications dropdown, profile menu
    │   │   ├── Sidebar.jsx                     # Role-based nav links (admin/teacher/student/finance)
    │   │   └── RequireAuth.jsx                 # Route guard: checks auth + allowedRoles, redirects if denied
    │   │
    │   ├── common/
    │   │   ├── index.jsx                       # PageTitle, StatCard, LoadingSpinner, AlertMessage, EmptyState,
    │   │   │                                   # StatusBadge, GradeBadge, DataTable, SearchBar, ConfirmDialog
    │   │   ├── Pagination.jsx                  # Bootstrap pagination with ellipsis for large page counts
    │   │   └── Extras.jsx                      # Modal, Tabs, FileUpload (drag+drop), PrintButton, ExportCSV
    │   │
    │   └── charts/
    │       └── Charts.jsx                      # GradeBarChart, FeePaymentChart, PerformanceTrend,
    │                                           # AttendanceDonut, ClassPerformanceChart (all Recharts)
    │
    └── pages/
        │
        ├── NotFound.jsx                        # 404 page + Unauthorized (403) page – both exported here
        ├── Unauthorized.jsx                    # Re-exports Unauthorized from NotFound.jsx
        ├── Notifications.jsx                   # My notifications list for any logged-in role
        │
        ├── auth/
        │   ├── Login.jsx                       # Unified login form → role-based redirect on success
        │   └── ForgotPassword.jsx              # Static "contact admin" page (no backend reset endpoint)
        │
        ├── profile/
        │   ├── ProfilePage.jsx                 # View/edit profile for all roles (name, phone) via PATCH /me/
        │   └── ChangePassword.jsx              # Change password form for all roles
        │
        ├── admin/
        │   ├── AdminDashboard.jsx              # Stats cards, fee summary, students-per-form bar chart,
        │   │                                   # recent payments table, quick action buttons
        │   │
        │   ├── academics/
        │   │   ├── Academics.jsx               # ClassroomList, SubjectList, AcademicYearList + TermList
        │   │   └── Forms.jsx                   # FormList (cards), StreamList (table with form filter)
        │   │
        │   ├── attendance/
        │   │   ├── Attendance.jsx              # AttendanceList + AttendanceReport (both exported)
        │   │   ├── AttendanceList.jsx          # Re-export shim for AttendanceList
        │   │   └── AttendanceReport.jsx        # Re-export shim for AttendanceReport
        │   │
        │   ├── exams/
        │   │   ├── ExamList.jsx                # All exams table with publish button
        │   │   ├── ExamForm.jsx                # Create/edit exam: name, type, term, forms, date
        │   │   ├── ExamSettings.jsx            # ExamResults view + GradingSettings (seed KNEC defaults)
        │   │   └── ReportCards.jsx             # Batch PDF download per classroom – checkbox select + progress bar
        │   │
        │   ├── finance/
        │   │   ├── Finance.jsx                 # InvoiceList, PaymentList, FeeStructurePage, MpesaReconcile
        │   │   └── FinanceReports.jsx          # Collection summary, arrears table, payment trend chart, CSV export
        │   │
        │   ├── settings/
        │   │   └── SchoolSettings.jsx          # School name/address/phone/email saved to localStorage
        │   │
        │   ├── students/
        │   │   ├── StudentList.jsx             # All students table: search, filter, delete, links
        │   │   ├── StudentDetail.jsx           # Full student profile: tabs for overview, class, parent + fee summary
        │   │   ├── StudentForm.jsx             # Admit/edit student: account, personal, boarding, medical fields
        │   │   ├── StudentPromotion.jsx        # Bulk promote classroom → classroom with status and notes
        │   │   └── StudentImport.jsx           # SheetJS Excel upload: preview 10 rows, progress bar, error log
        │   │
        │   └── teachers/
        │       ├── Teachers.jsx                # TeacherList, TeacherForm, SubjectAllocation (all exported)
        │       └── TeacherDetail.jsx           # Teacher profile card + subject allocations table
        │
        ├── teacher/
        │   ├── TeacherDashboard.jsx            # Allocations table, pending mark entries, quick action buttons
        │   │
        │   ├── attendance/
        │   │   └── TakeAttendance.jsx          # Mark daily attendance per class: mark-all shortcuts, status buttons
        │   │
        │   ├── marks/
        │   │   ├── MySubjects.jsx              # Allocation cards with Enter Marks / Analysis buttons
        │   │   ├── MarksEntry.jsx              # Enter marks inline per student for a subject+exam+class
        │   │   ├── MarksUpload.jsx             # Upload .xlsx marks file with error log
        │   │   └── ClassAnalysis.jsx           # Stats (highest/lowest/mean/pass rate) + horizontal bar chart
        │   │
        │   └── reports/
        │       └── StreamReport.jsx            # Stream rankings table + mean score bar chart + PDF download per student
        │
        └── student/
            ├── StudentDashboard.jsx            # Welcome banner, fee/grade/attendance stats, radar chart, invoice
            │
            ├── attendance/
            │   └── MyAttendance.jsx            # Attendance donut chart + scrollable records table
            │
            ├── fees/
            │   ├── FeeStatement.jsx            # Invoice cards with payment progress bar and payments sub-table
            │   ├── PayFee.jsx                  # MPESA STK Push form: invoice select, phone, amount
            │   └── PaymentHistory.jsx          # All payments table with total footer row
            │
            ├── profile/
            │   └── MyProfile.jsx               # Student profile view + inline change password form
            │
            └── results/
                ├── Results.jsx                 # MyResults (exam select + table) + ReportCard (PDF download)
                └── ResultDetail.jsx            # Single exam: subject table + grade bar chart + summary card
```

---

##  Quick Start

```bash
cd school-mis
npm install
cp .env .env.local          # edit VITE_API_BASE_URL if needed
npm run dev                  # starts on http://localhost:3000
```

Make sure the Django backend is running on `http://localhost:8000`.

---

## 👥 Role → Portal Mapping

| Role | Landing Page | Portal |
|---|---|---|
| `admin` | `/admin/dashboard` | Full system access |
| `teacher` | `/teacher/dashboard` | Marks, attendance, reports |
| `student` | `/student/dashboard` | Results, fees, attendance |
| `finance` | `/admin/finance/invoices` | Invoices, payments, MPESA |
| `parent` | `/student/dashboard` | Read-only student view |

---

##  Dependencies

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` v6 | Client-side routing |
| `axios` | HTTP client with JWT interceptor |
| `recharts` | Charts (bar, line, pie, radar) |
| `xlsx` (SheetJS) | Client-side Excel parsing for bulk import |
| `bootstrap` 5.3 (CDN) | CSS grid and components |
| `bootstrap-icons` (CDN) | Icon set |
| `vite` | Build tool and dev server |

---

##  Key Patterns

**API calls** — all in `src/utils/api.js`. Every endpoint from `core/urls.py` has a matching function.

**Auth** — JWT stored in `localStorage`. Auto-refresh on 401 via Axios interceptor. `AuthContext` provides `user`, `login()`, `logout()`.

**Route guards** — `RequireAuth` wraps every protected route. Pass `allowedRoles={["admin"]}` to restrict by role.

**Data fetching** — `useFetch(fetchFn, deps)` hook handles loading/error/refetch pattern throughout.

**Shared components** — `src/components/common/index.jsx` exports all reusable UI components. Import as `import { PageTitle, DataTable, AlertMessage } from "../../components/common"`.

**Charts** — all five chart components live in `src/components/charts/Charts.jsx` and use Recharts.

**Formatting** — KES currency via `formatCurrency()`, dates via `formatDate()` / `formatDateTime()`, grade display via `src/utils/grading.js`.