"""
core/models.py – All database models for the Kenyan High School MIS.

Design principles:
  • Custom User model with email as the login identifier.
  • Academic structure: Form → Stream → Classroom (Form + Stream + AcademicYear).
  • Student class history is NEVER overwritten; full audit trail is preserved.
  • Fee payments are reconciled against MPESA callbacks automatically.
  • Grading scale is customisable per school.
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.conf import settings


# =============================================================================
# USER / AUTH
# =============================================================================

class UserManager(BaseUserManager):
    """Manager for the custom User model that uses email as the username."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email address is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Central user account.  Every portal (student, teacher, admin, finance,
    parent) shares this model and is distinguished by the `role` field.
    Login is always done with email + password.
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        TEACHER = "teacher", "Teacher"
        STUDENT = "student", "Student"
        PARENT = "parent", "Parent"
        FINANCE = "finance", "Finance Officer"

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    phone = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/", null=True, blank=True
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT

    @property
    def is_finance(self):
        return self.role == self.Role.FINANCE

    @property
    def is_parent(self):
        return self.role == self.Role.PARENT


# =============================================================================
# ACADEMIC STRUCTURE
# =============================================================================

class AcademicYear(models.Model):
    """Represents a calendar/academic year, e.g. 2026."""

    year = models.PositiveIntegerField(unique=True)
    is_current = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-year"]

    def __str__(self):
        return str(self.year)

    def save(self, *args, **kwargs):
        # Ensure only one current academic year at a time
        if self.is_current:
            AcademicYear.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class Term(models.Model):
    """Academic term within an academic year (Term 1, 2, or 3)."""

    class TermNumber(models.IntegerChoices):
        TERM_1 = 1, "Term 1"
        TERM_2 = 2, "Term 2"
        TERM_3 = 3, "Term 3"

    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="terms"
    )
    term_number = models.IntegerField(choices=TermNumber.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = ("academic_year", "term_number")
        ordering = ["academic_year", "term_number"]

    def __str__(self):
        return f"{self.academic_year} – Term {self.term_number}"

    def save(self, *args, **kwargs):
        if self.is_current:
            Term.objects.exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)


class Form(models.Model):
    """
    Represents a form level: Form 1, Form 2, Form 3, Form 4.
    Equivalent to a grade/year group.
    """

    class FormLevel(models.IntegerChoices):
        FORM_1 = 1, "Form 1"
        FORM_2 = 2, "Form 2"
        FORM_3 = 3, "Form 3"
        FORM_4 = 4, "Form 4"

    level = models.IntegerField(choices=FormLevel.choices, unique=True)
    name = models.CharField(max_length=20)  # e.g. "Form 1"

    class Meta:
        ordering = ["level"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.name = f"Form {self.level}"
        super().save(*args, **kwargs)


class Stream(models.Model):
    """
    A stream within a form, e.g. Form 1 East, Form 2 West.
    The stream name (East, West, North, A, B, etc.) is school-specific.
    """

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name="streams")
    name = models.CharField(max_length=50)  # e.g. "East", "West", "North"

    class Meta:
        unique_together = ("form", "name")
        ordering = ["form", "name"]

    def __str__(self):
        return f"{self.form} {self.name}"


class Classroom(models.Model):
    """
    The intersection of Form + Stream + AcademicYear.
    This is the actual class a student belongs to in a given year.
    e.g. "Form 2 East 2026"
    """

    stream = models.ForeignKey(Stream, on_delete=models.CASCADE, related_name="classrooms")
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="classrooms"
    )
    class_teacher = models.ForeignKey(
        "Teacher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="class_teacher_of",
    )
    capacity = models.PositiveIntegerField(default=45)

    class Meta:
        unique_together = ("stream", "academic_year")
        ordering = ["academic_year", "stream__form__level", "stream__name"]

    def __str__(self):
        return f"{self.stream} – {self.academic_year}"

    @property
    def form(self):
        return self.stream.form

    @property
    def student_count(self):
        return self.current_students.count()


class Subject(models.Model):
    """A school subject, e.g. Mathematics, English, Chemistry."""

    class SubjectType(models.TextChoices):
        COMPULSORY = "compulsory", "Compulsory"
        OPTIONAL = "optional", "Optional"

    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)  # e.g. MATH, ENG
    subject_type = models.CharField(
        max_length=20, choices=SubjectType.choices, default=SubjectType.COMPULSORY
    )
    applicable_forms = models.ManyToManyField(
        Form,
        blank=True,
        help_text="Which form levels teach this subject.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


# =============================================================================
# STAFF / TEACHERS
# =============================================================================

class Teacher(models.Model):
    """Teacher profile linked to a User account."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="teacher_profile"
    )
    staff_number = models.CharField(max_length=20, unique=True)
    tsc_number = models.CharField(
        max_length=30, blank=True, help_text="Teachers Service Commission number"
    )
    department = models.CharField(max_length=100, blank=True)
    qualification = models.CharField(max_length=200, blank=True)
    date_joined_school = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["user__last_name", "user__first_name"]

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.staff_number})"


class TeacherSubjectAllocation(models.Model):
    """
    Maps a teacher to a subject within a specific classroom for a given year.
    This drives teacher portal permissions: a teacher can ONLY enter marks
    for subjects/classrooms explicitly allocated here.
    """

    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE, related_name="allocations"
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="allocations"
    )
    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name="allocations"
    )
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="allocations"
    )

    class Meta:
        unique_together = ("teacher", "subject", "classroom", "academic_year")
        ordering = ["classroom", "subject"]

    def __str__(self):
        return (
            f"{self.teacher.user.get_full_name()} → "
            f"{self.subject.name} → {self.classroom}"
        )


# =============================================================================
# STUDENTS
# =============================================================================

class Parent(models.Model):
    """Parent/guardian profile."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="parent_profile"
    )
    id_number = models.CharField(max_length=20, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    relationship = models.CharField(
        max_length=50, default="Parent",
        help_text="e.g. Father, Mother, Guardian"
    )

    class Meta:
        ordering = ["user__last_name"]

    def __str__(self):
        return self.user.get_full_name()


class Student(models.Model):
    """
    Core student profile.  `current_classroom` reflects the student's CURRENT
    class.  Full history is stored in StudentClassHistory.
    """

    class Gender(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "O", "Other"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        TRANSFERRED = "transferred", "Transferred"
        COMPLETED = "completed", "Completed (Alumni)"
        WITHDRAWN = "withdrawn", "Withdrawn"
        SUSPENDED = "suspended", "Suspended"

    class BoardingStatus(models.TextChoices):
        DAY = "day", "Day Scholar"
        BOARDER = "boarder", "Boarder"

    # --- Identifiers ---
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    admission_number = models.CharField(max_length=20, unique=True)

    # --- Personal Details ---
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=Gender.choices)
    nationality = models.CharField(max_length=50, default="Kenyan")
    national_id = models.CharField(
        max_length=20, blank=True, help_text="Leave blank for minors"
    )
    birth_certificate_number = models.CharField(max_length=30, blank=True)

    # --- Academic Entry ---
    kcpe_index_number = models.CharField(max_length=20, blank=True)
    kcpe_marks = models.PositiveIntegerField(
        null=True, blank=True,
        validators=[MaxValueValidator(500)],
        help_text="KCPE total marks (out of 500)"
    )
    admission_date = models.DateField()
    admitted_to_form = models.ForeignKey(
        Form, on_delete=models.SET_NULL, null=True, related_name="admitted_students"
    )

    # --- Current Class (updated on each promotion) ---
    current_classroom = models.ForeignKey(
        Classroom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="current_students",
    )

    # --- Family ---
    parent = models.ForeignKey(
        Parent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)

    # --- Boarding ---
    boarding_status = models.CharField(
        max_length=10, choices=BoardingStatus.choices, default=BoardingStatus.DAY
    )
    dormitory = models.CharField(max_length=100, blank=True)
    bed_number = models.CharField(max_length=10, blank=True)

    # --- Medical ---
    blood_group = models.CharField(max_length=5, blank=True)
    medical_conditions = models.TextField(blank=True)
    medical_insurance = models.CharField(max_length=100, blank=True)

    # --- Status ---
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )

    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["admission_number"]

    def __str__(self):
        return f"{self.admission_number} – {self.user.get_full_name()}"

    @property
    def full_name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email

    @property
    def current_form(self):
        if self.current_classroom:
            return self.current_classroom.stream.form
        return None


class StudentClassHistory(models.Model):
    """
    Immutable record of which classroom a student was in per academic year/term.
    NEVER modify existing records; only append new ones.
    Used for: transcript generation, alumni tracking, audit trails.
    """

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="class_history"
    )
    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name="student_history"
    )
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="student_history"
    )
    term = models.ForeignKey(
        Term,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="student_history",
    )
    date_enrolled = models.DateField(default=timezone.now)
    date_left = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-academic_year__year", "-term__term_number"]

    def __str__(self):
        return f"{self.student.admission_number} in {self.classroom} ({self.academic_year})"


# =============================================================================
# EXAMS & RESULTS
# =============================================================================

class GradingScale(models.Model):
    """
    Customisable grading scale.  Default follows KNEC (Kenya National Examinations
    Council) A–E scale with 12–1 points.
    """

    min_marks = models.DecimalField(max_digits=5, decimal_places=2)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=3)   # e.g. A, A-, B+, B, B-, ...
    points = models.PositiveIntegerField()   # 12 → 1
    remarks = models.CharField(max_length=50, blank=True)  # e.g. Excellent

    class Meta:
        ordering = ["-min_marks"]

    def __str__(self):
        return f"{self.grade} ({self.min_marks}–{self.max_marks}) – {self.points} pts"


class Exam(models.Model):
    """
    An examination event, e.g. "Term 1 Mid-Term 2026" or "Mock Exam 2026".
    """

    class ExamType(models.TextChoices):
        OPENER = "opener", "Opener Exam"
        CAT = "cat", "CAT"
        MIDTERM = "midterm", "Mid-Term Exam"
        ENDTERM = "endterm", "End-Term Exam"
        MOCK = "mock", "Mock Exam"
        JOINT = "joint", "Joint Exam"
        KCSE = "kcse", "KCSE"

    name = models.CharField(max_length=150)
    exam_type = models.CharField(max_length=20, choices=ExamType.choices)
    term = models.ForeignKey(
        Term, on_delete=models.CASCADE, related_name="exams"
    )
    applicable_forms = models.ManyToManyField(
        Form, related_name="exams", blank=True
    )
    out_of = models.PositiveIntegerField(
        default=100, help_text="Maximum possible marks"
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_published = models.BooleanField(
        default=False,
        help_text="When True, students can see their results.",
    )
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="exams_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-term__academic_year__year", "-term__term_number", "name"]

    def __str__(self):
        return f"{self.name} – {self.term}"


class ExamResult(models.Model):
    """
    A single student's result for one subject in one exam.
    Grade and points are computed automatically from GradingScale on save.
    """

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="results"
    )
    exam = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name="results"
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="results"
    )
    marks = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    grade = models.CharField(max_length=3, blank=True)
    points = models.PositiveIntegerField(null=True, blank=True)
    # Teacher who entered the marks
    entered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="results_entered",
    )
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    remarks = models.CharField(max_length=200, blank=True)

    class Meta:
        unique_together = ("student", "exam", "subject")
        ordering = ["exam", "student", "subject"]

    def __str__(self):
        return (
            f"{self.student.admission_number} | {self.subject.code} | "
            f"{self.exam.name} → {self.marks} ({self.grade})"
        )

    def save(self, *args, **kwargs):
        """Auto-compute grade and points from GradingScale."""
        scale = (
            GradingScale.objects.filter(
                min_marks__lte=self.marks,
                max_marks__gte=self.marks,
            )
            .order_by("-min_marks")
            .first()
        )
        if scale:
            self.grade = scale.grade
            self.points = scale.points
        super().save(*args, **kwargs)


# =============================================================================
# ATTENDANCE
# =============================================================================

class Attendance(models.Model):
    """Daily attendance record for a student."""

    class AttendanceStatus(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        LATE = "late", "Late"
        SICK = "sick", "Sick (Excused)"
        SUSPENDED = "suspended", "Suspended"
        LEAVE = "leave", "On Leave"

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="attendance_records"
    )
    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name="attendance_records"
    )
    date = models.DateField()
    status = models.CharField(
        max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT
    )
    remarks = models.CharField(max_length=200, blank=True)
    recorded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="attendance_recorded"
    )
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "date")
        ordering = ["-date"]

    def __str__(self):
        return (
            f"{self.student.admission_number} – {self.date} – {self.status}"
        )


# =============================================================================
# FEES / FINANCE
# =============================================================================

class FeeStructure(models.Model):
    """
    Defines the fee items and amounts for a given form and academic year.
    e.g. Form 1 Tuition Fee 2026 = KES 15,000.
    """

    class FeeCategory(models.TextChoices):
        TUITION = "tuition", "Tuition Fee"
        BOARDING = "boarding", "Boarding Fee"
        ACTIVITY = "activity", "Activity Fee"
        LUNCH = "lunch", "Lunch / Meals"
        TRANSPORT = "transport", "Transport Fee"
        UNIFORM = "uniform", "Uniform"
        BOOKS = "books", "Books / Stationery"
        EXAM = "exam", "Exam Fee"
        OTHER = "other", "Other"

    name = models.CharField(max_length=100)
    category = models.CharField(
        max_length=20, choices=FeeCategory.choices, default=FeeCategory.TUITION
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    form = models.ForeignKey(
        Form, on_delete=models.CASCADE, related_name="fee_structures"
    )
    term = models.ForeignKey(
        Term, on_delete=models.CASCADE, related_name="fee_structures"
    )
    is_mandatory = models.BooleanField(default=True)

    class Meta:
        ordering = ["form", "term", "category"]

    def __str__(self):
        return f"{self.name} – {self.form} – {self.term} – KES {self.amount:,.2f}"


class Invoice(models.Model):
    """
    A student's fee invoice for a particular term.
    The total is the sum of all applicable FeeStructure items.
    """

    class InvoiceStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PARTIAL = "partial", "Partially Paid"
        PAID = "paid", "Fully Paid"
        OVERPAID = "overpaid", "Overpaid"
        WAIVED = "waived", "Waived"

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="invoices"
    )
    term = models.ForeignKey(
        Term, on_delete=models.CASCADE, related_name="invoices"
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.UNPAID
    )
    issued_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ("student", "term")
        ordering = ["-term__academic_year__year", "-term__term_number"]

    def __str__(self):
        return (
            f"Invoice – {self.student.admission_number} – {self.term} – "
            f"KES {self.total_amount:,.2f}"
        )

    @property
    def balance(self):
        return self.total_amount - self.amount_paid

    def update_status(self):
        if self.amount_paid == 0:
            self.status = self.InvoiceStatus.UNPAID
        elif self.amount_paid < self.total_amount:
            self.status = self.InvoiceStatus.PARTIAL
        elif self.amount_paid == self.total_amount:
            self.status = self.InvoiceStatus.PAID
        else:
            self.status = self.InvoiceStatus.OVERPAID
        self.save(update_fields=["status"])


class Payment(models.Model):
    """A single payment made against an invoice."""

    class PaymentMethod(models.TextChoices):
        MPESA = "mpesa", "M-PESA"
        BANK = "bank", "Bank Transfer"
        CASH = "cash", "Cash"
        CHEQUE = "cheque", "Cheque"
        OTHER = "other", "Other"

    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.MPESA
    )
    transaction_reference = models.CharField(
        max_length=50,
        blank=True,
        help_text="MPESA receipt no., cheque no., bank ref., etc.",
    )
    payment_date = models.DateTimeField(default=timezone.now)
    phone_number = models.CharField(
        max_length=15, blank=True, help_text="Phone used for MPESA payment"
    )
    confirmed = models.BooleanField(
        default=False,
        help_text="True once reconciled against MPESA callback or bank statement.",
    )
    received_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments_received"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payment_date"]

    def __str__(self):
        return (
            f"Payment KES {self.amount:,.2f} for {self.invoice} "
            f"via {self.payment_method.upper()}"
        )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate invoice amount_paid and status
        invoice = self.invoice
        confirmed_total = invoice.payments.filter(confirmed=True).aggregate(
            total=models.Sum("amount")
        )["total"] or 0
        invoice.amount_paid = confirmed_total
        invoice.save(update_fields=["amount_paid"])
        invoice.update_status()


class MpesaTransaction(models.Model):
    """
    Raw MPESA callback payload stored for reconciliation and audit.
    The `payment` FK is set once the transaction is matched to an invoice.
    """

    class TransactionStatus(models.TextChoices):
        PENDING = "pending", "Pending Reconciliation"
        MATCHED = "matched", "Matched to Invoice"
        UNMATCHED = "unmatched", "Unmatched"
        FAILED = "failed", "Failed"

    # Safaricom fields
    merchant_request_id = models.CharField(max_length=100, blank=True)
    checkout_request_id = models.CharField(max_length=100, blank=True, unique=True)
    mpesa_receipt_number = models.CharField(max_length=20, blank=True, unique=True, null=True)
    transaction_date = models.CharField(max_length=20, blank=True)
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account_reference = models.CharField(
        max_length=50, help_text="Admission number entered by parent"
    )
    result_code = models.IntegerField(null=True, blank=True)
    result_description = models.CharField(max_length=200, blank=True)

    # Internal tracking
    status = models.CharField(
        max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.PENDING
    )
    payment = models.OneToOneField(
        Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name="mpesa_transaction"
    )
    raw_payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"MPESA {self.mpesa_receipt_number or self.checkout_request_id} – "
            f"KES {self.amount} from {self.phone_number}"
        )


# =============================================================================
# NOTIFICATIONS
# =============================================================================

class Notification(models.Model):
    """Log of all SMS/email notifications sent by the system."""

    class NotificationType(models.TextChoices):
        SMS = "sms", "SMS"
        EMAIL = "email", "Email"

    class NotificationEvent(models.TextChoices):
        FEE_PAYMENT = "fee_payment", "Fee Payment Received"
        FEE_REMINDER = "fee_reminder", "Fee Payment Reminder"
        RESULTS_PUBLISHED = "results_published", "Results Published"
        ATTENDANCE_ALERT = "attendance_alert", "Absenteeism Alert"
        DISCIPLINE = "discipline", "Discipline Notice"
        GENERAL = "general", "General Notice"

    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(max_length=10, choices=NotificationType.choices)
    event = models.CharField(
        max_length=30, choices=NotificationEvent.choices, default=NotificationEvent.GENERAL
    )
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.notification_type.upper()} to {self.recipient.email} "
            f"({self.event}) – {'Sent' if self.is_sent else 'Pending'}"
        )


# =============================================================================
# STUDENT PROMOTION
# =============================================================================

class StudentPromotion(models.Model):
    """
    Records a promotion event for a student from one classroom to another.
    Run by admin at the end of each academic year.
    """

    class PromotionStatus(models.TextChoices):
        PROMOTED = "promoted", "Promoted"
        REPEATED = "repeated", "Repeated Year"
        COMPLETED = "completed", "Completed (Form 4 → Alumni)"
        WITHDRAWN = "withdrawn", "Withdrawn"

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="promotions"
    )
    from_classroom = models.ForeignKey(
        Classroom, on_delete=models.SET_NULL, null=True, related_name="promotions_from"
    )
    to_classroom = models.ForeignKey(
        Classroom,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotions_to",
    )
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="promotions"
    )
    promotion_status = models.CharField(
        max_length=20, choices=PromotionStatus.choices, default=PromotionStatus.PROMOTED
    )
    promoted_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="promotions_run"
    )
    promotion_date = models.DateField(default=timezone.now)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-promotion_date"]

    def __str__(self):
        return (
            f"{self.student.admission_number}: {self.from_classroom} → "
            f"{self.to_classroom or 'Alumni'} ({self.promotion_status})"
        )