import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        const { data } = await axios.post(`${BASE_URL}/api/auth/token/refresh/`, { refresh });
        localStorage.setItem("access_token", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post("/auth/login/", { email, password });

export const logout = (refresh) =>
  api.post("/auth/logout/", { refresh });

export const getMe = () => api.get("/auth/me/");
export const updateMe = (data) => api.patch("/auth/me/", data);
export const changePassword = (data) => api.post("/auth/change-password/", data);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const getAdminDashboard = () => api.get("/dashboard/admin/");
export const getTeacherDashboard = () => api.get("/dashboard/teacher/");
export const getStudentDashboard = () => api.get("/dashboard/student/");

// ── ACADEMIC STRUCTURE ────────────────────────────────────────────────────────
export const getAcademicYears = () => api.get("/academics/years/");
export const getCurrentYear = () => api.get("/academics/years/current/");
export const createAcademicYear = (data) => api.post("/academics/years/", data);

export const getTerms = (params) => api.get("/academics/terms/", { params });
export const getCurrentTerm = () => api.get("/academics/terms/current/");

export const getForms = () => api.get("/academics/forms/");
export const getStreams = (params) => api.get("/academics/streams/", { params });
export const getClassrooms = (params) => api.get("/academics/classrooms/", { params });
export const getClassroomStudents = (id) => api.get(`/academics/classrooms/${id}/students/`);
export const getSubjects = (params) => api.get("/academics/subjects/", { params });

// ── TEACHERS ──────────────────────────────────────────────────────────────────
export const getTeachers = (params) => api.get("/teachers/", { params });
export const getTeacher = (id) => api.get(`/teachers/${id}/`);
export const createTeacher = (data) => api.post("/teachers/", data);
export const updateTeacher = (id, data) => api.patch(`/teachers/${id}/`, data);
export const deleteTeacher = (id) => api.delete(`/teachers/${id}/`);
export const getTeacherAllocations = (id) => api.get(`/teachers/${id}/allocations/`);
export const getMyAllocations = () => api.get("/teachers/my_allocations/");

export const getAllocations    = (params) => api.get("/allocations/", { params });
export const createAllocation  = (data)  => api.post("/allocations/", data);
export const deleteAllocation  = (id)    => api.delete(`/allocations/${id}/`);


// ── STUDENTS ──────────────────────────────────────────────────────────────────
export const getStudents = (params) => api.get("/students/", { params });
export const getArchivedStudents = (params) => api.get("/students/archive/", { params });
export const getStudent = (id) => api.get(`/students/${id}/`);
export const createStudent = (data) => api.post("/students/", data);
export const updateStudent = (id, data) => api.patch(`/students/${id}/`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}/`);
export const getStudentResults = (id, params) => api.get(`/students/${id}/results/`, { params });
export const getStudentFeeStatement = (id) => api.get(`/students/${id}/fee_statement/`);
export const getStudentClassHistory = (id) => api.get(`/students/${id}/class_history/`);
export const getMyStudentProfile = () => api.get("/students/me/");

// ── EXAMS & RESULTS ───────────────────────────────────────────────────────────
export const getExams = (params) => api.get("/exams/", { params });
export const getExam = (id) => api.get(`/exams/${id}/`);
export const createExam = (data) => api.post("/exams/", data);
export const updateExam = (id, data) => api.patch(`/exams/${id}/`, data);
export const publishExam = (id) => api.post(`/exams/${id}/publish/`);
export const getExamResults = (id, params) => api.get(`/exams/${id}/results/`, { params });
export const getExamRankings = (id) => api.get(`/exams/${id}/rankings/`);

export const submitBulkMarks = (data) => api.post("/marks/bulk/", data);
export const uploadMarksExcel = (formData, params) =>
  api.post("/marks/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params,
  });

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export const getAttendance = (params) => api.get("/attendance/", { params });
export const submitBulkAttendance = (data) => api.post("/attendance/bulk/", data);
export const getMyAttendance = (params) => api.get("/attendance/my_attendance/", { params });

// ── FEES ──────────────────────────────────────────────────────────────────────
export const getFeeStructures = (params) => api.get("/fees/structures/", { params });
export const createFeeStructure = (data) => api.post("/fees/structures/", data);
export const updateFeeStructure = (id, data) => api.patch(`/fees/structures/${id}/`, data);
export const deleteFeeStructure = (id) => api.delete(`/fees/structures/${id}/`);

export const getInvoices = (params) => api.get("/fees/invoices/", { params });
export const getMyInvoices = () => api.get("/fees/invoices/my_invoices/");
export const generateInvoicesForClassroom = (data) =>
  api.post("/fees/invoices/generate_for_classroom/", data);

export const getPayments = (params) => api.get("/fees/payments/", { params });
export const createPayment = (data) => api.post("/fees/payments/", data);
export const getMyPayments = () => api.get("/fees/payments/my_payments/");

// ── MPESA ─────────────────────────────────────────────────────────────────────
export const initiateStkPush = (data) => api.post("/fees/mpesa/stkpush/", data);
export const getMpesaTransactions = (params) =>
  api.get("/fees/mpesa/transactions/", { params });

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export const getMyNotifications = () => api.get("/notifications/my_notifications/");

// ── PROMOTIONS ────────────────────────────────────────────────────────────────
export const bulkPromote = (data) => api.post("/promotions/bulk_promote/", data);
export const getPromotions = (params) => api.get("/promotions/", { params });

// ── REPORTS ───────────────────────────────────────────────────────────────────
export const downloadReportCard = (studentId, examId) =>
  api.get(`/reports/reportcard/${studentId}/${examId}/`, { responseType: "blob" });

export const getStreamReport = (classroomId, examId) =>
  api.get(`/reports/stream/${classroomId}/${examId}/`);

// ── GRADING ───────────────────────────────────────────────────────────────────
export const getGradingScale = () => api.get("/exams/grading/");
export const seedDefaultGrading = () => api.post("/exams/grading/seed_defaults/");

export default api;