"""
core/utils.py – Utility functions for the School MIS.

Modules:
  - Grading Engine  : compute grades, mean scores, rankings
  - MPESA Utils     : Daraja API – STK Push, token generation
  - SMS Utils       : Africa's Talking SMS sending
  - Report Utils    : PDF report card generation helpers
"""

import base64
import logging
from datetime import datetime
from decimal import Decimal

import requests
from django.conf import settings
from django.db.models import Sum, Avg
from django.utils import timezone

logger = logging.getLogger(__name__)


# =============================================================================
# GRADING ENGINE
# =============================================================================

def get_grade_and_points(marks):
    """
    Return (grade, points) for a given marks value using the GradingScale table.
    Falls back to None, None if no scale entry is found.
    """
    from .models import GradingScale

    scale = (
        GradingScale.objects.filter(min_marks__lte=marks, max_marks__gte=marks)
        .order_by("-min_marks")
        .first()
    )
    if scale:
        return scale.grade, scale.points
    return None, None


def compute_student_exam_summary(student, exam):
    """
    Compute mean score, mean points, mean grade for a student in one exam.
    Returns a dict.
    """
    from .models import ExamResult, GradingScale

    results = ExamResult.objects.filter(student=student, exam=exam)
    if not results.exists():
        return None

    total_marks = results.aggregate(total=Sum("marks"))["total"] or Decimal("0")
    total_points = results.aggregate(total=Sum("points"))["total"] or 0
    count = results.count()

    mean_score = total_marks / count
    mean_points = Decimal(total_points) / count

    # Determine mean grade from mean points
    scale = (
        GradingScale.objects.filter(points__lte=round(float(mean_points)))
        .order_by("-points")
        .first()
    )
    mean_grade = scale.grade if scale else "N/A"

    return {
        "total_marks": total_marks,
        "mean_score": round(mean_score, 2),
        "mean_points": round(mean_points, 2),
        "mean_grade": mean_grade,
        "subject_count": count,
        "results": results,
    }


def compute_rankings(exam):
    """
    Compute stream, form, and overall school positions for all students
    in a given exam.  Returns a dict keyed by student_id:
      {student_id: {stream_position, form_position, overall_position, mean_points}}
    """
    from .models import ExamResult, Student

    # Gather all students who sat this exam
    student_ids = ExamResult.objects.filter(exam=exam).values_list(
        "student_id", flat=True
    ).distinct()

    summaries = []
    for sid in student_ids:
        try:
            student = Student.objects.select_related(
                "current_classroom__stream__form"
            ).get(pk=sid)
        except Student.DoesNotExist:
            continue
        summary = compute_student_exam_summary(student, exam)
        if summary:
            summaries.append(
                {
                    "student_id": sid,
                    "student": student,
                    "mean_points": float(summary["mean_points"]),
                    "mean_grade": summary["mean_grade"],
                    "stream": student.current_classroom.stream if student.current_classroom else None,
                    "form": student.current_classroom.stream.form if student.current_classroom else None,
                }
            )

    # Sort descending by mean_points for overall ranking
    summaries.sort(key=lambda x: x["mean_points"], reverse=True)
    rankings = {}

    for overall_pos, s in enumerate(summaries, start=1):
        rankings[s["student_id"]] = {
            "overall_position": overall_pos,
            "mean_points": s["mean_points"],
            "mean_grade": s["mean_grade"],
        }

    # Stream positions
    from itertools import groupby

    stream_groups = {}
    for s in summaries:
        stream_key = s["stream"].pk if s["stream"] else 0
        stream_groups.setdefault(stream_key, []).append(s)

    for stream_key, group in stream_groups.items():
        group.sort(key=lambda x: x["mean_points"], reverse=True)
        for pos, s in enumerate(group, start=1):
            rankings[s["student_id"]]["stream_position"] = pos
            rankings[s["student_id"]]["stream_total"] = len(group)

    # Form positions
    form_groups = {}
    for s in summaries:
        form_key = s["form"].pk if s["form"] else 0
        form_groups.setdefault(form_key, []).append(s)

    for form_key, group in form_groups.items():
        group.sort(key=lambda x: x["mean_points"], reverse=True)
        for pos, s in enumerate(group, start=1):
            rankings[s["student_id"]]["form_position"] = pos
            rankings[s["student_id"]]["form_total"] = len(group)

    return rankings


def seed_default_grading_scale():
    """
    Populate GradingScale with the standard KNEC A–E scale.
    Safe to call multiple times (uses get_or_create).
    """
    from .models import GradingScale

    KNEC_SCALE = [
        (75, 100, "A",  12, "Excellent"),
        (70, 74,  "A-", 11, "Excellent"),
        (65, 69,  "B+", 10, "Very Good"),
        (60, 64,  "B",  9,  "Good"),
        (55, 59,  "B-", 8,  "Good"),
        (50, 54,  "C+", 7,  "Average"),
        (45, 49,  "C",  6,  "Average"),
        (40, 44,  "C-", 5,  "Below Average"),
        (35, 39,  "D+", 4,  "Below Average"),
        (30, 34,  "D",  3,  "Poor"),
        (25, 29,  "D-", 2,  "Poor"),
        (0,  24,  "E",  1,  "Very Poor"),
    ]

    for min_m, max_m, grade, pts, remarks in KNEC_SCALE:
        GradingScale.objects.get_or_create(
            grade=grade,
            defaults={
                "min_marks": min_m,
                "max_marks": max_m,
                "points": pts,
                "remarks": remarks,
            },
        )
    logger.info("Default KNEC grading scale seeded successfully.")


# =============================================================================
# MPESA / DARAJA API
# =============================================================================

def get_mpesa_access_token():
    """
    Fetch an OAuth access token from Safaricom Daraja API.
    Returns token string or None on failure.
    """
    consumer_key = settings.MPESA_CONSUMER_KEY
    consumer_secret = settings.MPESA_CONSUMER_SECRET
    base_url = settings.MPESA_BASE_URL

    credentials = base64.b64encode(
        f"{consumer_key}:{consumer_secret}".encode()
    ).decode()

    try:
        response = requests.get(
            f"{base_url}/oauth/v1/generate?grant_type=client_credentials",
            headers={"Authorization": f"Basic {credentials}"},
            timeout=30,
        )
        response.raise_for_status()
        return response.json().get("access_token")
    except requests.RequestException as exc:
        logger.error("MPESA access token error: %s", exc)
        return None


def generate_mpesa_password():
    """
    Generate the base64-encoded password for STK Push.
    Format: base64(shortcode + passkey + timestamp)
    """
    shortcode = settings.MPESA_SHORTCODE
    passkey = settings.MPESA_PASSKEY
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    raw = f"{shortcode}{passkey}{timestamp}"
    password = base64.b64encode(raw.encode()).decode()
    return password, timestamp


def initiate_stk_push(phone_number, amount, account_reference, transaction_desc="Fee Payment"):
    """
    Initiate an MPESA STK Push (Lipa Na MPESA Online).

    Args:
        phone_number     : str  – Kenyan phone in 254XXXXXXXXX format
        amount           : int  – Amount in KES (no decimals for MPESA)
        account_reference: str  – Admission number (displayed on phone prompt)
        transaction_desc : str  – Short description

    Returns:
        dict with Safaricom response or {'error': '...'} on failure.
    """
    access_token = get_mpesa_access_token()
    if not access_token:
        return {"error": "Failed to obtain MPESA access token."}

    password, timestamp = generate_mpesa_password()
    shortcode = settings.MPESA_SHORTCODE
    callback_url = settings.MPESA_CALLBACK_URL
    base_url = settings.MPESA_BASE_URL

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),  # MPESA requires integer
        "PartyA": phone_number,
        "PartyB": shortcode,
        "PhoneNumber": phone_number,
        "CallBackURL": callback_url,
        "AccountReference": account_reference,
        "TransactionDesc": transaction_desc,
    }

    try:
        response = requests.post(
            f"{base_url}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        logger.error("MPESA STK Push error: %s", exc)
        return {"error": str(exc)}


def process_mpesa_callback(payload):
    """
    Process a Safaricom STK Push callback payload.
    Creates/updates MpesaTransaction and Payment records.

    Returns:
        (success: bool, message: str)
    """
    from .models import MpesaTransaction, Student, Invoice, Payment

    try:
        stk_callback = payload["Body"]["stkCallback"]
        result_code = stk_callback["ResultCode"]
        checkout_request_id = stk_callback["CheckoutRequestID"]
        merchant_request_id = stk_callback["MerchantRequestID"]

        # Update or create the MpesaTransaction record
        txn, _ = MpesaTransaction.objects.get_or_create(
            checkout_request_id=checkout_request_id,
            defaults={
                "merchant_request_id": merchant_request_id,
                "result_code": result_code,
                "result_description": stk_callback.get("ResultDesc", ""),
                "raw_payload": payload,
            },
        )

        if result_code != 0:
            txn.status = MpesaTransaction.TransactionStatus.FAILED
            txn.result_code = result_code
            txn.result_description = stk_callback.get("ResultDesc", "Failed")
            txn.raw_payload = payload
            txn.save()
            return False, stk_callback.get("ResultDesc", "Payment failed.")

        # Parse callback metadata
        metadata = {
            item["Name"]: item.get("Value")
            for item in stk_callback["CallbackMetadata"]["Item"]
        }

        amount = Decimal(str(metadata.get("Amount", 0)))
        receipt_number = metadata.get("MpesaReceiptNumber", "")
        phone_number = str(metadata.get("PhoneNumber", ""))
        account_reference = metadata.get("AccountReference", "")
        transaction_date = str(metadata.get("TransactionDate", ""))

        txn.amount = amount
        txn.mpesa_receipt_number = receipt_number
        txn.phone_number = phone_number
        txn.account_reference = account_reference
        txn.transaction_date = transaction_date
        txn.result_code = result_code
        txn.result_description = "Success"
        txn.raw_payload = payload

        # Match to student invoice using admission number as account reference
        try:
            student = Student.objects.get(admission_number=account_reference)
            current_invoice = student.invoices.filter(
                status__in=["unpaid", "partial"]
            ).order_by("-term__academic_year__year", "-term__term_number").first()

            if current_invoice:
                payment = Payment.objects.create(
                    invoice=current_invoice,
                    amount=amount,
                    payment_method=Payment.PaymentMethod.MPESA,
                    transaction_reference=receipt_number,
                    phone_number=phone_number,
                    confirmed=True,
                    payment_date=timezone.now(),
                )
                txn.payment = payment
                txn.status = MpesaTransaction.TransactionStatus.MATCHED

                # Send SMS notification
                send_payment_sms(student, amount, receipt_number, current_invoice)
            else:
                txn.status = MpesaTransaction.TransactionStatus.UNMATCHED
                logger.warning(
                    "MPESA payment received but no open invoice found for %s",
                    account_reference,
                )
        except Student.DoesNotExist:
            txn.status = MpesaTransaction.TransactionStatus.UNMATCHED
            logger.warning(
                "MPESA payment: student with admission_number '%s' not found.",
                account_reference,
            )

        txn.save()
        return True, "Payment processed successfully."

    except (KeyError, TypeError, ValueError) as exc:
        logger.error("MPESA callback processing error: %s", exc)
        return False, f"Callback processing error: {exc}"


# =============================================================================
# SMS UTILITIES (Africa's Talking)
# =============================================================================

def send_sms(phone_numbers, message):
    """
    Send SMS via Africa's Talking.

    Args:
        phone_numbers : list[str] – Recipients in +254XXXXXXXXX format
        message       : str       – SMS body (max 160 chars per segment)

    Returns:
        dict with AT API response or {'error': '...'} on failure.
    """
    at_username = settings.AT_USERNAME
    at_api_key = settings.AT_API_KEY
    sender_id = settings.AT_SENDER_ID

    if not at_api_key:
        logger.warning("Africa's Talking API key not configured. SMS not sent.")
        return {"error": "SMS service not configured."}

    # Normalize phone numbers
    normalized = []
    for num in phone_numbers:
        num = num.strip()
        if num.startswith("0"):
            num = "+254" + num[1:]
        elif num.startswith("254"):
            num = "+" + num
        elif not num.startswith("+"):
            num = "+254" + num
        normalized.append(num)

    try:
        import africastalking as at
        at.initialize(at_username, at_api_key)
        sms = at.SMS
        response = sms.send(message, normalized, sender_id)
        logger.info("SMS sent to %s: %s", normalized, response)
        return response
    except Exception as exc:
        logger.error("SMS sending error: %s", exc)
        return {"error": str(exc)}


def send_payment_sms(student, amount, receipt_number, invoice):
    """Send a payment confirmation SMS to the student's parent/guardian."""
    parent = student.parent
    if not parent:
        return

    phone = parent.user.phone
    if not phone:
        return

    balance = invoice.balance
    message = (
        f"Dear Parent, KES {amount:,.0f} received for {student.user.get_full_name()} "
        f"(Adm: {student.admission_number}) via MPESA {receipt_number}. "
        f"Outstanding balance: KES {balance:,.0f}. "
        f"– {settings.SCHOOL_NAME}"
    )
    send_sms([phone], message)


def send_results_sms(student, exam, mean_grade, position, total):
    """Notify parent when exam results are published."""
    parent = student.parent
    if not parent:
        return

    phone = parent.user.phone
    if not phone:
        return

    message = (
        f"Dear Parent, {student.user.get_full_name()} scored Mean Grade {mean_grade} "
        f"(Position {position}/{total}) in {exam.name}. "
        f"Login to parent portal for full report. "
        f"– {settings.SCHOOL_NAME}"
    )
    send_sms([phone], message)


def send_attendance_alert_sms(student):
    """Alert parent when a student is marked absent."""
    parent = student.parent
    if not parent:
        return

    phone = parent.user.phone
    if not phone:
        return

    today = timezone.now().date().strftime("%d %b %Y")
    message = (
        f"Dear Parent, {student.user.get_full_name()} (Adm: {student.admission_number}) "
        f"was marked ABSENT on {today}. Please contact the school if this is unexpected. "
        f"– {settings.SCHOOL_NAME}"
    )
    send_sms([phone], message)


# =============================================================================
# PROMOTION UTILITIES
# =============================================================================

def run_bulk_promotion(from_classroom, to_classroom, academic_year, promoted_by,
                       student_ids=None, promotion_status="promoted", notes=""):
    """
    Promote students from one classroom to another at year end.

    - Creates StudentPromotion records.
    - Updates Student.current_classroom.
    - Appends to StudentClassHistory.
    - NEVER deletes or overwrites existing history.

    Args:
        from_classroom   : Classroom
        to_classroom     : Classroom | None (None = completed Form 4 / alumni)
        academic_year    : AcademicYear
        promoted_by      : User
        student_ids      : list[int] | None  (None = all active students)
        promotion_status : str
        notes            : str

    Returns:
        list[StudentPromotion]
    """
    from .models import Student, StudentPromotion, StudentClassHistory

    students_qs = Student.objects.filter(
        current_classroom=from_classroom, status=Student.Status.ACTIVE
    )
    if student_ids:
        students_qs = students_qs.filter(pk__in=student_ids)

    promotions = []
    for student in students_qs:
        promo = StudentPromotion.objects.create(
            student=student,
            from_classroom=from_classroom,
            to_classroom=to_classroom,
            academic_year=academic_year,
            promotion_status=promotion_status,
            promoted_by=promoted_by,
            notes=notes,
        )

        # Archive history
        StudentClassHistory.objects.create(
            student=student,
            classroom=from_classroom,
            academic_year=academic_year,
            notes=f"Promoted: {promotion_status}",
        )

        # Update current classroom
        if to_classroom:
            student.current_classroom = to_classroom
            student.status = Student.Status.ACTIVE
        else:
            # Form 4 → completed
            student.current_classroom = None
            student.status = Student.Status.COMPLETED

        student.save(update_fields=["current_classroom", "status"])
        promotions.append(promo)

    logger.info(
        "Bulk promotion: %d students from %s to %s by %s",
        len(promotions),
        from_classroom,
        to_classroom or "Alumni",
        promoted_by,
    )
    return promotions