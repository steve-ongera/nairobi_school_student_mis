"""
core/serializers.py – All Django REST Framework serializers.

Grouped by domain:
  1. Auth / User
  2. Academic Structure
  3. Teachers
  4. Students
  5. Exams & Results
  6. Attendance
  7. Fees / Finance
  8. Notifications
  9. Promotions
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.db.models import Sum, Avg
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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

User = get_user_model()


# =============================================================================
# 1. AUTH / USER
# =============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that adds user role, full name, and email
    to the token response payload so the frontend can redirect
    to the correct portal immediately after login.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.get_full_name()
        token["email"] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data["role"] = user.role
        data["full_name"] = user.get_full_name()
        data["email"] = user.email
        data["user_id"] = user.id
        data["profile_picture"] = (
            self.context["request"].build_absolute_uri(user.profile_picture.url)
            if user.profile_picture
            else None
        )
        return data


class UserSerializer(serializers.ModelSerializer):
    """Read serializer for the User model."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name",
            "role", "phone", "profile_picture", "is_active", "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new user account (admin-facing)."""

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email", "first_name", "last_name", "role", "phone",
            "password", "password_confirm",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})
        return attrs

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# =============================================================================
# 2. ACADEMIC STRUCTURE
# =============================================================================

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"


class TermSerializer(serializers.ModelSerializer):
    academic_year_display = serializers.StringRelatedField(source="academic_year", read_only=True)

    class Meta:
        model = Term
        fields = "__all__"


class FormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = "__all__"


class StreamSerializer(serializers.ModelSerializer):
    form_name = serializers.StringRelatedField(source="form", read_only=True)

    class Meta:
        model = Stream
        fields = "__all__"


class ClassroomSerializer(serializers.ModelSerializer):
    stream_display = serializers.StringRelatedField(source="stream", read_only=True)
    form_level = serializers.IntegerField(source="stream.form.level", read_only=True)
    form_name = serializers.CharField(source="stream.form.name", read_only=True)
    stream_name = serializers.CharField(source="stream.name", read_only=True)
    academic_year_display = serializers.StringRelatedField(source="academic_year", read_only=True)
    student_count = serializers.SerializerMethodField()
    class_teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Classroom
        fields = "__all__"

    def get_student_count(self, obj):
        return obj.current_students.count()

    def get_class_teacher_name(self, obj):
        if obj.class_teacher:
            return obj.class_teacher.user.get_full_name()
        return None


class SubjectSerializer(serializers.ModelSerializer):
    applicable_forms = FormSerializer(many=True, read_only=True)
    applicable_form_ids = serializers.PrimaryKeyRelatedField(
        queryset=Form.objects.all(), many=True, write_only=True,
        source="applicable_forms", required=False,
    )

    class Meta:
        model = Subject
        fields = "__all__"


# =============================================================================
# 3. TEACHERS
# =============================================================================

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    allocation_count = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = "__all__"

    def get_allocation_count(self, obj):
        return obj.allocations.count()


class TeacherCreateSerializer(serializers.ModelSerializer):
    """Creates a Teacher + its linked User in a single request."""

    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, default="school@2024")

    class Meta:
        model = Teacher
        fields = [
            "email", "first_name", "last_name", "phone", "password",
            "staff_number", "tsc_number", "department", "qualification",
            "date_joined_school",
        ]

    def create(self, validated_data):
        with transaction.atomic():
            user_data = {
                "email": validated_data.pop("email"),
                "first_name": validated_data.pop("first_name"),
                "last_name": validated_data.pop("last_name"),
                "phone": validated_data.pop("phone", ""),
                "role": User.Role.TEACHER,
            }
            password = validated_data.pop("password", "school@2024")
            user = User.objects.create_user(password=password, **user_data)
            teacher = Teacher.objects.create(user=user, **validated_data)
            return teacher


class TeacherSubjectAllocationSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.user.get_full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    classroom_display = serializers.StringRelatedField(source="classroom", read_only=True)
    academic_year_display = serializers.StringRelatedField(source="academic_year", read_only=True)

    class Meta:
        model = TeacherSubjectAllocation
        fields = "__all__"


# =============================================================================
# 4. STUDENTS
# =============================================================================

class ParentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = Parent
        fields = "__all__"


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for student list views (tables)."""

    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    current_classroom_display = serializers.StringRelatedField(
        source="current_classroom", read_only=True
    )
    form_level = serializers.IntegerField(
        source="current_classroom.stream.form.level", read_only=True
    )

    class Meta:
        model = Student
        fields = [
            "id", "admission_number", "full_name", "email", "gender",
            "current_classroom_display", "form_level", "boarding_status",
            "status", "admission_date",
        ]


class StudentDetailSerializer(serializers.ModelSerializer):
    """Full serializer for student detail/profile views."""

    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    current_classroom = ClassroomSerializer(read_only=True)
    parent = ParentSerializer(read_only=True)
    fee_balance = serializers.SerializerMethodField()
    latest_mean_grade = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = "__all__"

    def get_fee_balance(self, obj):
        """Sum of all unpaid/partial invoice balances."""
        invoices = obj.invoices.exclude(status="paid")
        balance = sum(inv.balance for inv in invoices)
        return float(balance)

    def get_latest_mean_grade(self, obj):
        """Mean grade from the most recent published exam."""
        last_exam = (
            Exam.objects.filter(
                results__student=obj,
                is_published=True,
            )
            .order_by("-term__academic_year__year", "-term__term_number")
            .first()
        )
        if not last_exam:
            return None
        results = ExamResult.objects.filter(student=obj, exam=last_exam)
        avg_points = results.aggregate(avg=Avg("points"))["avg"]
        if avg_points is None:
            return None
        # Map mean points to grade letter
        scale = (
            GradingScale.objects.filter(points__lte=round(avg_points))
            .order_by("-points")
            .first()
        )
        return scale.grade if scale else None


class StudentCreateSerializer(serializers.ModelSerializer):
    """
    Creates a Student + linked User account in one atomic transaction.
    The student's email is their login credential.
    """

    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(
        write_only=True,
        required=False,
        help_text="Defaults to admission_number if not provided.",
    )

    class Meta:
        model = Student
        fields = [
            "email", "first_name", "last_name", "phone", "password",
            "admission_number", "date_of_birth", "gender",
            "nationality", "national_id", "birth_certificate_number",
            "kcpe_index_number", "kcpe_marks", "admission_date",
            "admitted_to_form", "current_classroom", "boarding_status",
            "dormitory", "bed_number", "blood_group", "medical_conditions",
            "medical_insurance", "parent",
        ]

    def create(self, validated_data):
        with transaction.atomic():
            admission_number = validated_data.get("admission_number")
            user_data = {
                "email": validated_data.pop("email"),
                "first_name": validated_data.pop("first_name"),
                "last_name": validated_data.pop("last_name"),
                "phone": validated_data.pop("phone", ""),
                "role": User.Role.STUDENT,
            }
            password = validated_data.pop("password", admission_number)
            user = User.objects.create_user(password=password, **user_data)
            student = Student.objects.create(user=user, **validated_data)
            return student


class StudentClassHistorySerializer(serializers.ModelSerializer):
    classroom_display = serializers.StringRelatedField(source="classroom", read_only=True)
    academic_year_display = serializers.StringRelatedField(source="academic_year", read_only=True)
    term_display = serializers.StringRelatedField(source="term", read_only=True)

    class Meta:
        model = StudentClassHistory
        fields = "__all__"


# =============================================================================
# 5. EXAMS & RESULTS
# =============================================================================

class GradingScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingScale
        fields = "__all__"


class ExamSerializer(serializers.ModelSerializer):
    term_display = serializers.StringRelatedField(source="term", read_only=True)
    applicable_forms = FormSerializer(many=True, read_only=True)
    applicable_form_ids = serializers.PrimaryKeyRelatedField(
        queryset=Form.objects.all(), many=True, write_only=True,
        source="applicable_forms", required=False,
    )
    result_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = "__all__"

    def get_result_count(self, obj):
        return obj.results.count()


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.get_full_name", read_only=True)
    admission_number = serializers.CharField(source="student.admission_number", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_code = serializers.CharField(source="subject.code", read_only=True)
    exam_name = serializers.CharField(source="exam.name", read_only=True)

    class Meta:
        model = ExamResult
        fields = "__all__"
        read_only_fields = ["grade", "points", "entered_by", "entered_at"]


class BulkMarksSerializer(serializers.Serializer):
    """
    Used for bulk marks submission by a teacher.
    Accepts a list of {student_id, marks, remarks} objects.
    """

    exam = serializers.PrimaryKeyRelatedField(queryset=Exam.objects.all())
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    classroom = serializers.PrimaryKeyRelatedField(queryset=Classroom.objects.all())
    results = serializers.ListField(
        child=serializers.DictField(), allow_empty=False
    )

    def validate_results(self, value):
        for item in value:
            if "student" not in item or "marks" not in item:
                raise serializers.ValidationError(
                    "Each result must have 'student' (id) and 'marks'."
                )
            try:
                marks = float(item["marks"])
                if marks < 0 or marks > 100:
                    raise serializers.ValidationError(
                        f"Marks must be between 0 and 100. Got {marks}."
                    )
            except (ValueError, TypeError):
                raise serializers.ValidationError("Marks must be a number.")
        return value


class StudentReportSerializer(serializers.Serializer):
    """
    Aggregated report card data for a student in a specific exam.
    Computed, not stored.
    """

    student = StudentListSerializer()
    exam = ExamSerializer()
    results = ExamResultSerializer(many=True)
    total_marks = serializers.DecimalField(max_digits=8, decimal_places=2)
    mean_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    mean_points = serializers.DecimalField(max_digits=5, decimal_places=2)
    mean_grade = serializers.CharField()
    stream_position = serializers.IntegerField()
    form_position = serializers.IntegerField()
    overall_position = serializers.IntegerField()
    class_teacher_comment = serializers.CharField()
    principal_comment = serializers.CharField()


# =============================================================================
# 6. ATTENDANCE
# =============================================================================

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.get_full_name", read_only=True)
    admission_number = serializers.CharField(source="student.admission_number", read_only=True)
    classroom_display = serializers.StringRelatedField(source="classroom", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.get_full_name", read_only=True)

    class Meta:
        model = Attendance
        fields = "__all__"
        read_only_fields = ["recorded_by", "recorded_at"]


class BulkAttendanceSerializer(serializers.Serializer):
    """For submitting a full class attendance in one request."""

    classroom = serializers.PrimaryKeyRelatedField(queryset=Classroom.objects.all())
    date = serializers.DateField()
    records = serializers.ListField(
        child=serializers.DictField(), allow_empty=False
    )

    def validate_records(self, value):
        valid_statuses = [s[0] for s in Attendance.AttendanceStatus.choices]
        for record in value:
            if "student" not in record or "status" not in record:
                raise serializers.ValidationError(
                    "Each record must have 'student' (id) and 'status'."
                )
            if record["status"] not in valid_statuses:
                raise serializers.ValidationError(
                    f"Invalid status '{record['status']}'. "
                    f"Valid choices: {valid_statuses}"
                )
        return value


class AttendanceSummarySerializer(serializers.Serializer):
    """Attendance summary for a student over a period."""

    student = StudentListSerializer()
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    sick_days = serializers.IntegerField()
    attendance_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


# =============================================================================
# 7. FEES / FINANCE
# =============================================================================

class FeeStructureSerializer(serializers.ModelSerializer):
    form_name = serializers.CharField(source="form.name", read_only=True)
    term_display = serializers.StringRelatedField(source="term", read_only=True)

    class Meta:
        model = FeeStructure
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.CharField(
        source="received_by.get_full_name", read_only=True
    )
    # Add these two lines ↓
    student_name = serializers.CharField(
        source="invoice.student.user.get_full_name", read_only=True
    )
    invoice_display = serializers.CharField(
        source="invoice.__str__", read_only=True
    )

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["received_by", "created_at", "confirmed"]

class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.get_full_name", read_only=True)
    admission_number = serializers.CharField(source="student.admission_number", read_only=True)
    term_display = serializers.StringRelatedField(source="term", read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ["amount_paid", "status"]


class MpesaSTKPushSerializer(serializers.Serializer):
    """Input serializer for initiating an MPESA STK Push."""

    phone_number = serializers.CharField(max_length=15)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    admission_number = serializers.CharField(max_length=20)
    invoice_id = serializers.IntegerField()

    def validate_phone_number(self, value):
        """Normalize to 254XXXXXXXXX format."""
        value = value.strip().replace(" ", "").replace("-", "")
        if value.startswith("0"):
            value = "254" + value[1:]
        elif value.startswith("+"):
            value = value[1:]
        if not value.startswith("254") or len(value) != 12:
            raise serializers.ValidationError(
                "Invalid Kenyan phone number. Use format: 0712345678 or 254712345678."
            )
        return value

    def validate_amount(self, value):
        if value < 1:
            raise serializers.ValidationError("Amount must be at least KES 1.")
        return value


class MpesaCallbackSerializer(serializers.Serializer):
    """Deserializes Safaricom Daraja STK Push callback payload."""

    Body = serializers.DictField()


class FeeStatementSerializer(serializers.Serializer):
    """Complete fee statement for a student (all terms)."""

    student = StudentListSerializer()
    invoices = InvoiceSerializer(many=True)
    total_charged = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_balance = serializers.DecimalField(max_digits=10, decimal_places=2)


# =============================================================================
# 8. NOTIFICATIONS
# =============================================================================

class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source="recipient.get_full_name", read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["is_sent", "sent_at", "error_message", "created_at"]


# =============================================================================
# 9. PROMOTIONS
# =============================================================================

class StudentPromotionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.get_full_name", read_only=True)
    admission_number = serializers.CharField(source="student.admission_number", read_only=True)
    from_classroom_display = serializers.StringRelatedField(source="from_classroom", read_only=True)
    to_classroom_display = serializers.StringRelatedField(source="to_classroom", read_only=True)
    promoted_by_name = serializers.CharField(source="promoted_by.get_full_name", read_only=True)

    class Meta:
        model = StudentPromotion
        fields = "__all__"
        read_only_fields = ["promoted_by", "promotion_date"]


class BulkPromotionSerializer(serializers.Serializer):
    """
    Input for the bulk promotion endpoint.
    Allows admin to promote an entire classroom to the next form's stream.
    """

    from_classroom = serializers.PrimaryKeyRelatedField(queryset=Classroom.objects.all())
    to_classroom = serializers.PrimaryKeyRelatedField(
        queryset=Classroom.objects.all(), required=False, allow_null=True
    )
    academic_year = serializers.PrimaryKeyRelatedField(queryset=AcademicYear.objects.all())
    promotion_status = serializers.ChoiceField(
        choices=StudentPromotion.PromotionStatus.choices,
        default=StudentPromotion.PromotionStatus.PROMOTED,
    )
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="If omitted, all active students in from_classroom are promoted.",
    )
    notes = serializers.CharField(required=False, allow_blank=True)


# =============================================================================
# DASHBOARD SUMMARY SERIALIZERS
# =============================================================================

class AdminDashboardSerializer(serializers.Serializer):
    total_students = serializers.IntegerField()
    active_students = serializers.IntegerField()
    total_teachers = serializers.IntegerField()
    total_classrooms = serializers.IntegerField()
    current_academic_year = AcademicYearSerializer()
    current_term = TermSerializer()
    total_fees_expected = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_fees_collected = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_fees_outstanding = serializers.DecimalField(max_digits=12, decimal_places=2)
    collection_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    recent_payments = PaymentSerializer(many=True)
    students_per_form = serializers.ListField(child=serializers.DictField())


class TeacherDashboardSerializer(serializers.Serializer):
    teacher = TeacherSerializer()
    allocations = TeacherSubjectAllocationSerializer(many=True)
    total_students_taught = serializers.IntegerField()
    pending_mark_entries = serializers.ListField(child=serializers.DictField())


class StudentDashboardSerializer(serializers.Serializer):
    student = StudentDetailSerializer()
    current_invoice = InvoiceSerializer(allow_null=True)
    fee_balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    recent_results = ExamResultSerializer(many=True)
    latest_mean_grade = serializers.CharField(allow_null=True)
    latest_exam = ExamSerializer(allow_null=True)
    attendance_this_term = AttendanceSummarySerializer(allow_null=True)