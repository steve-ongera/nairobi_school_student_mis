"""
core/urls.py – URL routing for the School MIS API
All routes are included under /api/ from the root urls.py
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Auth
    LoginView, LogoutView, MeView, ChangePasswordView, UserViewSet,

    # Academic Structure
    AcademicYearViewSet, TermViewSet, FormViewSet, StreamViewSet,
    ClassroomViewSet, SubjectViewSet,

    # Teachers
    TeacherViewSet, TeacherSubjectAllocationViewSet,

    # Students
    ParentViewSet, StudentViewSet,

    # Exams & Results
    GradingScaleViewSet, ExamViewSet, ExamResultViewSet,
    BulkMarksView, MarksExcelUploadView,

    # Attendance
    AttendanceViewSet,

    # Fees / Finance
    FeeStructureViewSet, InvoiceViewSet, PaymentViewSet,

    # MPESA
    MpesaSTKPushView, MpesaCallbackView, MpesaTransactionViewSet,

    # Notifications
    NotificationViewSet,

    # Promotions
    StudentPromotionViewSet,

    # Dashboards
    AdminDashboardView, TeacherDashboardView, StudentDashboardView,

    # Reports
    ReportCardView, StreamReportView,
)

router = DefaultRouter()

# Users
router.register(r"users", UserViewSet, basename="user")

# Academic Structure
router.register(r"academics/years", AcademicYearViewSet, basename="academic-year")
router.register(r"academics/terms", TermViewSet, basename="term")
router.register(r"academics/forms", FormViewSet, basename="form")
router.register(r"academics/streams", StreamViewSet, basename="stream")
router.register(r"academics/classrooms", ClassroomViewSet, basename="classroom")
router.register(r"academics/subjects", SubjectViewSet, basename="subject")

# Teachers
router.register(r"teachers", TeacherViewSet, basename="teacher")
router.register(r"teachers/allocations", TeacherSubjectAllocationViewSet, basename="teacher-allocation")

# Students
router.register(r"parents", ParentViewSet, basename="parent")
router.register(r"students", StudentViewSet, basename="student")

# Exams & Results
router.register(r"exams/grading", GradingScaleViewSet, basename="grading-scale")
router.register(r"exams", ExamViewSet, basename="exam")
router.register(r"results", ExamResultViewSet, basename="exam-result")

# Attendance
router.register(r"attendance", AttendanceViewSet, basename="attendance")

# Fees / Finance
router.register(r"fees/structures", FeeStructureViewSet, basename="fee-structure")
router.register(r"fees/invoices", InvoiceViewSet, basename="invoice")
router.register(r"fees/payments", PaymentViewSet, basename="payment")

# MPESA
router.register(r"fees/mpesa/transactions", MpesaTransactionViewSet, basename="mpesa-transaction")

# Notifications
router.register(r"notifications", NotificationViewSet, basename="notification")

# Promotions
router.register(r"promotions", StudentPromotionViewSet, basename="promotion")

urlpatterns = [
    # Auth
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),

    # Bulk marks & Excel upload
    path("marks/bulk/", BulkMarksView.as_view(), name="marks-bulk"),
    path("marks/upload/", MarksExcelUploadView.as_view(), name="marks-upload"),

    # MPESA non-viewset endpoints
    path("fees/mpesa/stkpush/", MpesaSTKPushView.as_view(), name="mpesa-stk-push"),
    path("fees/mpesa/callback/", MpesaCallbackView.as_view(), name="mpesa-callback"),

    # Dashboards
    path("dashboard/admin/", AdminDashboardView.as_view(), name="dashboard-admin"),
    path("dashboard/teacher/", TeacherDashboardView.as_view(), name="dashboard-teacher"),
    path("dashboard/student/", StudentDashboardView.as_view(), name="dashboard-student"),

    # Reports / PDF
    path(
        "reports/reportcard/<int:student_id>/<int:exam_id>/",
        ReportCardView.as_view(),
        name="report-card",
    ),
    path(
        "reports/stream/<int:classroom_id>/<int:exam_id>/",
        StreamReportView.as_view(),
        name="stream-report",
    ),

    # Router URLs (all ViewSets)
    path("", include(router.urls)),
]