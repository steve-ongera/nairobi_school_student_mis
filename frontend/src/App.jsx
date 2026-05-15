import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks";
import Layout from "./components/layout/Layout";
import RequireAuth from "./components/layout/RequireAuth";

import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";

import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentList from "./pages/admin/students/StudentList";
import StudentDetail from "./pages/admin/students/StudentDetail";
import StudentForm from "./pages/admin/students/StudentForm";
import StudentPromotion from "./pages/admin/students/StudentPromotion";
import StudentImport from "./pages/admin/students/StudentImport";
import { ClassroomList, SubjectList, AcademicYearList } from "./pages/admin/academics/Academics";
import ExamList from "./pages/admin/exams/ExamList";
import ExamForm from "./pages/admin/exams/ExamForm";
import { ExamResults, GradingSettings } from "./pages/admin/exams/ExamSettings";
import ReportCards from "./pages/admin/exams/ReportCards";
import { TeacherList, TeacherForm, SubjectAllocation } from "./pages/admin/teachers/Teachers";
import { InvoiceList, PaymentList, FeeStructurePage, MpesaReconcile } from "./pages/admin/finance/Finance";
import FinanceReports from "./pages/admin/finance/FinanceReports";
import AttendanceList from "./pages/admin/attendance/AttendanceList";
import AttendanceReport from "./pages/admin/attendance/AttendanceReport";
import SchoolSettings from "./pages/admin/settings/SchoolSettings";

import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import MySubjects from "./pages/teacher/marks/MySubjects";
import MarksEntry from "./pages/teacher/marks/MarksEntry";
import MarksUpload from "./pages/teacher/marks/MarksUpload";
import ClassAnalysis from "./pages/teacher/marks/ClassAnalysis";
import TakeAttendance from "./pages/teacher/attendance/TakeAttendance";
import StreamReport from "./pages/teacher/reports/StreamReport";

import StudentDashboard from "./pages/student/StudentDashboard";
import { MyResults, ReportCard } from "./pages/student/results/Results";
import ResultDetail from "./pages/student/results/ResultDetail";
import FeeStatement from "./pages/student/fees/FeeStatement";
import PayFee from "./pages/student/fees/PayFee";
import PaymentHistory from "./pages/student/fees/PaymentHistory";
import MyAttendance from "./pages/student/attendance/MyAttendance";
import MyProfile from "./pages/student/profile/MyProfile";

import ProfilePage from "./pages/profile/ProfilePage";
import ChangePassword from "./pages/profile/ChangePassword";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  finance: "/admin/finance/invoices",
  parent: "/student/dashboard",
};

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<RootRedirect />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        {/* Shared */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<RequireAuth allowedRoles={["admin"]}><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/students" element={<RequireAuth allowedRoles={["admin", "teacher"]}><StudentList /></RequireAuth>} />
        <Route path="/admin/students/new" element={<RequireAuth allowedRoles={["admin"]}><StudentForm /></RequireAuth>} />
        <Route path="/admin/students/promote" element={<RequireAuth allowedRoles={["admin"]}><StudentPromotion /></RequireAuth>} />
        <Route path="/admin/students/import" element={<RequireAuth allowedRoles={["admin"]}><StudentImport /></RequireAuth>} />
        <Route path="/admin/students/:id" element={<RequireAuth allowedRoles={["admin", "teacher"]}><StudentDetail /></RequireAuth>} />
        <Route path="/admin/students/:id/edit" element={<RequireAuth allowedRoles={["admin"]}><StudentForm /></RequireAuth>} />

        <Route path="/admin/academics/years" element={<RequireAuth allowedRoles={["admin"]}><AcademicYearList /></RequireAuth>} />
        <Route path="/admin/academics/classrooms" element={<RequireAuth allowedRoles={["admin"]}><ClassroomList /></RequireAuth>} />
        <Route path="/admin/academics/subjects" element={<RequireAuth allowedRoles={["admin"]}><SubjectList /></RequireAuth>} />

        <Route path="/admin/exams" element={<RequireAuth allowedRoles={["admin"]}><ExamList /></RequireAuth>} />
        <Route path="/admin/exams/new" element={<RequireAuth allowedRoles={["admin"]}><ExamForm /></RequireAuth>} />
        <Route path="/admin/exams/:id/edit" element={<RequireAuth allowedRoles={["admin"]}><ExamForm /></RequireAuth>} />
        <Route path="/admin/exams/:id/results" element={<RequireAuth allowedRoles={["admin", "teacher"]}><ExamResults /></RequireAuth>} />
        <Route path="/admin/exams/report-cards" element={<RequireAuth allowedRoles={["admin"]}><ReportCards /></RequireAuth>} />

        <Route path="/admin/teachers" element={<RequireAuth allowedRoles={["admin"]}><TeacherList /></RequireAuth>} />
        <Route path="/admin/teachers/new" element={<RequireAuth allowedRoles={["admin"]}><TeacherForm /></RequireAuth>} />
        <Route path="/admin/teachers/allocations" element={<RequireAuth allowedRoles={["admin"]}><SubjectAllocation /></RequireAuth>} />
        <Route path="/admin/teachers/:id" element={<RequireAuth allowedRoles={["admin"]}><TeacherList /></RequireAuth>} />
        <Route path="/admin/teachers/:id/edit" element={<RequireAuth allowedRoles={["admin"]}><TeacherForm /></RequireAuth>} />

        <Route path="/admin/finance/fee-structure" element={<RequireAuth allowedRoles={["admin", "finance"]}><FeeStructurePage /></RequireAuth>} />
        <Route path="/admin/finance/invoices" element={<RequireAuth allowedRoles={["admin", "finance"]}><InvoiceList /></RequireAuth>} />
        <Route path="/admin/finance/payments" element={<RequireAuth allowedRoles={["admin", "finance"]}><PaymentList /></RequireAuth>} />
        <Route path="/admin/finance/mpesa" element={<RequireAuth allowedRoles={["admin", "finance"]}><MpesaReconcile /></RequireAuth>} />
        <Route path="/admin/finance/reports" element={<RequireAuth allowedRoles={["admin", "finance"]}><FinanceReports /></RequireAuth>} />

        <Route path="/admin/attendance" element={<RequireAuth allowedRoles={["admin"]}><AttendanceList /></RequireAuth>} />
        <Route path="/admin/attendance/report" element={<RequireAuth allowedRoles={["admin"]}><AttendanceReport /></RequireAuth>} />

        <Route path="/admin/settings/school" element={<RequireAuth allowedRoles={["admin"]}><SchoolSettings /></RequireAuth>} />
        <Route path="/admin/settings/grading" element={<RequireAuth allowedRoles={["admin"]}><GradingSettings /></RequireAuth>} />

        {/* Teacher */}
        <Route path="/teacher/dashboard" element={<RequireAuth allowedRoles={["teacher"]}><TeacherDashboard /></RequireAuth>} />
        <Route path="/teacher/marks/subjects" element={<RequireAuth allowedRoles={["teacher"]}><MySubjects /></RequireAuth>} />
        <Route path="/teacher/marks/entry" element={<RequireAuth allowedRoles={["teacher", "admin"]}><MarksEntry /></RequireAuth>} />
        <Route path="/teacher/marks/upload" element={<RequireAuth allowedRoles={["teacher", "admin"]}><MarksUpload /></RequireAuth>} />
        <Route path="/teacher/marks/analysis" element={<RequireAuth allowedRoles={["teacher", "admin"]}><ClassAnalysis /></RequireAuth>} />
        <Route path="/teacher/attendance" element={<RequireAuth allowedRoles={["teacher", "admin"]}><TakeAttendance /></RequireAuth>} />
        <Route path="/teacher/reports/stream" element={<RequireAuth allowedRoles={["teacher", "admin"]}><StreamReport /></RequireAuth>} />

        {/* Student */}
        <Route path="/student/dashboard" element={<RequireAuth allowedRoles={["student", "parent"]}><StudentDashboard /></RequireAuth>} />
        <Route path="/student/results" element={<RequireAuth allowedRoles={["student"]}><MyResults /></RequireAuth>} />
        <Route path="/student/results/:examId" element={<RequireAuth allowedRoles={["student"]}><ResultDetail /></RequireAuth>} />
        <Route path="/student/results/report-card" element={<RequireAuth allowedRoles={["student"]}><ReportCard /></RequireAuth>} />
        <Route path="/student/fees/statement" element={<RequireAuth allowedRoles={["student"]}><FeeStatement /></RequireAuth>} />
        <Route path="/student/fees/pay" element={<RequireAuth allowedRoles={["student"]}><PayFee /></RequireAuth>} />
        <Route path="/student/fees/payments" element={<RequireAuth allowedRoles={["student"]}><PaymentHistory /></RequireAuth>} />
        <Route path="/student/attendance" element={<RequireAuth allowedRoles={["student"]}><MyAttendance /></RequireAuth>} />
        <Route path="/student/profile" element={<RequireAuth allowedRoles={["student"]}><MyProfile /></RequireAuth>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}