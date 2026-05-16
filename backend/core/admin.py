# core/admin.py – Django admin registrations for all models
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, AcademicYear, Term, Form, Stream, Classroom, Subject,
    Teacher, TeacherSubjectAllocation,
    Parent, Student, StudentClassHistory,
    GradingScale, Exam, ExamResult,
    Attendance,
    FeeStructure, Invoice, Payment, MpesaTransaction,
    Notification, StudentPromotion,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "is_active", "date_joined")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone", "profile_picture")}),
        ("Role & Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("date_joined", "last_login")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ("year", "is_current", "start_date", "end_date")
    list_filter = ("is_current",)


@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = ("academic_year", "term_number", "is_current", "start_date", "end_date")
    list_filter = ("academic_year", "term_number", "is_current")


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ("level", "name")


@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = ("form", "name")
    list_filter = ("form",)


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ("stream", "academic_year", "class_teacher", "student_count", "capacity")
    list_filter = ("academic_year", "stream__form")
    search_fields = ("stream__name", "stream__form__name")


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "subject_type", "is_active")
    list_filter = ("subject_type", "is_active")
    search_fields = ("name", "code")


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("user", "staff_number", "tsc_number", "department", "is_active")
    list_filter = ("is_active", "department")
    search_fields = ("user__first_name", "user__last_name", "staff_number", "tsc_number")


@admin.register(TeacherSubjectAllocation)
class TeacherSubjectAllocationAdmin(admin.ModelAdmin):
    list_display = ("teacher", "subject", "classroom", "academic_year")
    list_filter = ("academic_year", "subject")
    search_fields = ("teacher__user__last_name", "subject__name")


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ("user", "id_number", "relationship")
    search_fields = ("user__first_name", "user__last_name", "user__email")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        "admission_number", "user", "current_classroom",
        "boarding_status", "status", "admission_date",
    )
    list_filter = ("status", "boarding_status", "gender", "current_classroom__stream__form")
    search_fields = ("admission_number", "user__first_name", "user__last_name", "user__email")
    raw_id_fields = ("user", "parent", "current_classroom", "admitted_to_form")


@admin.register(StudentClassHistory)
class StudentClassHistoryAdmin(admin.ModelAdmin):
    list_display = ("student", "classroom", "academic_year", "term", "date_enrolled")
    list_filter = ("academic_year",)
    search_fields = ("student__admission_number",)


@admin.register(GradingScale)
class GradingScaleAdmin(admin.ModelAdmin):
    list_display = ("grade", "min_marks", "max_marks", "points", "remarks")
    ordering = ("-min_marks",)


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ("name", "exam_type", "term", "is_published", "start_date", "result_count")
    list_filter = ("exam_type", "is_published", "term__academic_year")
    search_fields = ("name",)

    def result_count(self, obj):
        return obj.results.count()
    result_count.short_description = "Results"


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ("student", "exam", "subject", "marks", "grade", "points")
    list_filter = ("exam", "subject")
    search_fields = ("student__admission_number", "student__user__last_name")
    raw_id_fields = ("student", "exam", "subject", "entered_by")


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("student", "date", "status", "classroom", "recorded_by")
    list_filter = ("status", "date", "classroom__stream__form")
    search_fields = ("student__admission_number", "student__user__last_name")
    date_hierarchy = "date"


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "form", "term", "amount", "is_mandatory")
    list_filter = ("category", "form", "term")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("student", "term", "total_amount", "amount_paid", "status", "issued_date")
    list_filter = ("status", "term")
    search_fields = ("student__admission_number", "student__user__last_name")
    raw_id_fields = ("student", "term")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("invoice", "amount", "payment_method", "transaction_reference", "payment_date", "confirmed")
    list_filter = ("payment_method", "confirmed")
    search_fields = ("transaction_reference", "invoice__student__admission_number")
    date_hierarchy = "payment_date"


@admin.register(MpesaTransaction)
class MpesaTransactionAdmin(admin.ModelAdmin):
    list_display = ("mpesa_receipt_number", "phone_number", "amount", "account_reference", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("mpesa_receipt_number", "phone_number", "account_reference")
    readonly_fields = ("raw_payload",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "notification_type", "event", "is_sent", "created_at")
    list_filter = ("notification_type", "event", "is_sent")


@admin.register(StudentPromotion)
class StudentPromotionAdmin(admin.ModelAdmin):
    list_display = ("student", "from_classroom", "to_classroom", "promotion_status", "promotion_date", "promoted_by")
    list_filter = ("promotion_status", "academic_year")
    search_fields = ("student__admission_number",)