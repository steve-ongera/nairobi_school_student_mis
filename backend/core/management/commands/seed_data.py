"""
core/management/commands/seed_data.py

Usage:
    python manage.py seed_data
    python manage.py seed_data --reset     # wipe existing data first

Seeds:
  - 1 Admin user
  - 1 Finance officer
  - 4 Forms (1-4)
  - 3 Streams per form (East, West, North)
  - 1 Academic Year (current)
  - 3 Terms
  - 12 Classrooms (Form x Stream x Year)
  - 15 Subjects (KNEC standard)
  - 20 Teachers with TSC numbers + allocations
  - 120 Students (10 per classroom) with parents
  - KNEC default grading scale
  - 3 Exams (Opener, Mid-Term, End-Term)
  - Exam results for all students
  - Attendance records (last 30 days)
  - Fee structures + invoices + payments
  - Sample notifications
"""

import random
from decimal import Decimal
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.models import (
    User, AcademicYear, Term, Form, Stream, Classroom, Subject,
    Teacher, TeacherSubjectAllocation,
    Parent, Student, StudentClassHistory,
    GradingScale, Exam, ExamResult,
    Attendance,
    FeeStructure, Invoice, Payment,
    Notification,
)


# ── Kenyan name pools ─────────────────────────────────────────────────────────

MALE_FIRST = [
    "Brian", "Kevin", "Dennis", "Collins", "Erick", "Victor", "Joseph",
    "Emmanuel", "Daniel", "Michael", "Peter", "James", "John", "George",
    "Samuel", "David", "Stephen", "Patrick", "Geoffrey", "Lawrence",
    "Boniface", "Kelvin", "Antony", "Francis", "Charles", "Moses",
    "Simon", "Mark", "Philip", "Timothy",
]

FEMALE_FIRST = [
    "Faith", "Grace", "Joyce", "Mercy", "Esther", "Beatrice", "Caroline",
    "Agnes", "Susan", "Catherine", "Winnie", "Pauline", "Irene", "Millicent",
    "Purity", "Jacqueline", "Vivian", "Lydia", "Sharon", "Ruth",
    "Charity", "Gladys", "Nancy", "Maureen", "Lilian", "Tabitha",
    "Peninah", "Damaris", "Eunice", "Naomi",
]

SURNAMES = [
    "Kamau", "Odhiambo", "Mwangi", "Otieno", "Njoroge", "Kiprotich",
    "Wanjiku", "Achieng", "Mutua", "Karanja", "Kipchoge", "Wangari",
    "Owino", "Njenga", "Kiptoo", "Omondi", "Githinji", "Cheruiyot",
    "Wairimu", "Simiyu", "Muriuki", "Nyambura", "Sang", "Muthoni",
    "Koech", "Ndungu", "Wekesa", "Mugo", "Juma", "Kinyanjui",
    "Ogola", "Rotich", "Kimani", "Anyango", "Bett", "Waweru",
    "Nyaga", "Lagat", "Macharia", "Wambua",
]

COUNTIES = [
    "Nairobi", "Kiambu", "Nakuru", "Meru", "Kisumu", "Kakamega",
    "Machakos", "Nyeri", "Muranga", "Kirinyaga", "Laikipia", "Nyandarua",
]

DORMITORIES = ["Uhuru", "Harambee", "Simba", "Nyota", "Kilimanjaro", "Mara"]

DEPARTMENTS = [
    "Sciences", "Humanities", "Languages", "Mathematics", "Technical",
    "Arts", "Social Studies", "Physical Education",
]

QUALIFICATIONS = [
    "B.Ed (Science)", "B.Ed (Arts)", "B.Sc + PGDE", "B.A + PGDE",
    "Dip. Education", "M.Ed", "B.Ed (Mathematics)", "B.Ed (Languages)",
]


def rand_phone():
    prefixes = ["0712", "0722", "0733", "0700", "0710", "0720", "0740", "0745"]
    return random.choice(prefixes) + "".join([str(random.randint(0, 9)) for _ in range(6)])


def rand_dob_student():
    # Students aged 13–19
    today = date.today()
    age = random.randint(13, 19)
    return today.replace(year=today.year - age) - timedelta(days=random.randint(0, 364))


def rand_dob_teacher():
    today = date.today()
    age = random.randint(28, 58)
    return today.replace(year=today.year - age) - timedelta(days=random.randint(0, 364))


def rand_kcpe():
    return random.randint(200, 420)


class Command(BaseCommand):
    help = "Seed realistic demo data for the School MIS (Kenyan 8-4-4 school)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all existing data before seeding.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Resetting database…"))
            self._reset()

        self.stdout.write(self.style.MIGRATE_HEADING("🌱 Seeding School MIS demo data…"))

        with transaction.atomic():
            self._seed_grading_scale()
            self._seed_academic_structure()
            self._seed_subjects()
            self._seed_admin_users()
            self._seed_teachers()
            self._seed_students()
            self._seed_exams_and_results()
            self._seed_attendance()
            self._seed_fees()
            self._seed_notifications()

        self.stdout.write(self.style.SUCCESS("\n✅ Seeding complete!\n"))
        self._print_summary()

    # ── Reset ─────────────────────────────────────────────────────────────────

    def _reset(self):
        models_to_clear = [
            Notification, Payment, Invoice, FeeStructure,
            Attendance, ExamResult, Exam, GradingScale,
            StudentClassHistory, Student, Parent,
            TeacherSubjectAllocation, Teacher,
            Classroom, Stream, Form, Term, AcademicYear, Subject,
            User,
        ]
        for model in models_to_clear:
            model.objects.all().delete()
        self.stdout.write("  🗑️  All data cleared.")

    # ── Grading Scale ─────────────────────────────────────────────────────────

    def _seed_grading_scale(self):
        self.stdout.write("  📊 Seeding KNEC grading scale…")
        GradingScale.objects.all().delete()
        scale = [
            (75, 100, "A",  12, "Excellent"),
            (70, 74,  "A-", 11, "Very Good"),
            (65, 69,  "B+", 10, "Good"),
            (60, 64,  "B",   9, "Good"),
            (55, 59,  "B-",  8, "Above Average"),
            (50, 54,  "C+",  7, "Average"),
            (45, 49,  "C",   6, "Average"),
            (40, 44,  "C-",  5, "Below Average"),
            (35, 39,  "D+",  4, "Below Average"),
            (30, 34,  "D",   3, "Poor"),
            (25, 29,  "D-",  2, "Very Poor"),
            (0,  24,  "E",   1, "Fail"),
        ]
        for mn, mx, grade, pts, remarks in scale:
            GradingScale.objects.create(
                min_marks=Decimal(str(mn)),
                max_marks=Decimal(str(mx)),
                grade=grade,
                points=pts,
                remarks=remarks,
            )
        self.stdout.write(f"     ✓ {len(scale)} grade bands created")

    # ── Academic Structure ────────────────────────────────────────────────────

    def _seed_academic_structure(self):
        self.stdout.write("  🏫 Seeding academic structure…")
        current_year = date.today().year

        # Academic Year
        self.academic_year, _ = AcademicYear.objects.get_or_create(
            year=current_year,
            defaults={
                "is_current": True,
                "start_date": date(current_year, 1, 6),
                "end_date": date(current_year, 11, 15),
            },
        )

        # Terms
        term_dates = [
            (1, date(current_year, 1, 6),  date(current_year, 4, 5),  True),
            (2, date(current_year, 5, 5),  date(current_year, 8, 2),  False),
            (3, date(current_year, 9, 1),  date(current_year, 11, 15), False),
        ]
        self.terms = []
        for num, start, end, is_current in term_dates:
            term, _ = Term.objects.get_or_create(
                academic_year=self.academic_year,
                term_number=num,
                defaults={"start_date": start, "end_date": end, "is_current": is_current},
            )
            self.terms.append(term)
        self.current_term = self.terms[0]

        # Forms
        self.forms = []
        for level in [1, 2, 3, 4]:
            form, _ = Form.objects.get_or_create(level=level, defaults={"name": f"Form {level}"})
            self.forms.append(form)

        # Streams
        stream_names = ["East", "West", "North"]
        self.streams = []
        for form in self.forms:
            for sname in stream_names:
                stream, _ = Stream.objects.get_or_create(form=form, name=sname)
                self.streams.append(stream)

        # Classrooms
        self.classrooms = []
        for stream in self.streams:
            classroom, _ = Classroom.objects.get_or_create(
                stream=stream,
                academic_year=self.academic_year,
                defaults={"capacity": 45},
            )
            self.classrooms.append(classroom)

        self.stdout.write(
            f"     ✓ {len(self.forms)} forms, {len(self.streams)} streams, "
            f"{len(self.classrooms)} classrooms"
        )

    # ── Subjects ──────────────────────────────────────────────────────────────

    def _seed_subjects(self):
        self.stdout.write("  📚 Seeding subjects…")
        subject_data = [
            # (name, code, type, forms)
            ("Mathematics",            "MATH",  "compulsory", [1, 2, 3, 4]),
            ("English",                "ENG",   "compulsory", [1, 2, 3, 4]),
            ("Kiswahili",              "KSW",   "compulsory", [1, 2, 3, 4]),
            ("Biology",                "BIO",   "compulsory", [1, 2, 3, 4]),
            ("Chemistry",              "CHEM",  "compulsory", [1, 2, 3, 4]),
            ("Physics",                "PHY",   "compulsory", [2, 3, 4]),
            ("History & Government",   "HIST",  "compulsory", [1, 2, 3, 4]),
            ("Geography",              "GEO",   "compulsory", [1, 2, 3, 4]),
            ("Christian Religious Ed", "CRE",   "optional",   [1, 2, 3, 4]),
            ("Islamic Religious Ed",   "IRE",   "optional",   [1, 2, 3, 4]),
            ("Home Science",           "HSC",   "optional",   [1, 2, 3, 4]),
            ("Agriculture",            "AGRI",  "optional",   [1, 2, 3, 4]),
            ("Business Studies",       "BST",   "optional",   [1, 2, 3, 4]),
            ("Computer Studies",       "COMP",  "optional",   [1, 2, 3, 4]),
            ("Art & Design",           "ART",   "optional",   [3, 4]),
        ]
        self.subjects = []
        for name, code, stype, form_levels in subject_data:
            subj, _ = Subject.objects.get_or_create(
                code=code,
                defaults={"name": name, "subject_type": stype, "is_active": True},
            )
            forms = Form.objects.filter(level__in=form_levels)
            subj.applicable_forms.set(forms)
            self.subjects.append(subj)

        self.stdout.write(f"     ✓ {len(self.subjects)} subjects seeded")

    # ── Admin Users ───────────────────────────────────────────────────────────

    def _seed_admin_users(self):
        self.stdout.write("  👤 Seeding admin & finance users…")

        # Superadmin
        if not User.objects.filter(email="admin@school.ac.ke").exists():
            User.objects.create_superuser(
                email="admin@school.ac.ke",
                password="admin1234",
                first_name="System",
                last_name="Administrator",
                phone=rand_phone(),
                role=User.Role.ADMIN,
            )
        # Finance
        if not User.objects.filter(email="finance@school.ac.ke").exists():
            User.objects.create_user(
                email="finance@school.ac.ke",
                password="finance1234",
                first_name="Mary",
                last_name="Wanjiku",
                phone=rand_phone(),
                role=User.Role.FINANCE,
            )
        self.stdout.write("     ✓ admin@school.ac.ke / admin1234")
        self.stdout.write("     ✓ finance@school.ac.ke / finance1234")

    # ── Teachers ──────────────────────────────────────────────────────────────

    def _seed_teachers(self):
        self.stdout.write("  👨‍🏫 Seeding teachers…")
        self.teachers = []
        used_emails = set(User.objects.values_list("email", flat=True))

        # Core subjects that need teachers in every class
        core_subjects = Subject.objects.filter(
            code__in=["MATH", "ENG", "KSW", "BIO", "CHEM", "PHY", "HIST", "GEO"]
        )

        for i in range(20):
            gender = random.choice(["M", "F"])
            first = random.choice(MALE_FIRST if gender == "M" else FEMALE_FIRST)
            last = random.choice(SURNAMES)
            email = f"{first.lower()}.{last.lower()}{i}@school.ac.ke"
            while email in used_emails:
                email = f"{first.lower()}.{last.lower()}{i}{random.randint(1,99)}@school.ac.ke"
            used_emails.add(email)

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "role": User.Role.TEACHER,
                    "phone": rand_phone(),
                    "is_active": True,
                },
            )
            if created:
                user.set_password("teacher1234")
                user.save()

            teacher, _ = Teacher.objects.get_or_create(
                user=user,
                defaults={
                    "staff_number": f"STF{1000 + i:04d}",
                    "tsc_number": f"TSC{random.randint(100000, 999999)}",
                    "department": random.choice(DEPARTMENTS),
                    "qualification": random.choice(QUALIFICATIONS),
                    "date_joined_school": date(random.randint(2010, 2022), random.randint(1, 12), 1),
                    "is_active": True,
                },
            )
            self.teachers.append(teacher)

        # Assign each classroom a class teacher
        for idx, classroom in enumerate(self.classrooms):
            if not classroom.class_teacher:
                classroom.class_teacher = self.teachers[idx % len(self.teachers)]
                classroom.save()

        # Create subject allocations
        alloc_count = 0
        for classroom in self.classrooms:
            form_subjects = Subject.objects.filter(
                applicable_forms=classroom.stream.form, is_active=True
            )
            teacher_pool = list(self.teachers)
            random.shuffle(teacher_pool)
            for j, subject in enumerate(form_subjects):
                teacher = teacher_pool[j % len(teacher_pool)]
                _, created = TeacherSubjectAllocation.objects.get_or_create(
                    teacher=teacher,
                    subject=subject,
                    classroom=classroom,
                    academic_year=self.academic_year,
                )
                if created:
                    alloc_count += 1

        self.stdout.write(
            f"     ✓ {len(self.teachers)} teachers, {alloc_count} allocations"
        )

    # ── Students ──────────────────────────────────────────────────────────────

    def _seed_students(self):
        self.stdout.write("  🎓 Seeding students & parents…")
        self.students = []
        used_emails = set(User.objects.values_list("email", flat=True))
        adm_counter = 1000

        for classroom in self.classrooms:
            for i in range(10):  # 10 students per classroom
                gender = random.choice(["M", "F"])
                first = random.choice(MALE_FIRST if gender == "M" else FEMALE_FIRST)
                last = random.choice(SURNAMES)
                adm_no = f"ADM{date.today().year % 100}{adm_counter:04d}"
                adm_counter += 1
                email = f"{adm_no.lower()}@student.school.ac.ke"

                if User.objects.filter(email=email).exists():
                    student = Student.objects.filter(admission_number=adm_no).first()
                    if student:
                        self.students.append(student)
                    continue

                # Parent
                parent_first = random.choice(MALE_FIRST)
                parent_last = last
                parent_email = f"parent.{last.lower()}{adm_counter}@gmail.com"
                while parent_email in used_emails:
                    parent_email = f"parent.{last.lower()}{adm_counter}{random.randint(1,99)}@gmail.com"
                used_emails.add(parent_email)

                parent_user = User.objects.create_user(
                    email=parent_email,
                    password="parent1234",
                    first_name=parent_first,
                    last_name=parent_last,
                    role=User.Role.PARENT,
                    phone=rand_phone(),
                )
                parent = Parent.objects.create(
                    user=parent_user,
                    id_number=f"{random.randint(10000000, 40000000)}",
                    occupation=random.choice([
                        "Farmer", "Teacher", "Business", "Engineer",
                        "Driver", "Nurse", "Clerk", "Self Employed",
                    ]),
                    relationship=random.choice(["Father", "Mother", "Guardian"]),
                )

                # Student
                used_emails.add(email)
                student_user = User.objects.create_user(
                    email=email,
                    password=adm_no,
                    first_name=first,
                    last_name=last,
                    role=User.Role.STUDENT,
                    phone=rand_phone(),
                )
                is_boarder = random.random() < 0.4
                student = Student.objects.create(
                    user=student_user,
                    admission_number=adm_no,
                    date_of_birth=rand_dob_student(),
                    gender=gender,
                    nationality="Kenyan",
                    kcpe_marks=rand_kcpe(),
                    kcpe_index_number=f"{random.randint(10000000, 99999999)}",
                    admission_date=date(date.today().year, 1, 6),
                    admitted_to_form=classroom.stream.form,
                    current_classroom=classroom,
                    parent=parent,
                    boarding_status="boarder" if is_boarder else "day",
                    dormitory=random.choice(DORMITORIES) if is_boarder else "",
                    bed_number=f"B{random.randint(1,120)}" if is_boarder else "",
                    blood_group=random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+"]),
                    status="active",
                )

                StudentClassHistory.objects.create(
                    student=student,
                    classroom=classroom,
                    academic_year=self.academic_year,
                    term=self.current_term,
                    date_enrolled=date(date.today().year, 1, 6),
                )

                self.students.append(student)

        self.stdout.write(f"     ✓ {len(self.students)} students seeded")

    # ── Exams & Results ───────────────────────────────────────────────────────

    def _seed_exams_and_results(self):
        self.stdout.write("  📝 Seeding exams & results…")
        current_year = date.today().year
        admin_user = User.objects.filter(role=User.Role.ADMIN).first()

        exams_data = [
            ("Opener Exam", "opener", self.terms[0],
             date(current_year, 1, 20), date(current_year, 1, 24), True),
            ("Mid-Term Exam", "midterm", self.terms[0],
             date(current_year, 2, 24), date(current_year, 2, 28), True),
            ("End-Term 1 Exam", "endterm", self.terms[0],
             date(current_year, 3, 25), date(current_year, 3, 29), False),
        ]

        self.exams = []
        for name, etype, term, start, end, published in exams_data:
            exam, _ = Exam.objects.get_or_create(
                name=name,
                term=term,
                defaults={
                    "exam_type": etype,
                    "out_of": 100,
                    "start_date": start,
                    "end_date": end,
                    "is_published": published,
                    "created_by": admin_user,
                },
            )
            exam.applicable_forms.set(self.forms)
            self.exams.append(exam)

        result_count = 0
        for exam in self.exams:
            for student in self.students:
                if not student.current_classroom:
                    continue
                subjects = Subject.objects.filter(
                    applicable_forms=student.current_classroom.stream.form,
                    is_active=True,
                )
                for subject in subjects:
                    if ExamResult.objects.filter(student=student, exam=exam, subject=subject).exists():
                        continue
                    # Realistic marks: normal distribution around 55
                    mean = random.gauss(55, 18)
                    marks = max(0, min(100, round(mean, 1)))
                    result = ExamResult(
                        student=student,
                        exam=exam,
                        subject=subject,
                        marks=Decimal(str(marks)),
                        remarks=random.choice(["", "", "", "Good effort", "Needs improvement", "Excellent"]),
                        entered_by=admin_user,
                    )
                    result.save()  # triggers grade auto-compute
                    result_count += 1

        self.stdout.write(
            f"     ✓ {len(self.exams)} exams, {result_count} results"
        )

    # ── Attendance ────────────────────────────────────────────────────────────

    def _seed_attendance(self):
        self.stdout.write("  📅 Seeding attendance records (last 30 days)…")
        admin_user = User.objects.filter(role=User.Role.ADMIN).first()
        today = date.today()
        att_count = 0

        for days_ago in range(30, 0, -1):
            record_date = today - timedelta(days=days_ago)
            if record_date.weekday() >= 5:  # skip weekends
                continue

            for student in self.students[:60]:  # limit for performance
                if Attendance.objects.filter(student=student, date=record_date).exists():
                    continue

                # 90% present, 5% absent, 3% late, 2% sick
                roll = random.random()
                if roll < 0.90:
                    status = "present"
                elif roll < 0.95:
                    status = "absent"
                elif roll < 0.98:
                    status = "late"
                else:
                    status = "sick"

                Attendance.objects.create(
                    student=student,
                    classroom=student.current_classroom,
                    date=record_date,
                    status=status,
                    remarks="Late by 15 min" if status == "late" else "",
                    recorded_by=admin_user,
                )
                att_count += 1

        self.stdout.write(f"     ✓ {att_count} attendance records")

    # ── Fees ──────────────────────────────────────────────────────────────────

    def _seed_fees(self):
        self.stdout.write("  💰 Seeding fee structures, invoices & payments…")
        admin_user = User.objects.filter(role=User.Role.ADMIN).first()

        # Fee structures per form per term
        fee_items = [
            ("Tuition Fee",   "tuition",   Decimal("15000"), True),
            ("Activity Fee",  "activity",  Decimal("2000"),  True),
            ("Exam Fee",      "exam",      Decimal("1500"),  True),
            ("Boarding Fee",  "boarding",  Decimal("12000"), False),  # boarders only
            ("Lunch Fee",     "lunch",     Decimal("3000"),  False),
        ]

        fee_count = 0
        for form in self.forms:
            for term in self.terms:
                for name, category, amount, mandatory in fee_items:
                    _, created = FeeStructure.objects.get_or_create(
                        name=name,
                        form=form,
                        term=term,
                        defaults={
                            "category": category,
                            "amount": amount,
                            "is_mandatory": mandatory,
                        },
                    )
                    if created:
                        fee_count += 1

        # Generate invoices for all students for current term
        inv_count = 0
        pay_count = 0

        for student in self.students:
            if not student.current_classroom:
                continue

            mandatory_fees = FeeStructure.objects.filter(
                form=student.current_classroom.stream.form,
                term=self.current_term,
                is_mandatory=True,
            )
            total = mandatory_fees.aggregate(t=models_sum("amount"))["t"] or Decimal("0")

            # Add boarding if applicable
            if student.boarding_status == "boarder":
                boarding = FeeStructure.objects.filter(
                    form=student.current_classroom.stream.form,
                    term=self.current_term,
                    category="boarding",
                ).first()
                if boarding:
                    total += boarding.amount

            if total == 0:
                continue

            invoice, created = Invoice.objects.get_or_create(
                student=student,
                term=self.current_term,
                defaults={"total_amount": total},
            )
            if created:
                inv_count += 1

            # Random payment status
            roll = random.random()
            if roll < 0.3:
                # Fully paid
                paid_amount = total
            elif roll < 0.65:
                # Partial payment
                paid_amount = Decimal(str(round(float(total) * random.uniform(0.3, 0.9), 2)))
            else:
                # Unpaid
                paid_amount = Decimal("0")

            if paid_amount > 0 and not invoice.payments.filter(confirmed=True).exists():
                payment = Payment.objects.create(
                    invoice=invoice,
                    amount=paid_amount,
                    payment_method=random.choice(["mpesa", "mpesa", "mpesa", "bank", "cash"]),
                    transaction_reference=f"QK{random.randint(1000000, 9999999)}",
                    payment_date=timezone.now() - timedelta(days=random.randint(1, 30)),
                    phone_number=student.parent.user.phone if student.parent else rand_phone(),
                    confirmed=True,
                    received_by=admin_user,
                )
                pay_count += 1

        self.stdout.write(
            f"     ✓ {fee_count} fee items, {inv_count} invoices, {pay_count} payments"
        )

    # ── Notifications ─────────────────────────────────────────────────────────

    def _seed_notifications(self):
        self.stdout.write("  🔔 Seeding notifications…")
        admin_user = User.objects.filter(role=User.Role.ADMIN).first()
        parent_users = User.objects.filter(role=User.Role.PARENT)[:10]

        notif_count = 0
        for parent_user in parent_users:
            Notification.objects.get_or_create(
                recipient=parent_user,
                event="fee_payment",
                defaults={
                    "notification_type": "sms",
                    "subject": "Fee Payment Confirmation",
                    "message": (
                        "Dear Parent, we confirm receipt of your fee payment. "
                        "Thank you for your prompt payment. – School Admin"
                    ),
                    "is_sent": True,
                    "sent_at": timezone.now() - timedelta(days=random.randint(1, 14)),
                },
            )
            notif_count += 1

        Notification.objects.get_or_create(
            recipient=admin_user,
            event="results_published",
            defaults={
                "notification_type": "sms",
                "subject": "Results Published",
                "message": "Opener Exam results have been published to the student portal.",
                "is_sent": True,
                "sent_at": timezone.now() - timedelta(days=3),
            },
        )
        notif_count += 1

        self.stdout.write(f"     ✓ {notif_count} notifications")

    # ── Summary ───────────────────────────────────────────────────────────────

    def _print_summary(self):
        self.stdout.write(self.style.MIGRATE_HEADING("📋 Seeded Data Summary"))
        rows = [
            ("Academic Years",    AcademicYear.objects.count()),
            ("Terms",             Term.objects.count()),
            ("Forms",             Form.objects.count()),
            ("Streams",           Stream.objects.count()),
            ("Classrooms",        Classroom.objects.count()),
            ("Subjects",          Subject.objects.count()),
            ("Teachers",          Teacher.objects.count()),
            ("Subject Allocations", TeacherSubjectAllocation.objects.count()),
            ("Students",          Student.objects.count()),
            ("Parents",           Parent.objects.count()),
            ("Grading Bands",     GradingScale.objects.count()),
            ("Exams",             Exam.objects.count()),
            ("Exam Results",      ExamResult.objects.count()),
            ("Attendance Records", Attendance.objects.count()),
            ("Fee Structures",    FeeStructure.objects.count()),
            ("Invoices",          Invoice.objects.count()),
            ("Payments",          Payment.objects.count()),
            ("Notifications",     Notification.objects.count()),
            ("Total Users",       User.objects.count()),
        ]
        for label, count in rows:
            self.stdout.write(f"  {label:<28} {count:>6}")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("🔑 Login Credentials"))
        self.stdout.write("  Admin:   admin@school.ac.ke    / admin1234")
        self.stdout.write("  Finance: finance@school.ac.ke  / finance1234")
        self.stdout.write("  Teacher: (any teacher email)   / teacher1234")
        self.stdout.write("  Student: (admission_no)@student.school.ac.ke / (admission_no)")
        self.stdout.write("")


# helper to avoid importing Sum at top level inside transaction
def models_sum(field):
    from django.db.models import Sum
    return Sum(field)