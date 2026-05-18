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

// =============================================================================
// AUTH
// =============================================================================

export const login          = (email, password) => api.post("/auth/login/", { email, password });
export const logout         = (refresh)          => api.post("/auth/logout/", { refresh });
export const getMe          = ()                 => api.get("/auth/me/");
export const updateMe       = (data)             => api.patch("/auth/me/", data);
export const changePassword = (data)             => api.post("/auth/change-password/", data);

// =============================================================================
// DASHBOARD
// =============================================================================

export const getAdminDashboard   = () => api.get("/dashboard/admin/");
export const getTeacherDashboard = () => api.get("/dashboard/teacher/");
export const getStudentDashboard = () => api.get("/dashboard/student/");

// =============================================================================
// ACADEMIC STRUCTURE
// =============================================================================

export const getAcademicYears   = (params)    => api.get("/academics/years/", { params });
export const getCurrentYear     = ()          => api.get("/academics/years/current/");
export const createAcademicYear = (data)      => api.post("/academics/years/", data);
export const updateAcademicYear = (id, data)  => api.patch(`/academics/years/${id}/`, data);
export const deleteAcademicYear = (id)        => api.delete(`/academics/years/${id}/`);

export const getTerms       = (params)    => api.get("/academics/terms/", { params });
export const getCurrentTerm = ()          => api.get("/academics/terms/current/");
export const createTerm     = (data)      => api.post("/academics/terms/", data);
export const updateTerm     = (id, data)  => api.patch(`/academics/terms/${id}/`, data);
export const deleteTerm     = (id)        => api.delete(`/academics/terms/${id}/`);

export const getForms   = (params)    => api.get("/academics/forms/", { params });
export const createForm = (data)      => api.post("/academics/forms/", data);
export const updateForm = (id, data)  => api.patch(`/academics/forms/${id}/`, data);
export const deleteForm = (id)        => api.delete(`/academics/forms/${id}/`);

export const getStreams   = (params)    => api.get("/academics/streams/", { params });
export const createStream = (data)     => api.post("/academics/streams/", data);
export const updateStream = (id, data) => api.patch(`/academics/streams/${id}/`, data);
export const deleteStream = (id)       => api.delete(`/academics/streams/${id}/`);

export const getClassrooms        = (params)    => api.get("/academics/classrooms/", { params });
export const getClassroom         = (id)        => api.get(`/academics/classrooms/${id}/`);
export const createClassroom      = (data)      => api.post("/academics/classrooms/", data);
export const updateClassroom      = (id, data)  => api.patch(`/academics/classrooms/${id}/`, data);
export const deleteClassroom      = (id)        => api.delete(`/academics/classrooms/${id}/`);
export const getClassroomStudents = (id)        => api.get(`/academics/classrooms/${id}/students/`);

export const getSubjects   = (params)    => api.get("/academics/subjects/", { params });
export const getSubject    = (id)        => api.get(`/academics/subjects/${id}/`);
export const createSubject = (data)      => api.post("/academics/subjects/", data);
export const updateSubject = (id, data)  => api.patch(`/academics/subjects/${id}/`, data);
export const deleteSubject = (id)        => api.delete(`/academics/subjects/${id}/`);

// =============================================================================
// TEACHERS
// =============================================================================

export const getTeachers   = (params)    => api.get("/teachers/", { params });
export const getTeacher    = (id)        => api.get(`/teachers/${id}/`);
export const createTeacher = (data)      => api.post("/teachers/", data);
export const updateTeacher = (id, data)  => api.patch(`/teachers/${id}/`, data);
export const deleteTeacher = (id)        => api.delete(`/teachers/${id}/`);

/** GET /api/teachers/{id}/allocations/ — all allocations for a specific teacher (admin) */
export const getTeacherAllocations = (id) => api.get(`/teachers/${id}/allocations/`);

/** GET /api/teachers/my_allocations/ — allocations for the logged-in teacher */
export const getMyAllocations = () => api.get("/teachers/my_allocations/");

// Subject allocations CRUD  →  /api/allocations/
export const getAllocations    = (params)    => api.get("/allocations/", { params });
export const createAllocation  = (data)     => api.post("/allocations/", data);
export const updateAllocation  = (id, data) => api.patch(`/allocations/${id}/`, data);
export const deleteAllocation  = (id)       => api.delete(`/allocations/${id}/`);

// =============================================================================
// PARENTS
// =============================================================================

export const getParents   = (params)    => api.get("/parents/", { params });
export const getParent    = (id)        => api.get(`/parents/${id}/`);
export const createParent = (data)      => api.post("/parents/", data);
export const updateParent = (id, data)  => api.patch(`/parents/${id}/`, data);
export const deleteParent = (id)        => api.delete(`/parents/${id}/`);

// =============================================================================
// STUDENTS
// =============================================================================

export const getStudents            = (params)     => api.get("/students/", { params });
export const getArchivedStudents    = (params)     => api.get("/students/archive/", { params });
export const getStudent             = (id)         => api.get(`/students/${id}/`);
export const createStudent          = (data)       => api.post("/students/", data);
export const updateStudent          = (id, data)   => api.patch(`/students/${id}/`, data);
export const deleteStudent          = (id)         => api.delete(`/students/${id}/`);
export const getStudentResults      = (id, params) => api.get(`/students/${id}/results/`, { params });
export const getStudentFeeStatement = (id)         => api.get(`/students/${id}/fee_statement/`);
export const getStudentClassHistory = (id)         => api.get(`/students/${id}/class_history/`);
export const getMyStudentProfile    = ()           => api.get("/students/me/");

// =============================================================================
// EXAMS
// =============================================================================

export const getExams    = (params)    => api.get("/exams/", { params });
export const getExam     = (id)        => api.get(`/exams/${id}/`);
export const createExam  = (data)      => api.post("/exams/", data);
export const updateExam  = (id, data)  => api.patch(`/exams/${id}/`, data);
export const deleteExam  = (id)        => api.delete(`/exams/${id}/`);
export const publishExam = (id)        => api.post(`/exams/${id}/publish/`);

/**
 * GET /api/exams/{examId}/results/?classroom=<id>
 *
 * Fetch results scoped to a KNOWN exam ID.
 * Used on: exam detail page, stream report view.
 *
 * ✅ Correct:   getExamResultsById(42)
 * ✅ Correct:   getExamResultsById(42, { classroom: 7 })
 * ❌ Wrong:     getExamResultsById({ exam: 42, subject: 3 })  ← use getResultsByFilter()
 */
export const getExamResultsById = (examId, params) => {
  if (!examId || typeof examId === "object") {
    const msg =
      "[api] getExamResultsById() needs a numeric examId as first argument.\n" +
      "For filtering by exam+subject without a URL segment, use getResultsByFilter({ exam, subject }).";
    console.error(msg);
    return Promise.reject(new Error(msg));
  }
  return api.get(`/exams/${examId}/results/`, { params });
};

/**
 * GET /api/results/?exam=<id>&subject=<id>&student=<id>…
 *
 * Query the flat results list with any combination of filter params.
 * Used by MarksEntry to pre-fill existing marks for an exam + subject combo.
 *
 * ✅ Correct:   getResultsByFilter({ exam: 42, subject: 3 })
 * ✅ Correct:   getResultsByFilter({ student: 5 })
 */
export const getResultsByFilter = (params) => api.get("/results/", { params });

/**
 * @deprecated  Renamed to getExamResultsById() to prevent passing an object as examId.
 *              Replace all usages: getExamResults(id, p) → getExamResultsById(id, p)
 */
export const getExamResults = (examId, params) => {
  if (!examId || typeof examId === "object") {
    const msg =
      "[api] getExamResults() — DEPRECATED & called with wrong args.\n" +
      "Pass a numeric examId, or switch to getResultsByFilter({ exam, subject }).";
    console.error(msg);
    return Promise.reject(new Error(msg));
  }
  console.warn("[api] getExamResults() is deprecated. Use getExamResultsById() instead.");
  return api.get(`/exams/${examId}/results/`, { params });
};

export const getExamRankings = (id) => api.get(`/exams/${id}/rankings/`);

// =============================================================================
// MARKS
// =============================================================================

export const submitBulkMarks = (data) => api.post("/marks/bulk/", data);

export const uploadMarksExcel = (formData, params) =>
  api.post("/marks/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params,
  });

// =============================================================================
// GRADING SCALE
// =============================================================================

export const getGradingScale    = (params)    => api.get("/exams/grading/", { params });
export const createGradingScale = (data)      => api.post("/exams/grading/", data);
export const updateGradingScale = (id, data)  => api.patch(`/exams/grading/${id}/`, data);
export const deleteGradingScale = (id)        => api.delete(`/exams/grading/${id}/`);
export const seedDefaultGrading = ()          => api.post("/exams/grading/seed_defaults/");

// =============================================================================
// ATTENDANCE
// =============================================================================

export const getAttendance        = (params)    => api.get("/attendance/", { params });
export const createAttendance     = (data)      => api.post("/attendance/", data);
export const updateAttendance     = (id, data)  => api.patch(`/attendance/${id}/`, data);
export const deleteAttendance     = (id)        => api.delete(`/attendance/${id}/`);
export const submitBulkAttendance = (data)      => api.post("/attendance/bulk/", data);
export const getMyAttendance      = (params)    => api.get("/attendance/my_attendance/", { params });

// =============================================================================
// FEES — STRUCTURES
// =============================================================================

export const getFeeStructures   = (params)    => api.get("/fees/structures/", { params });
export const getFeeStructure    = (id)        => api.get(`/fees/structures/${id}/`);
export const createFeeStructure = (data)      => api.post("/fees/structures/", data);
export const updateFeeStructure = (id, data)  => api.patch(`/fees/structures/${id}/`, data);
export const deleteFeeStructure = (id)        => api.delete(`/fees/structures/${id}/`);

// =============================================================================
// FEES — INVOICES
// =============================================================================

export const getInvoices    = (params)    => api.get("/fees/invoices/", { params });
export const getInvoice     = (id)        => api.get(`/fees/invoices/${id}/`);
export const createInvoice  = (data)      => api.post("/fees/invoices/", data);
export const updateInvoice  = (id, data)  => api.patch(`/fees/invoices/${id}/`, data);
export const getMyInvoices  = ()          => api.get("/fees/invoices/my_invoices/");
export const generateInvoicesForClassroom = (data) =>
  api.post("/fees/invoices/generate_for_classroom/", data);

// =============================================================================
// FEES — PAYMENTS
// =============================================================================

export const getPayments   = (params)    => api.get("/fees/payments/", { params });
export const getPayment    = (id)        => api.get(`/fees/payments/${id}/`);
export const createPayment = (data)      => api.post("/fees/payments/", data);
export const updatePayment = (id, data)  => api.patch(`/fees/payments/${id}/`, data);
export const getMyPayments = ()          => api.get("/fees/payments/my_payments/");

// =============================================================================
// MPESA
// =============================================================================

export const initiateStkPush      = (data)   => api.post("/fees/mpesa/stkpush/", data);
export const getMpesaTransactions = (params) => api.get("/fees/mpesa/transactions/", { params });

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export const getNotifications   = (params) => api.get("/notifications/", { params });
export const createNotification = (data)   => api.post("/notifications/", data);
export const getMyNotifications = ()       => api.get("/notifications/my_notifications/");

// =============================================================================
// PROMOTIONS
// =============================================================================

export const getPromotions = (params) => api.get("/promotions/", { params });
export const bulkPromote   = (data)   => api.post("/promotions/bulk_promote/", data);

// =============================================================================
// REPORTS / PDF
// =============================================================================

/**
 * Returns a Blob — consume with URL.createObjectURL():
 *   const { data } = await downloadReportCard(studentId, examId);
 *   const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
 *   window.open(url);
 */
export const downloadReportCard = (studentId, examId) =>
  api.get(`/reports/reportcard/${studentId}/${examId}/`, { responseType: "blob" });

export const getStreamReport = (classroomId, examId) =>
  api.get(`/reports/stream/${classroomId}/${examId}/`);

// =============================================================================
// USERS  (admin only)
// =============================================================================

export const getUsers   = (params)    => api.get("/users/", { params });
export const getUser    = (id)        => api.get(`/users/${id}/`);
export const createUser = (data)      => api.post("/users/", data);
export const updateUser = (id, data)  => api.patch(`/users/${id}/`, data);
export const deleteUser = (id)        => api.delete(`/users/${id}/`);

export default api;