# 🏫 Kenyan High School Management Information System (MIS)

A full-stack School MIS/ERP built with **Django REST Framework** (backend) and **React + Vite** (frontend), styled with NiceAdmin Bootstrap theme. Designed specifically for Kenyan secondary schools operating under the 8-4-4 curriculum.

---

## 📁 Full Project Structure

```
school-mis/
│
├── README.md
├── .env                          # Environment variables (SECRET_KEY, DB, MPESA keys)
├── .gitignore
│
├── backend/                      # Django Backend
│   ├── manage.py
│   ├── requirements.txt
│   │
│   ├── config/                   # Django project config (replaces default project dir)
│   │   ├── __init__.py
│   │   ├── settings.py           # All settings: DB, auth, CORS, email, MPESA, static
│   │   ├── urls.py               # Root URL config → points all routes to api/
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   └── core/                     # Single general-purpose Django app (all models live here)
│       ├── __init__.py
│       ├── admin.py              # Django admin registrations for all models
│       ├── apps.py
│       ├── models.py             # ALL database models
│       ├── serializers.py        # ALL DRF serializers
│       ├── views.py              # ALL DRF views (ViewSets + APIViews)
│       ├── urls.py               # App-level URL patterns (registered in config/urls.py)
│       ├── permissions.py        # Custom permission classes (IsTeacher, IsStudent, etc.)
│       ├── filters.py            # Django-filter filterset classes
│       ├── signals.py            # Django signals (e.g., post-save fee notifications)
│       ├── utils.py              # Helper functions (grading engine, MPESA, SMS)
│       ├── tasks.py              # Celery async tasks (report generation, bulk SMS)
│       ├── migrations/
│       │   └── 0001_initial.py
│       └── tests/
│           ├── __init__.py
│           ├── test_models.py
│           ├── test_views.py
│           └── test_utils.py
│
└── frontend/                     # React + Vite Frontend
    ├── index.html                # HTML entry point (Bootstrap Icons CDN, Google Fonts)
    ├── vite.config.js            # Vite config (proxy to Django backend on port 8000)
    ├── package.json
    ├── .env                      # VITE_API_BASE_URL etc.
    │
    ├── public/
    │   ├── favicon.ico
    │   └── assets/
    │       └── logo.png
    │
    └── src/
        ├── main.jsx              # React DOM render entry point
        ├── App.jsx               # Root component: Router, Auth context, route guards
        │
        ├── styles/
        │   └── main.css          # NiceAdmin CSS (full styles from provided stylesheet)
        │
        ├── utils/
        │   ├── api.js            # Axios instance, interceptors, all API call functions
        │   ├── auth.js           # Token helpers: getToken, setToken, clearToken, parseJWT
        │   ├── grading.js        # Client-side grade/points display helpers
        │   └── formatters.js     # Date, currency (KES), number formatters
        │
        ├── context/
        │   ├── AuthContext.jsx   # Auth state: user, role, login(), logout()
        │   └── ThemeContext.jsx  # Sidebar toggle, theme preferences
        │
        ├── hooks/
        │   ├── useAuth.js        # useContext(AuthContext) shorthand
        │   ├── useFetch.js       # Generic data fetching hook with loading/error state
        │   └── useRole.js        # Role-based rendering helper hook
        │
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx        # NiceAdmin sidebar with role-based nav links
        │   │   ├── Navbar.jsx         # Top header: search, notifications, profile dropdown
        │   │   ├── Footer.jsx         # Bottom footer
        │   │   └── Layout.jsx         # Wrapper: Sidebar + Navbar + <Outlet/>
        │   │
        │   ├── common/
        │   │   ├── PageTitle.jsx      # Breadcrumb + page heading component
        │   │   ├── StatCard.jsx       # Dashboard info-card (icon, value, label, trend)
        │   │   ├── DataTable.jsx      # Reusable sortable/paginated table
        │   │   ├── Modal.jsx          # Bootstrap modal wrapper
        │   │   ├── ConfirmDialog.jsx  # Delete/action confirmation dialog
        │   │   ├── AlertMessage.jsx   # Success/error/warning alert banners
        │   │   ├── LoadingSpinner.jsx # Full-page or inline spinner
        │   │   ├── Badge.jsx          # Grade/status badge with color coding
        │   │   ├── SearchBar.jsx      # Reusable search input
        │   │   └── EmptyState.jsx     # Empty list illustration + CTA
        │   │
        │   ├── forms/
        │   │   ├── InputField.jsx     # Labeled input with validation error display
        │   │   ├── SelectField.jsx    # Styled select/dropdown
        │   │   ├── DateField.jsx      # Date picker input
        │   │   └── FormWrapper.jsx    # Form container with submit handling
        │   │
        │   └── charts/
        │       ├── GradeBarChart.jsx       # Subject grades bar chart (Recharts)
        │       ├── FeePaymentChart.jsx     # Fee payment timeline chart
        │       └── PerformanceTrend.jsx    # Student performance trend line chart
        │
        ├── pages/
        │   │
        │   ├── auth/
        │   │   ├── Login.jsx           # Unified login page (role-based redirect)
        │   │   ├── ForgotPassword.jsx
        │   │   └── ResetPassword.jsx
        │   │
        │   ├── admin/                  # Admin Portal Pages
        │   │   ├── AdminDashboard.jsx      # Stats: students, fees collected, mean grade
        │   │   │
        │   │   ├── students/
        │   │   │   ├── StudentList.jsx         # All students table with filters
        │   │   │   ├── StudentDetail.jsx        # Student profile: marks, fees, attendance
        │   │   │   ├── StudentForm.jsx          # Admit / edit student form
        │   │   │   ├── StudentPromotion.jsx     # Year-end promotion runner UI
        │   │   │   └── StudentImport.jsx        # Bulk Excel import
        │   │   │
        │   │   ├── academics/
        │   │   │   ├── FormList.jsx            # Manage Forms (1–4)
        │   │   │   ├── StreamList.jsx          # Manage Streams per Form
        │   │   │   ├── SubjectList.jsx         # All subjects
        │   │   │   ├── AcademicYearList.jsx    # Academic years & terms
        │   │   │   └── ClassroomList.jsx       # Form + Stream + Year combinations
        │   │   │
        │   │   ├── exams/
        │   │   │   ├── ExamList.jsx            # All exams (CATs, midterm, end-term, mock)
        │   │   │   ├── ExamForm.jsx            # Create/edit exam
        │   │   │   ├── ExamResults.jsx         # View all results for an exam
        │   │   │   └── ReportCards.jsx         # Generate & download PDF report cards
        │   │   │
        │   │   ├── teachers/
        │   │   │   ├── TeacherList.jsx         # All teachers table
        │   │   │   ├── TeacherForm.jsx         # Add/edit teacher
        │   │   │   ├── TeacherDetail.jsx       # Teacher profile + allocations
        │   │   │   └── SubjectAllocation.jsx   # Assign teacher → subject → class
        │   │   │
        │   │   ├── finance/
        │   │   │   ├── FeeStructure.jsx        # Define fee items (tuition, boarding, etc.)
        │   │   │   ├── InvoiceList.jsx         # All student invoices
        │   │   │   ├── PaymentList.jsx         # All payments received
        │   │   │   ├── MpesaReconcile.jsx      # MPESA payment reconciliation
        │   │   │   └── FinanceReports.jsx      # Collections summary, arrears report
        │   │   │
        │   │   ├── attendance/
        │   │   │   ├── AttendanceList.jsx      # Daily attendance overview
        │   │   │   └── AttendanceReport.jsx    # Student attendance history
        │   │   │
        │   │   └── settings/
        │   │       ├── SchoolSettings.jsx      # School name, logo, term dates
        │   │       └── GradingSettings.jsx     # Customize grading scale
        │   │
        │   ├── teacher/                # Teacher Portal Pages
        │   │   ├── TeacherDashboard.jsx    # My subjects, pending mark entries
        │   │   │
        │   │   ├── marks/
        │   │   │   ├── MySubjects.jsx          # List of allocated subject+class combos
        │   │   │   ├── MarksEntry.jsx          # Enter/edit marks for a subject+exam
        │   │   │   ├── MarksUpload.jsx         # Upload marks via Excel file
        │   │   │   └── ClassAnalysis.jsx       # Performance analysis for a class
        │   │   │
        │   │   ├── attendance/
        │   │   │   └── TakeAttendance.jsx      # Mark daily attendance for a class
        │   │   │
        │   │   └── reports/
        │   │       └── StreamReport.jsx        # Stream-level performance report
        │   │
        │   └── student/                # Student Portal Pages
        │       ├── StudentDashboard.jsx    # Fee balance, mean grade, recent results
        │       │
        │       ├── results/
        │       │   ├── MyResults.jsx           # All exam results with grades
        │       │   ├── ResultDetail.jsx        # Single exam breakdown + position
        │       │   └── ReportCard.jsx          # Download PDF report card
        │       │
        │       ├── fees/
        │       │   ├── FeeStatement.jsx        # Detailed fee statement + balance
        │       │   ├── PayFee.jsx              # MPESA STK push payment initiation
        │       │   └── PaymentHistory.jsx      # All payment receipts
        │       │
        │       ├── attendance/
        │       │   └── MyAttendance.jsx        # Personal attendance record
        │       │
        │       └── profile/
        │           └── MyProfile.jsx           # View student profile info
│
│
```

---

## 🗃️ Backend Models Overview (`core/models.py`)

| Model | Description |
|---|---|
| `User` | Extended AbstractUser with `role` field (admin, teacher, student, parent, finance) |
| `Student` | Profile: adm no, DOB, KCPE marks, parent info, dormitory |
| `Parent` | Linked to one or more students |
| `Teacher` | Staff profile linked to User |
| `Form` | Form 1–4 |
| `Stream` | Stream per Form (East, West, North, etc.) |
| `AcademicYear` | e.g. 2026, with Term 1/2/3 |
| `Classroom` | Form + Stream + AcademicYear combination |
| `StudentClassHistory` | Tracks all class allocations per student per year |
| `Subject` | e.g. Mathematics, English, Chemistry |
| `TeacherSubjectAllocation` | Teacher → Subject → Classroom mapping |
| `Exam` | CAT, midterm, end-term, mock, opener |
| `ExamResult` | Student → Subject → Exam → Marks → Grade |
| `GradingScale` | Min/max marks, grade letter, grade points (customisable) |
| `Attendance` | Daily student attendance record |
| `FeeStructure` | Fee line items (tuition, boarding, activity fee, etc.) |
| `Invoice` | Student's fee invoice per term |
| `Payment` | Payment record linked to Invoice + MPESA receipt |
| `MpesaTransaction` | Raw MPESA callback data |
| `Notification` | SMS/email notification log |

---

## 🔌 API Endpoints Overview (`core/urls.py` → `config/urls.py` at `api/`)

```
api/auth/
  POST  login/               # JWT token obtain
  POST  token/refresh/       # JWT token refresh
  POST  logout/

api/students/                # CRUD students
api/students/<id>/promote/   # Trigger promotion
api/students/<id>/results/   # All results for a student
api/students/<id>/fees/      # Fee statement

api/teachers/                # CRUD teachers
api/teachers/<id>/allocations/

api/academics/forms/
api/academics/streams/
api/academics/classrooms/
api/academics/years/
api/academics/subjects/

api/exams/                   # CRUD exams
api/exams/<id>/results/      # All results for an exam
api/marks/                   # POST marks entry (teacher only)
api/marks/upload/            # Excel bulk upload

api/attendance/
api/attendance/bulk/

api/fees/structures/
api/fees/invoices/
api/fees/payments/
api/fees/mpesa/callback/     # Safaricom Daraja callback (public)
api/fees/mpesa/stkpush/      # Initiate STK push

api/reports/reportcard/<student_id>/<exam_id>/   # PDF download
api/reports/stream/<classroom_id>/<exam_id>/
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | Django 5.x + Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL |
| File Uploads | Django + Pillow |
| MPESA | Daraja API (STK Push + Callback) |
| SMS | Africa's Talking |
| PDF Reports | WeasyPrint / ReportLab |
| Excel Import | openpyxl |
| Frontend Framework | React 18 + Vite |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| UI Theme | NiceAdmin (Bootstrap 5.3) |
| Icons | Bootstrap Icons CDN |
| Fonts | Google Fonts (Open Sans, Nunito, Poppins) |

---

## 🚀 Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env .env          # set your variables
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env     # set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## 👥 User Roles & Access

| Role | Portal | Key Permissions |
|---|---|---|
| `admin` | Admin Portal | Full system access, promotions, settings |
| `teacher` | Teacher Portal | Enter marks for allocated subjects only |
| `student` | Student Portal | View own results, fees, attendance |
| `parent` | Parent Portal | View linked children's data |
| `finance` | Finance Portal | Manage invoices, payments, reconciliation |

---

## 📋 Notes

- All financial amounts are in **KES (Kenyan Shillings)**
- Grading follows the **Kenya National Examinations Council (KNEC)** scale by default but is fully customisable via `GradingScale` model
- The system supports both **8-4-4** and is structured to extend to **CBC**
- Student class history is **never overwritten** — full audit trail preserved
- MPESA integration uses **Safaricom Daraja API** (STK Push + C2B Paybill callbacks)
```