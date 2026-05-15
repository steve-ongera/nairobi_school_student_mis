"""
core/views.py – All Django REST Framework views for the School MIS.

Groups:
  1.  Auth views
  2.  Academic Structure views
  3.  Teacher views
  4.  Student views
  5.  Exam & Results views
  6.  Attendance views
  7.  Fees / Finance views
  8.  MPESA views
  9.  Notification views
  10. Promotion views
  11. Dashboard views
  12. Report / PDF views
"""

import io
import logging
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ViewSet
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    AcademicYear, Term, Form, Stream, Classroom, Subject,
    Teacher, TeacherSubjectAllocation,
    Parent, Student, StudentClassHistory,
    GradingScale, Exam, ExamResult,
    Attendance,
    FeeStructure, Invoice, Payment, MpesaTransaction,
    Notification,
    StudentPromotion,
)
from .permissions import (
    IsAdmin, IsTeacher, IsStudent, IsParent, IsFinance,
    IsAdminOrFinance, IsAdminOrTeacher, IsOwnerOrAdmin, IsAllocatedTeacher,
)
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer, UserCreateSerializer, ChangePasswordSerializer,
    AcademicYearSerializer, TermSerializer, FormSerializer, StreamSerializer,
    ClassroomSerializer, SubjectSerializer,
    TeacherSerializer, TeacherCreateSerializer, TeacherSubjectAllocationSerializer,
    ParentSerializer,
    StudentListSerializer, StudentDetailSerializer, StudentCreateSerializer,
    StudentClassHistorySerializer,
    GradingScaleSerializer, ExamSerializer, ExamResultSerializer,
    BulkMarksSerializer,
    AttendanceSerializer, BulkAttendanceSerializer,
    FeeStructureSerializer, InvoiceSerializer, PaymentSerializer,
    MpesaSTKPushSerializer, MpesaCallbackSerializer,
    NotificationSerializer,
    StudentPromotionSerializer, BulkPromotionSerializer,
    AdminDashboardSerializer, TeacherDashboardSerializer, StudentDashboardSerializer,
    FeeStatementSerializer,
)
from .utils import (
    initiate_stk_push, process_mpesa_callback, run_bulk_promotion,
    compute_student_exam_summary, compute_rankings,
    send_results_sms, send_attendance_alert_sms,
)

User = get_user_model()
logger = logging.getLogger(__name__)


# =============================================================================
# 1. AUTH VIEWS
# =============================================================================

class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Accepts email + password.  Returns access + refresh JWT tokens
    plus user metadata (role, full_name, email).
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the submitted refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """
    GET  /api/auth/me/   – Return current user's profile.
    PATCH /api/auth/me/  – Update name, phone, profile picture.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password changed successfully."})


class UserViewSet(ModelViewSet):
    """
    /api/users/ – Admin-only user management.
    """
    queryset = User.objects.all().order_by("last_name")
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["role", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["last_name", "date_joined"]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer


# =============================================================================
# 2. ACADEMIC STRUCTURE VIEWS
# =============================================================================

class AcademicYearViewSet(ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def current(self, request):
        """GET /api/academics/years/current/ – Return the active academic year."""
        year = AcademicYear.objects.filter(is_current=True).first()
        if not year:
            return Response({"detail": "No current academic year set."}, status=404)
        return Response(AcademicYearSerializer(year).data)


class TermViewSet(ModelViewSet):
    queryset = Term.objects.select_related("academic_year").all()
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["academic_year", "term_number", "is_current"]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def current(self, request):
        """GET /api/academics/terms/current/ – Return the active term."""
        term = Term.objects.filter(is_current=True).first()
        if not term:
            return Response({"detail": "No current term set."}, status=404)
        return Response(TermSerializer(term).data)


class FormViewSet(ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class StreamViewSet(ModelViewSet):
    queryset = Stream.objects.select_related("form").all()
    serializer_class = StreamSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["form"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class ClassroomViewSet(ModelViewSet):
    queryset = Classroom.objects.select_related(
        "stream__form", "academic_year", "class_teacher__user"
    ).all()
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["stream__form", "academic_year", "stream"]
    search_fields = ["stream__name", "stream__form__name"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["get"])
    def students(self, request, pk=None):
        """GET /api/academics/classrooms/{id}/students/ – List students in a classroom."""
        classroom = self.get_object()
        students = Student.objects.filter(
            current_classroom=classroom, status=Student.Status.ACTIVE
        ).select_related("user")
        serializer = StudentListSerializer(students, many=True)
        return Response(serializer.data)


class SubjectViewSet(ModelViewSet):
    queryset = Subject.objects.prefetch_related("applicable_forms").all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["subject_type", "is_active"]
    search_fields = ["name", "code"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


# =============================================================================
# 3. TEACHER VIEWS
# =============================================================================

class TeacherViewSet(ModelViewSet):
    queryset = Teacher.objects.select_related("user").all()
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active", "department"]
    search_fields = ["user__first_name", "user__last_name", "user__email", "staff_number"]
    ordering_fields = ["user__last_name", "staff_number"]

    def get_serializer_class(self):
        if self.action == "create":
            return TeacherCreateSerializer
        return TeacherSerializer

    @action(detail=True, methods=["get"])
    def allocations(self, request, pk=None):
        """GET /api/teachers/{id}/allocations/ – All subject allocations for a teacher."""
        teacher = self.get_object()
        allocs = teacher.allocations.select_related(
            "subject", "classroom__stream__form", "academic_year"
        ).all()
        serializer = TeacherSubjectAllocationSerializer(allocs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated, IsTeacher])
    def my_allocations(self, request):
        """
        GET /api/teachers/my_allocations/
        Teacher portal: returns allocations for the logged-in teacher,
        filtered by current academic year.
        """
        try:
            teacher = request.user.teacher_profile
        except Teacher.DoesNotExist:
            return Response({"detail": "Teacher profile not found."}, status=404)

        current_year = AcademicYear.objects.filter(is_current=True).first()
        allocs = teacher.allocations.filter(academic_year=current_year).select_related(
            "subject", "classroom__stream__form", "academic_year"
        )
        serializer = TeacherSubjectAllocationSerializer(allocs, many=True)
        return Response(serializer.data)


class TeacherSubjectAllocationViewSet(ModelViewSet):
    queryset = TeacherSubjectAllocation.objects.select_related(
        "teacher__user", "subject", "classroom__stream__form", "academic_year"
    ).all()
    serializer_class = TeacherSubjectAllocationSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["teacher", "subject", "classroom", "academic_year"]


# =============================================================================
# 4. STUDENT VIEWS
# =============================================================================

class ParentViewSet(ModelViewSet):
    queryset = Parent.objects.select_related("user").all()
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFinance]
    search_fields = ["user__first_name", "user__last_name", "user__email"]


class StudentViewSet(ModelViewSet):
    queryset = Student.objects.select_related(
        "user", "current_classroom__stream__form",
        "current_classroom__academic_year", "parent__user"
    ).all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        "status", "gender", "boarding_status",
        "current_classroom", "current_classroom__stream__form",
        "current_classroom__academic_year",
    ]
    search_fields = [
        "admission_number", "user__first_name", "user__last_name", "user__email"
    ]
    ordering_fields = ["admission_number", "user__last_name"]

    def get_serializer_class(self):
        if self.action == "create":
            return StudentCreateSerializer
        if self.action == "list":
            return StudentListSerializer
        return StudentDetailSerializer

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsAuthenticated(), IsAdminOrTeacher()]
        if self.action == "list":
            return [IsAuthenticated(), IsAdminOrTeacher()]
        # retrieve: student can see themselves
        return [IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Students can only view their own profile
        if request.user.role == "student":
            try:
                if instance.user != request.user:
                    return Response(status=status.HTTP_403_FORBIDDEN)
            except Exception:
                return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def results(self, request, pk=None):
        """GET /api/students/{id}/results/?exam=<id> – All results for a student."""
        student = self.get_object()
        results_qs = student.results.select_related("exam", "subject")
        exam_id = request.query_params.get("exam")
        if exam_id:
            results_qs = results_qs.filter(exam_id=exam_id)
        serializer = ExamResultSerializer(results_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def fee_statement(self, request, pk=None):
        """GET /api/students/{id}/fee_statement/ – Full fee statement."""
        student = self.get_object()
        invoices = student.invoices.prefetch_related("payments").select_related("term__academic_year")
        total_charged = invoices.aggregate(t=Sum("total_amount"))["t"] or Decimal("0")
        total_paid = invoices.aggregate(t=Sum("amount_paid"))["t"] or Decimal("0")
        return Response({
            "student": StudentListSerializer(student).data,
            "invoices": InvoiceSerializer(invoices, many=True).data,
            "total_charged": total_charged,
            "total_paid": total_paid,
            "total_balance": total_charged - total_paid,
        })

    @action(detail=True, methods=["get"])
    def class_history(self, request, pk=None):
        """GET /api/students/{id}/class_history/ – Historical class records."""
        student = self.get_object()
        history = student.class_history.select_related(
            "classroom__stream__form", "academic_year", "term"
        )
        serializer = StudentClassHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated, IsStudent])
    def me(self, request):
        """
        GET /api/students/me/
        Student portal: returns the logged-in student's own profile.
        """
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=404)
        serializer = StudentDetailSerializer(student, context={"request": request})
        return Response(serializer.data)


# =============================================================================
# 5. EXAM & RESULTS VIEWS
# =============================================================================

class GradingScaleViewSet(ModelViewSet):
    queryset = GradingScale.objects.all()
    serializer_class = GradingScaleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    @action(detail=False, methods=["post"])
    def seed_defaults(self, request):
        """POST /api/exams/grading/seed_defaults/ – Seed KNEC default scale."""
        from .utils import seed_default_grading_scale
        seed_default_grading_scale()
        return Response({"detail": "Default KNEC grading scale seeded."})


class ExamViewSet(ModelViewSet):
    queryset = Exam.objects.select_related("term__academic_year").prefetch_related(
        "applicable_forms"
    ).all()
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["exam_type", "term", "is_published", "applicable_forms"]
    search_fields = ["name"]
    ordering_fields = ["term__academic_year__year", "term__term_number"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "publish"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """
        POST /api/exams/{id}/publish/
        Makes results visible to students and sends SMS notifications.
        """
        exam = self.get_object()
        exam.is_published = True
        exam.save(update_fields=["is_published"])
        # TODO: trigger bulk SMS notifications via Celery task
        return Response({"detail": f"'{exam.name}' results published."})

    @action(detail=True, methods=["get"])
    def results(self, request, pk=None):
        """
        GET /api/exams/{id}/results/?classroom=<id>
        All results for an exam, optionally filtered by classroom.
        """
        exam = self.get_object()
        results_qs = exam.results.select_related("student__user", "subject")
        classroom_id = request.query_params.get("classroom")
        if classroom_id:
            results_qs = results_qs.filter(
                student__current_classroom_id=classroom_id
            )
        serializer = ExamResultSerializer(results_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def rankings(self, request, pk=None):
        """
        GET /api/exams/{id}/rankings/?classroom=<id>
        Returns stream/form/overall positions for this exam.
        """
        exam = self.get_object()
        rankings = compute_rankings(exam)
        return Response(rankings)


class ExamResultViewSet(ModelViewSet):
    queryset = ExamResult.objects.select_related(
        "student__user", "exam", "subject", "entered_by"
    ).all()
    serializer_class = ExamResultSerializer
    filterset_fields = ["exam", "subject", "student"]
    search_fields = ["student__admission_number", "student__user__last_name"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsAuthenticated(), IsAllocatedTeacher()]
        if self.action == "destroy":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        self._check_teacher_allocation(serializer)
        serializer.save(entered_by=self.request.user)

    def perform_update(self, serializer):
        self._check_teacher_allocation(serializer)
        serializer.save(entered_by=self.request.user)

    def _check_teacher_allocation(self, serializer):
        """Verify teacher is allocated to the subject+classroom."""
        user = self.request.user
        if user.role == "admin":
            return  # Admins bypass this check

        exam = serializer.validated_data.get("exam")
        subject = serializer.validated_data.get("subject")
        student = serializer.validated_data.get("student")
        classroom = student.current_classroom if student else None

        try:
            teacher = user.teacher_profile
        except Teacher.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Teacher profile not found.")

        is_allocated = TeacherSubjectAllocation.objects.filter(
            teacher=teacher,
            subject=subject,
            classroom=classroom,
        ).exists()

        if not is_allocated:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied(
                f"You are not allocated to teach {subject} in {classroom}."
            )


class BulkMarksView(APIView):
    """
    POST /api/marks/bulk/
    Submit marks for an entire class in one request.
    Teacher must be allocated to the subject+classroom.
    """
    permission_classes = [IsAuthenticated, IsAllocatedTeacher]

    def post(self, request):
        serializer = BulkMarksSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        exam = serializer.validated_data["exam"]
        subject = serializer.validated_data["subject"]
        classroom = serializer.validated_data["classroom"]
        results_data = serializer.validated_data["results"]

        user = request.user

        # Verify allocation (skip for admin)
        if user.role != "admin":
            try:
                teacher = user.teacher_profile
            except Teacher.DoesNotExist:
                return Response({"detail": "Teacher profile not found."}, status=403)

            is_allocated = TeacherSubjectAllocation.objects.filter(
                teacher=teacher, subject=subject, classroom=classroom
            ).exists()
            if not is_allocated:
                return Response(
                    {"detail": f"Not allocated to teach {subject} in {classroom}."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        created_count = 0
        updated_count = 0
        errors = []

        with transaction.atomic():
            for item in results_data:
                try:
                    student = Student.objects.get(pk=item["student"])
                    marks = Decimal(str(item["marks"]))
                    remarks = item.get("remarks", "")

                    result, created = ExamResult.objects.update_or_create(
                        student=student,
                        exam=exam,
                        subject=subject,
                        defaults={
                            "marks": marks,
                            "remarks": remarks,
                            "entered_by": user,
                        },
                    )
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

                except Student.DoesNotExist:
                    errors.append({"student": item["student"], "error": "Student not found."})
                except Exception as e:
                    errors.append({"student": item.get("student"), "error": str(e)})

        return Response({
            "created": created_count,
            "updated": updated_count,
            "errors": errors,
        }, status=status.HTTP_200_OK)


class MarksExcelUploadView(APIView):
    """
    POST /api/marks/upload/
    Upload an Excel file with columns: admission_number, marks, remarks.
    Query params: exam=<id>&subject=<id>&classroom=<id>
    """
    permission_classes = [IsAuthenticated, IsAllocatedTeacher]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        import openpyxl

        exam_id = request.query_params.get("exam")
        subject_id = request.query_params.get("subject")
        classroom_id = request.query_params.get("classroom")
        file = request.FILES.get("file")

        if not all([exam_id, subject_id, classroom_id, file]):
            return Response(
                {"detail": "Provide exam, subject, classroom query params and an Excel file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            exam = Exam.objects.get(pk=exam_id)
            subject = Subject.objects.get(pk=subject_id)
            classroom = Classroom.objects.get(pk=classroom_id)
        except (Exam.DoesNotExist, Subject.DoesNotExist, Classroom.DoesNotExist) as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        try:
            wb = openpyxl.load_workbook(file)
            ws = wb.active
        except Exception as e:
            return Response(
                {"detail": f"Invalid Excel file: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created, updated, errors = 0, 0, []
        with transaction.atomic():
            for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
                if not row or not row[0]:
                    continue
                adm_no = str(row[0]).strip()
                marks_raw = row[1]
                remarks = str(row[2]).strip() if len(row) > 2 and row[2] else ""

                try:
                    marks = Decimal(str(marks_raw))
                    if marks < 0 or marks > 100:
                        raise ValueError("Out of range")
                except (TypeError, ValueError):
                    errors.append({"row": row_idx, "adm_no": adm_no, "error": "Invalid marks."})
                    continue

                try:
                    student = Student.objects.get(admission_number=adm_no)
                except Student.DoesNotExist:
                    errors.append({"row": row_idx, "adm_no": adm_no, "error": "Student not found."})
                    continue

                _, was_created = ExamResult.objects.update_or_create(
                    student=student, exam=exam, subject=subject,
                    defaults={"marks": marks, "remarks": remarks, "entered_by": request.user},
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        return Response({"created": created, "updated": updated, "errors": errors})


# =============================================================================
# 6. ATTENDANCE VIEWS
# =============================================================================

class AttendanceViewSet(ModelViewSet):
    queryset = Attendance.objects.select_related(
        "student__user", "classroom__stream__form", "recorded_by"
    ).all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]
    filterset_fields = ["classroom", "date", "status", "student"]
    search_fields = ["student__admission_number", "student__user__last_name"]
    ordering_fields = ["date"]

    def perform_create(self, serializer):
        instance = serializer.save(recorded_by=self.request.user)
        # Send SMS alert for absentees
        if instance.status == Attendance.AttendanceStatus.ABSENT:
            try:
                send_attendance_alert_sms(instance.student)
            except Exception as e:
                logger.warning("Failed to send attendance SMS: %s", e)

    @action(detail=False, methods=["post"])
    def bulk(self, request):
        """
        POST /api/attendance/bulk/
        Submit attendance for an entire class in one request.
        """
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        classroom = serializer.validated_data["classroom"]
        date = serializer.validated_data["date"]
        records = serializer.validated_data["records"]

        created, updated, errors = 0, 0, []
        with transaction.atomic():
            for item in records:
                try:
                    student = Student.objects.get(pk=item["student"])
                    att, was_created = Attendance.objects.update_or_create(
                        student=student,
                        date=date,
                        defaults={
                            "classroom": classroom,
                            "status": item["status"],
                            "remarks": item.get("remarks", ""),
                            "recorded_by": request.user,
                        },
                    )
                    if was_created:
                        created += 1
                        if att.status == Attendance.AttendanceStatus.ABSENT:
                            try:
                                send_attendance_alert_sms(student)
                            except Exception:
                                pass
                    else:
                        updated += 1
                except Student.DoesNotExist:
                    errors.append({"student": item["student"], "error": "Not found."})

        return Response({"created": created, "updated": updated, "errors": errors})

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated, IsStudent])
    def my_attendance(self, request):
        """
        GET /api/attendance/my_attendance/?term=<id>
        Student portal: own attendance records.
        """
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=404)

        qs = student.attendance_records.all()
        term_id = request.query_params.get("term")
        if term_id:
            try:
                term = Term.objects.get(pk=term_id)
                qs = qs.filter(date__gte=term.start_date, date__lte=term.end_date)
            except Term.DoesNotExist:
                pass

        serializer = AttendanceSerializer(qs, many=True)
        return Response(serializer.data)


# =============================================================================
# 7. FEES / FINANCE VIEWS
# =============================================================================

class FeeStructureViewSet(ModelViewSet):
    queryset = FeeStructure.objects.select_related("form", "term__academic_year").all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFinance]
    filterset_fields = ["form", "term", "category", "is_mandatory"]


class InvoiceViewSet(ModelViewSet):
    queryset = Invoice.objects.select_related(
        "student__user", "term__academic_year"
    ).prefetch_related("payments").all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFinance]
    filterset_fields = ["student", "term", "status"]
    search_fields = ["student__admission_number", "student__user__last_name"]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated, IsStudent])
    def my_invoices(self, request):
        """
        GET /api/fees/invoices/my_invoices/
        Student portal: own invoices.
        """
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=404)

        invoices = student.invoices.prefetch_related("payments").select_related(
            "term__academic_year"
        )
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def generate_for_classroom(self, request):
        """
        POST /api/fees/invoices/generate_for_classroom/
        Generate term invoices for all students in a classroom
        based on FeeStructure items.
        Body: {classroom: id, term: id}
        """
        classroom_id = request.data.get("classroom")
        term_id = request.data.get("term")

        try:
            classroom = Classroom.objects.get(pk=classroom_id)
            term = Term.objects.get(pk=term_id)
        except (Classroom.DoesNotExist, Term.DoesNotExist):
            return Response({"detail": "Invalid classroom or term."}, status=400)

        fee_items = FeeStructure.objects.filter(
            form=classroom.form, term=term, is_mandatory=True
        )
        total_amount = fee_items.aggregate(t=Sum("amount"))["t"] or Decimal("0")

        if total_amount == 0:
            return Response(
                {"detail": "No fee structure found for this form and term."}, status=400
            )

        students = Student.objects.filter(
            current_classroom=classroom, status=Student.Status.ACTIVE
        )
        created_count = 0
        for student in students:
            _, created = Invoice.objects.get_or_create(
                student=student,
                term=term,
                defaults={"total_amount": total_amount},
            )
            if created:
                created_count += 1

        return Response({
            "detail": f"Invoices generated for {created_count} students.",
            "total_amount": total_amount,
            "students_count": students.count(),
        })


class PaymentViewSet(ModelViewSet):
    queryset = Payment.objects.select_related(
        "invoice__student__user", "received_by"
    ).all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFinance]
    filterset_fields = ["invoice", "payment_method", "confirmed"]
    search_fields = ["transaction_reference", "invoice__student__admission_number"]
    ordering_fields = ["payment_date"]

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user, confirmed=True)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated, IsStudent])
    def my_payments(self, request):
        """
        GET /api/fees/payments/my_payments/
        Student portal: own payment history.
        """
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=404)

        payments = Payment.objects.filter(
            invoice__student=student
        ).select_related("invoice__term__academic_year").order_by("-payment_date")
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)


# =============================================================================
# 8. MPESA VIEWS
# =============================================================================

class MpesaSTKPushView(APIView):
    """
    POST /api/fees/mpesa/stkpush/
    Initiate MPESA STK Push for a student payment.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MpesaSTKPushSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]
        amount = serializer.validated_data["amount"]
        admission_number = serializer.validated_data["admission_number"]
        invoice_id = serializer.validated_data["invoice_id"]

        # Verify invoice exists and belongs to the student
        try:
            invoice = Invoice.objects.get(pk=invoice_id)
        except Invoice.DoesNotExist:
            return Response({"detail": "Invoice not found."}, status=404)

        if invoice.balance <= 0:
            return Response({"detail": "Invoice is already fully paid."}, status=400)

        # Store a pending MPESA transaction record
        from .models import MpesaTransaction
        from rest_framework_simplejwt.tokens import UntypedToken
        import uuid

        checkout_ref = str(uuid.uuid4())

        result = initiate_stk_push(
            phone_number=phone_number,
            amount=int(amount),
            account_reference=admission_number,
            transaction_desc=f"School fees – {admission_number}",
        )

        if "error" in result:
            return Response(
                {"detail": result["error"]},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Store the pending transaction
        checkout_request_id = result.get("CheckoutRequestID", checkout_ref)
        MpesaTransaction.objects.create(
            merchant_request_id=result.get("MerchantRequestID", ""),
            checkout_request_id=checkout_request_id,
            phone_number=phone_number,
            amount=amount,
            account_reference=admission_number,
            status=MpesaTransaction.TransactionStatus.PENDING,
            raw_payload=result,
        )

        return Response({
            "detail": "STK Push sent. Please check your phone.",
            "checkout_request_id": checkout_request_id,
            "mpesa_response": result,
        })


class MpesaCallbackView(APIView):
    """
    POST /api/fees/mpesa/callback/
    Safaricom Daraja callback endpoint.  Must be publicly accessible (no auth).
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # No auth for Safaricom callback

    def post(self, request):
        payload = request.data
        logger.info("MPESA Callback received: %s", payload)
        success, message = process_mpesa_callback(payload)
        # Always return 200 to Safaricom (they retry on non-200)
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"}, status=200)


class MpesaTransactionViewSet(ModelViewSet):
    """
    /api/fees/mpesa/transactions/ – Admin view of all MPESA transactions.
    """
    queryset = MpesaTransaction.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrFinance]
    filterset_fields = ["status", "phone_number", "account_reference"]
    search_fields = ["mpesa_receipt_number", "phone_number", "account_reference"]
    http_method_names = ["get", "head", "options"]  # read-only for external transactions

    def get_serializer_class(self):
        from .serializers import MpesaCallbackSerializer
        return PaymentSerializer  # repurpose for display; extend if needed


# =============================================================================
# 9. NOTIFICATION VIEWS
# =============================================================================

class NotificationViewSet(ModelViewSet):
    queryset = Notification.objects.select_related("recipient").all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["notification_type", "event", "is_sent", "recipient"]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_notifications(self, request):
        """GET /api/notifications/my_notifications/ – Current user's notifications."""
        notifs = Notification.objects.filter(recipient=request.user).order_by("-created_at")
        serializer = NotificationSerializer(notifs, many=True)
        return Response(serializer.data)


# =============================================================================
# 10. PROMOTION VIEWS
# =============================================================================

class StudentPromotionViewSet(ModelViewSet):
    queryset = StudentPromotion.objects.select_related(
        "student__user", "from_classroom__stream__form",
        "to_classroom__stream__form", "academic_year", "promoted_by"
    ).all()
    serializer_class = StudentPromotionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["academic_year", "promotion_status", "from_classroom"]

    @action(detail=False, methods=["post"])
    def bulk_promote(self, request):
        """
        POST /api/promotions/bulk_promote/
        Promote all (or selected) students from one classroom to another.
        """
        serializer = BulkPromotionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        promotions = run_bulk_promotion(
            from_classroom=serializer.validated_data["from_classroom"],
            to_classroom=serializer.validated_data.get("to_classroom"),
            academic_year=serializer.validated_data["academic_year"],
            promoted_by=request.user,
            student_ids=serializer.validated_data.get("student_ids"),
            promotion_status=serializer.validated_data.get(
                "promotion_status", "promoted"
            ),
            notes=serializer.validated_data.get("notes", ""),
        )

        return Response({
            "detail": f"{len(promotions)} students promoted successfully.",
            "promotions": StudentPromotionSerializer(promotions, many=True).data,
        })


# =============================================================================
# 11. DASHBOARD VIEWS
# =============================================================================

class AdminDashboardView(APIView):
    """
    GET /api/dashboard/admin/
    Aggregated stats for the admin portal home page.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        current_year = AcademicYear.objects.filter(is_current=True).first()
        current_term = Term.objects.filter(is_current=True).first()

        total_students = Student.objects.count()
        active_students = Student.objects.filter(status=Student.Status.ACTIVE).count()
        total_teachers = Teacher.objects.filter(is_active=True).count()
        total_classrooms = Classroom.objects.filter(
            academic_year=current_year
        ).count() if current_year else 0

        # Fee summary for current term
        invoices = Invoice.objects.filter(term=current_term) if current_term else Invoice.objects.none()
        total_expected = invoices.aggregate(t=Sum("total_amount"))["t"] or Decimal("0")
        total_collected = invoices.aggregate(t=Sum("amount_paid"))["t"] or Decimal("0")
        total_outstanding = total_expected - total_collected
        collection_rate = (
            round((total_collected / total_expected) * 100, 2)
            if total_expected > 0
            else Decimal("0")
        )

        # Recent payments (last 10)
        recent_payments = Payment.objects.filter(
            confirmed=True
        ).select_related("invoice__student__user").order_by("-payment_date")[:10]

        # Students per form
        students_per_form = []
        for form in Form.objects.all():
            count = Student.objects.filter(
                current_classroom__stream__form=form,
                status=Student.Status.ACTIVE,
            ).count()
            students_per_form.append({"form": form.name, "count": count})

        return Response({
            "total_students": total_students,
            "active_students": active_students,
            "total_teachers": total_teachers,
            "total_classrooms": total_classrooms,
            "current_academic_year": AcademicYearSerializer(current_year).data if current_year else None,
            "current_term": TermSerializer(current_term).data if current_term else None,
            "total_fees_expected": total_expected,
            "total_fees_collected": total_collected,
            "total_fees_outstanding": total_outstanding,
            "collection_rate": collection_rate,
            "recent_payments": PaymentSerializer(recent_payments, many=True).data,
            "students_per_form": students_per_form,
        })


class TeacherDashboardView(APIView):
    """
    GET /api/dashboard/teacher/
    Summary for the teacher portal home page.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        try:
            teacher = request.user.teacher_profile
        except Teacher.DoesNotExist:
            return Response({"detail": "Teacher profile not found."}, status=404)

        current_year = AcademicYear.objects.filter(is_current=True).first()
        allocs = teacher.allocations.filter(academic_year=current_year).select_related(
            "subject", "classroom__stream__form", "academic_year"
        )

        # Count unique students taught
        student_ids = set()
        for alloc in allocs:
            ids = Student.objects.filter(
                current_classroom=alloc.classroom,
                status=Student.Status.ACTIVE,
            ).values_list("id", flat=True)
            student_ids.update(ids)

        # Pending mark entries: exams without results for this teacher's allocations
        pending = []
        current_term = Term.objects.filter(is_current=True).first()
        if current_term:
            exams = Exam.objects.filter(term=current_term, is_published=False)
            for exam in exams:
                for alloc in allocs:
                    has_results = ExamResult.objects.filter(
                        exam=exam,
                        subject=alloc.subject,
                        student__current_classroom=alloc.classroom,
                    ).exists()
                    if not has_results:
                        pending.append({
                            "exam": exam.name,
                            "exam_id": exam.id,
                            "subject": alloc.subject.name,
                            "subject_id": alloc.subject.id,
                            "classroom": str(alloc.classroom),
                            "classroom_id": alloc.classroom.id,
                        })

        return Response({
            "teacher": TeacherSerializer(teacher).data,
            "allocations": TeacherSubjectAllocationSerializer(allocs, many=True).data,
            "total_students_taught": len(student_ids),
            "pending_mark_entries": pending,
        })


class StudentDashboardView(APIView):
    """
    GET /api/dashboard/student/
    Summary for the student portal home page.
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=404)

        current_term = Term.objects.filter(is_current=True).first()

        # Current invoice
        current_invoice = None
        if current_term:
            current_invoice = student.invoices.filter(term=current_term).first()

        fee_balance = Decimal("0")
        if current_invoice:
            fee_balance = current_invoice.balance

        # Recent results (last published exam)
        last_exam = (
            Exam.objects.filter(results__student=student, is_published=True)
            .order_by("-term__academic_year__year", "-term__term_number")
            .first()
        )
        recent_results = []
        latest_mean_grade = None
        if last_exam:
            recent_results = ExamResult.objects.filter(
                student=student, exam=last_exam
            ).select_related("subject")
            summary = compute_student_exam_summary(student, last_exam)
            if summary:
                latest_mean_grade = summary["mean_grade"]

        # Attendance this term
        attendance_data = None
        if current_term:
            att_qs = student.attendance_records.filter(
                date__gte=current_term.start_date,
                date__lte=current_term.end_date,
            )
            total = att_qs.count()
            if total > 0:
                present = att_qs.filter(status=Attendance.AttendanceStatus.PRESENT).count()
                absent = att_qs.filter(status=Attendance.AttendanceStatus.ABSENT).count()
                late = att_qs.filter(status=Attendance.AttendanceStatus.LATE).count()
                sick = att_qs.filter(status=Attendance.AttendanceStatus.SICK).count()
                attendance_data = {
                    "total_days": total,
                    "present_days": present,
                    "absent_days": absent,
                    "late_days": late,
                    "sick_days": sick,
                    "attendance_percentage": round((present / total) * 100, 2),
                }

        return Response({
            "student": StudentDetailSerializer(student, context={"request": request}).data,
            "current_invoice": InvoiceSerializer(current_invoice).data if current_invoice else None,
            "fee_balance": fee_balance,
            "recent_results": ExamResultSerializer(recent_results, many=True).data,
            "latest_mean_grade": latest_mean_grade,
            "latest_exam": ExamSerializer(last_exam).data if last_exam else None,
            "attendance_this_term": attendance_data,
        })


# =============================================================================
# 12. REPORT / PDF VIEWS
# =============================================================================

class ReportCardView(APIView):
    """
    GET /api/reports/reportcard/<student_id>/<exam_id>/
    Generate and return a PDF report card.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id, exam_id):
        # Permission check: student can only download own report card
        if request.user.role == "student":
            try:
                if request.user.student_profile.pk != int(student_id):
                    return Response(status=403)
            except Exception:
                return Response(status=403)

        try:
            student = Student.objects.select_related(
                "user", "current_classroom__stream__form"
            ).get(pk=student_id)
            exam = Exam.objects.select_related("term__academic_year").get(pk=exam_id)
        except (Student.DoesNotExist, Exam.DoesNotExist):
            return Response({"detail": "Student or exam not found."}, status=404)

        if not exam.is_published and request.user.role == "student":
            return Response(
                {"detail": "Results not yet published."}, status=status.HTTP_403_FORBIDDEN
            )

        results = ExamResult.objects.filter(
            student=student, exam=exam
        ).select_related("subject")
        summary = compute_student_exam_summary(student, exam)
        rankings = compute_rankings(exam)
        student_ranking = rankings.get(student.pk, {})

        # Generate PDF using ReportLab
        pdf_buffer = self._generate_pdf(student, exam, results, summary, student_ranking, request)
        response = HttpResponse(pdf_buffer, content_type="application/pdf")
        filename = (
            f"report_card_{student.admission_number}_{exam.name.replace(' ', '_')}.pdf"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    def _generate_pdf(self, student, exam, results, summary, ranking, request):
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
        )
        from django.conf import settings as django_settings

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5 * cm,
            leftMargin=1.5 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "Title", parent=styles["Heading1"],
            fontSize=16, alignment=1, textColor=colors.HexColor("#012970")
        )
        sub_style = ParagraphStyle(
            "Sub", parent=styles["Normal"],
            fontSize=10, alignment=1, textColor=colors.grey
        )
        label_style = ParagraphStyle(
            "Label", parent=styles["Normal"],
            fontSize=9, textColor=colors.HexColor("#012970"), fontName="Helvetica-Bold"
        )
        value_style = ParagraphStyle(
            "Value", parent=styles["Normal"], fontSize=9
        )

        story = []

        # School header
        story.append(Paragraph(django_settings.SCHOOL_NAME, title_style))
        story.append(Paragraph(django_settings.SCHOOL_ADDRESS, sub_style))
        story.append(Paragraph(f"Tel: {django_settings.SCHOOL_PHONE}", sub_style))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#4154f1")))
        story.append(Spacer(1, 0.3 * cm))
        story.append(Paragraph("STUDENT REPORT CARD", title_style))
        story.append(Spacer(1, 0.3 * cm))

        # Student info table
        class_name = str(student.current_classroom) if student.current_classroom else "N/A"
        info_data = [
            ["Name:", student.user.get_full_name(), "Adm No:", student.admission_number],
            ["Class:", class_name, "Gender:", student.get_gender_display()],
            ["Exam:", exam.name, "Term:", str(exam.term)],
        ]
        info_table = Table(info_data, colWidths=[3 * cm, 7 * cm, 3 * cm, 5 * cm])
        info_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#012970")),
            ("TEXTCOLOR", (2, 0), (2, -1), colors.HexColor("#012970")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.4 * cm))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
        story.append(Spacer(1, 0.3 * cm))

        # Results table
        header = [["#", "Subject", "Marks", "Grade", "Points", "Remarks"]]
        rows = []
        for i, result in enumerate(results, 1):
            rows.append([
                str(i),
                result.subject.name,
                str(result.marks),
                result.grade or "-",
                str(result.points) if result.points is not None else "-",
                result.remarks or "-",
            ])

        results_table = Table(
            header + rows,
            colWidths=[1 * cm, 6 * cm, 2.5 * cm, 2 * cm, 2 * cm, 4.5 * cm],
        )
        results_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4154f1")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (2, 0), (-1, -1), "CENTER"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f6f9ff")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(results_table)
        story.append(Spacer(1, 0.5 * cm))

        # Summary
        if summary:
            summary_data = [
                ["Total Marks:", str(summary["total_marks"]),
                 "Mean Score:", str(summary["mean_score"])],
                ["Mean Grade:", summary["mean_grade"],
                 "Mean Points:", str(summary["mean_points"])],
                ["Stream Position:", f"{ranking.get('stream_position', '-')}/{ranking.get('stream_total', '-')}",
                 "Form Position:", f"{ranking.get('form_position', '-')}/{ranking.get('form_total', '-')}"],
            ]
            summary_table = Table(summary_data, colWidths=[4 * cm, 4.5 * cm, 4 * cm, 5.5 * cm])
            summary_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f6f9ff")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#012970")),
                ("TEXTCOLOR", (2, 0), (2, -1), colors.HexColor("#012970")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
            ]))
            story.append(summary_table)

        story.append(Spacer(1, 1 * cm))

        # Signatures
        sig_data = [
            ["Class Teacher's Signature:", "_____________________",
             "Principal's Signature:", "_____________________"],
        ]
        sig_table = Table(sig_data, colWidths=[5 * cm, 5 * cm, 5 * cm, 3 * cm])
        sig_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        story.append(sig_table)
        story.append(Spacer(1, 0.5 * cm))
        story.append(
            Paragraph(
                f"Generated on {timezone.now().strftime('%d %B %Y at %H:%M')} – {django_settings.SCHOOL_NAME}",
                sub_style,
            )
        )

        doc.build(story)
        buffer.seek(0)
        return buffer.read()


class StreamReportView(APIView):
    """
    GET /api/reports/stream/<classroom_id>/<exam_id>/
    Tabulated results for all students in a classroom.
    """
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, classroom_id, exam_id):
        try:
            classroom = Classroom.objects.get(pk=classroom_id)
            exam = Exam.objects.get(pk=exam_id)
        except (Classroom.DoesNotExist, Exam.DoesNotExist):
            return Response({"detail": "Classroom or exam not found."}, status=404)

        students = Student.objects.filter(
            current_classroom=classroom, status=Student.Status.ACTIVE
        ).select_related("user")

        rankings = compute_rankings(exam)
        report_data = []

        for student in students:
            results = ExamResult.objects.filter(
                student=student, exam=exam
            ).select_related("subject")
            summary = compute_student_exam_summary(student, exam)
            student_ranking = rankings.get(student.pk, {})

            report_data.append({
                "student": StudentListSerializer(student).data,
                "results": ExamResultSerializer(results, many=True).data,
                "summary": summary if summary else {},
                "ranking": student_ranking,
            })

        # Sort by stream position
        report_data.sort(
            key=lambda x: x["ranking"].get("stream_position", 9999)
        )

        return Response({
            "classroom": ClassroomSerializer(classroom).data,
            "exam": ExamSerializer(exam).data,
            "students": report_data,
        })
        