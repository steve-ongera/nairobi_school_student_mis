// frontend/src/pages/student/results/Results.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks";
import api from "../../../utils/api";

export const MyResults = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudentResults();
  }, []);

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/students/${user?.id}/results`);
      setExams(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError("Failed to load results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading your results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Exam Results</h1>
      
      {exams.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No exam results available yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2">{exam.name}</h3>
              <p className="text-gray-600 mb-1">Term: {exam.term}</p>
              <p className="text-gray-600 mb-4">Year: {exam.year}</p>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-bold">
                  Total: {exam.total_marks || 0}
                </span>
                <a
                  href={`/student/results/${exam.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ReportCard = () => {
  const { user } = useAuth();
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    fetchReportCard();
  }, [selectedTerm, selectedYear]);

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedTerm) params.term = selectedTerm;
      if (selectedYear) params.year = selectedYear;
      
      const response = await api.get(`/students/${user?.id}/report-card`, { params });
      setReportCard(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching report card:", err);
      setError("Failed to load report card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    alert("PDF download feature will be implemented here");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading report card...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Report Card</h1>
        <div className="space-x-2">
          <button
            onClick={handlePrint}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Print
          </button>
          <button
            onClick={handleDownload}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="">All Terms</option>
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </div>

      {reportCard ? (
        <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none">
          {/* Report Card Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">{reportCard.school_name || "Nairobi School"}</h2>
            <h3 className="text-lg mt-2">Student Report Card</h3>
          </div>

          {/* Student Info */}
          <div className="border-b pb-4 mb-4">
            <p><strong>Name:</strong> {reportCard.student_name}</p>
            <p><strong>Admission Number:</strong> {reportCard.admission_number}</p>
            <p><strong>Class:</strong> {reportCard.class_name}</p>
            <p><strong>Term:</strong> {reportCard.term} | <strong>Year:</strong> {reportCard.year}</p>
          </div>

          {/* Results Table */}
          <table className="min-w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Subject</th>
                <th className="border p-2">Score</th>
                <th className="border p-2">Grade</th>
                <th className="border p-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {reportCard.subjects?.map((subject, index) => (
                <tr key={index}>
                  <td className="border p-2">{subject.name}</td>
                  <td className="border p-2 text-center">{subject.score}</td>
                  <td className="border p-2 text-center">{subject.grade}</td>
                  <td className="border p-2">{subject.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p><strong>Total Marks:</strong> {reportCard.total_marks}</p>
            <p><strong>Average:</strong> {reportCard.average}%</p>
            <p><strong>Position:</strong> {reportCard.position}</p>
            <p><strong>Grade:</strong> {reportCard.overall_grade}</p>
            <p><strong>Class Teacher's Remarks:</strong> {reportCard.remarks}</p>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No report card data available for the selected period.
        </div>
      )}
    </div>
  );
};