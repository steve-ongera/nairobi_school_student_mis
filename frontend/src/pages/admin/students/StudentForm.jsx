// pages/admin/students/StudentForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageTitle } from "../../../components/common/PageTitle";
import { InputField, SelectField, DateField, TextareaField } from "../../../components/forms/InputField";
import { AlertMessage, LoadingSpinner } from "../../../components/common/DataTable";
import useFetch from "../../../hooks/useFetch";
import { studentsAPI, academicsAPI } from "../../../utils/api";

const INITIAL = {
  email: "", first_name: "", last_name: "", phone: "", password: "",
  admission_number: "", date_of_birth: "", gender: "", nationality: "Kenyan",
  national_id: "", birth_certificate_number: "", kcpe_index_number: "", kcpe_marks: "",
  admission_date: new Date().toISOString().slice(0, 10),
  admitted_to_form: "", current_classroom: "", boarding_status: "day",
  dormitory: "", bed_number: "", blood_group: "", medical_conditions: "", medical_insurance: "",
  emergency_contact_name: "", emergency_contact_phone: "",
};

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [step, setStep] = useState(1);

  const { data: formsData } = useFetch(() => academicsAPI.getForms(), []);
  const { data: classroomsData } = useFetch(() => academicsAPI.getClassrooms(), []);
  const { data: existingStudent, loading: loadingStudent } = useFetch(
    () => (isEdit ? studentsAPI.getStudent(id) : Promise.resolve({ data: null })), [id]
  );

  useEffect(() => {
    if (isEdit && existingStudent && existingStudent.user) {
      setForm({
        ...INITIAL,
        email: existingStudent.user?.email || "",
        first_name: existingStudent.user?.first_name || "",
        last_name: existingStudent.user?.last_name || "",
        phone: existingStudent.user?.phone || "",
        admission_number: existingStudent.admission_number || "",
        date_of_birth: existingStudent.date_of_birth || "",
        gender: existingStudent.gender || "",
        nationality: existingStudent.nationality || "Kenyan",
        national_id: existingStudent.national_id || "",
        birth_certificate_number: existingStudent.birth_certificate_number || "",
        kcpe_index_number: existingStudent.kcpe_index_number || "",
        kcpe_marks: existingStudent.kcpe_marks || "",
        admission_date: existingStudent.admission_date || "",
        admitted_to_form: existingStudent.admitted_to_form || "",
        current_classroom: existingStudent.current_classroom?.id || "",
        boarding_status: existingStudent.boarding_status || "day",
        dormitory: existingStudent.dormitory || "",
        bed_number: existingStudent.bed_number || "",
        blood_group: existingStudent.blood_group || "",
        medical_conditions: existingStudent.medical_conditions || "",
        medical_insurance: existingStudent.medical_insurance || "",
        emergency_contact_name: existingStudent.emergency_contact_name || "",
        emergency_contact_phone: existingStudent.emergency_contact_phone || "",
      });
    }
  }, [existingStudent, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    if (!form.first_name) e.first_name = "First name is required";
    if (!form.last_name) e.last_name = "Last name is required";
    if (!form.admission_number) e.admission_number = "Admission number is required";
    if (!form.date_of_birth) e.date_of_birth = "Date of birth is required";
    if (!form.gender) e.gender = "Gender is required";
    if (!form.admission_date) e.admission_date = "Admission date is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); setStep(1); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) payload.password = payload.admission_number;
      if (!payload.kcpe_marks) delete payload.kcpe_marks;

      if (isEdit) {
        await studentsAPI.updateStudent(id, payload);
        setMsg({ type: "success", text: "Student updated successfully." });
      } else {
        await studentsAPI.createStudent(payload);
        setMsg({ type: "success", text: "Student admitted successfully." });
        setForm(INITIAL);
        setStep(1);
      }
    } catch (err) {
      const data = err.response?.data || {};
      const fieldErrors = {};
      Object.keys(data).forEach((k) => {
        fieldErrors[k] = Array.isArray(data[k]) ? data[k][0] : data[k];
      });
      setErrors(fieldErrors);
      setMsg({ type: "danger", text: data.detail || "Failed to save student. Check the form for errors." });
    } finally {
      setSaving(false);
    }
  };

  const forms = formsData || [];
  const classrooms = classroomsData?.results || classroomsData || [];

  if (loadingStudent) return <LoadingSpinner />;

  return (
    <section>
      <PageTitle
        title={isEdit ? "Edit Student" : "Admit New Student"}
        breadcrumbs={[
          { label: "Students", to: "/admin/students" },
          { label: isEdit ? "Edit" : "Admit" },
        ]}
      />

      {msg && <AlertMessage type={msg.type} message={msg.text} onClose={() => setMsg(null)} className="mb-3" />}

      {/* Step indicator */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="d-flex gap-3">
            {["Personal Info", "Academic Details", "Boarding & Medical"].map((label, i) => (
              <button
                key={i}
                className={`btn btn-sm ${step === i + 1 ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setStep(i + 1)}
                type="button"
              >
                <span className="me-1">{i + 1}.</span> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="card">
          <div className="card-body">

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <>
                <h6 className="card-title">Personal Information</h6>
                <div className="row">
                  <div className="col-md-6">
                    <InputField label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required error={errors.first_name} />
                  </div>
                  <div className="col-md-6">
                    <InputField label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required error={errors.last_name} />
                  </div>
                  <div className="col-md-6">
                    <InputField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required error={errors.email} placeholder="student@school.ac.ke" helpText="This will be used for login" />
                  </div>
                  <div className="col-md-6">
                    <InputField label="Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="0712345678" />
                  </div>
                  <div className="col-md-4">
                    <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} required error={errors.gender}
                      options={[{ value: "M", label: "Male" }, { value: "F", label: "Female" }, { value: "O", label: "Other" }]} />
                  </div>
                  <div className="col-md-4">
                    <DateField label="Date of Birth" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} required error={errors.date_of_birth} />
                  </div>
                  <div className="col-md-4">
                    <InputField label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <InputField label="National ID (if 18+)" name="national_id" value={form.national_id} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <InputField label="Birth Certificate Number" name="birth_certificate_number" value={form.birth_certificate_number} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <InputField label="Emergency Contact Name" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <InputField label="Emergency Contact Phone" name="emergency_contact_phone" value={form.emergency_contact_phone} onChange={handleChange} placeholder="0712345678" />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Academic Details */}
            {step === 2 && (
              <>
                <h6 className="card-title">Academic Information</h6>
                <div className="row">
                  <div className="col-md-4">
                    <InputField label="Admission Number" name="admission_number" value={form.admission_number} onChange={handleChange} required error={errors.admission_number} placeholder="e.g. 1023" />
                  </div>
                  <div className="col-md-4">
                    <DateField label="Admission Date" name="admission_date" value={form.admission_date} onChange={handleChange} required error={errors.admission_date} />
                  </div>
                  <div className="col-md-4">
                    <InputField label="Password" name="password" type="password" value={form.password} onChange={handleChange} helpText="Defaults to admission number if blank" />
                  </div>
                  <div className="col-md-4">
                    <SelectField label="Admitted to Form" name="admitted_to_form" value={form.admitted_to_form} onChange={handleChange}
                      options={forms.map((f) => ({ value: f.id, label: f.name }))} />
                  </div>
                  <div className="col-md-4">
                    <SelectField label="Current Classroom" name="current_classroom" value={form.current_classroom} onChange={handleChange}
                      options={classrooms.map((c) => ({ value: c.id, label: c.stream_display }))} />
                  </div>
                  <div className="col-md-4">
                    <InputField label="KCPE Index Number" name="kcpe_index_number" value={form.kcpe_index_number} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <InputField label="KCPE Marks (out of 500)" name="kcpe_marks" type="number" value={form.kcpe_marks} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Boarding & Medical */}
            {step === 3 && (
              <>
                <h6 className="card-title">Boarding & Medical Information</h6>
                <div className="row">
                  <div className="col-md-4">
                    <SelectField label="Boarding Status" name="boarding_status" value={form.boarding_status} onChange={handleChange}
                      options={[{ value: "day", label: "Day Scholar" }, { value: "boarder", label: "Boarder" }]} />
                  </div>
                  {form.boarding_status === "boarder" && (
                    <>
                      <div className="col-md-4">
                        <InputField label="Dormitory" name="dormitory" value={form.dormitory} onChange={handleChange} placeholder="e.g. East Wing" />
                      </div>
                      <div className="col-md-4">
                        <InputField label="Bed Number" name="bed_number" value={form.bed_number} onChange={handleChange} placeholder="e.g. 14A" />
                      </div>
                    </>
                  )}
                  <div className="col-md-3">
                    <SelectField label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange}
                      options={["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => ({ value: g, label: g }))} />
                  </div>
                  <div className="col-md-5">
                    <InputField label="Medical Insurance" name="medical_insurance" value={form.medical_insurance} onChange={handleChange} placeholder="e.g. NHIF, School Insurance" />
                  </div>
                  <div className="col-md-12">
                    <TextareaField label="Medical Conditions / Allergies" name="medical_conditions" value={form.medical_conditions} onChange={handleChange} rows={3} placeholder="List any known conditions, allergies, or special needs…" />
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Navigation + Submit */}
        <div className="d-flex justify-content-between mt-2">
          <div>
            {step > 1 && (
              <button type="button" className="btn btn-outline-secondary me-2" onClick={() => setStep((s) => s - 1)}>
                <i className="bi bi-arrow-left me-1" /> Previous
              </button>
            )}
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/admin/students")}>
              Cancel
            </button>
            {step < 3 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
                Next <i className="bi bi-arrow-right ms-1" />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1" />{isEdit ? "Update Student" : "Admit Student"}</>}
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}