// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { getAdminDashboard } from "../../utils/api";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import { PageTitle, LoadingSpinner, AlertMessage } from "../../components/common";

/* ─── Enhanced Stat Card with animation ─────────────────────────── */
function StatCard({ title, value, icon, color = "primary", subtitle, trend }) {
  const colorMap = {
    primary: { bg: "#dbeafe", icon: "#2563eb", text: "#1e40af", gradient: "linear-gradient(135deg, #2563eb, #3b82f6)" },
    success: { bg: "#d1fae5", icon: "#10b981", text: "#065f46", gradient: "linear-gradient(135deg, #10b981, #34d399)" },
    warning: { bg: "#fed7aa", icon: "#f59e0b", text: "#92400e", gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
    danger:  { bg: "#fee2e2", icon: "#ef4444", text: "#991b1b", gradient: "linear-gradient(135deg, #ef4444, #f87171)" },
    info:    { bg: "#cffafe", icon: "#06b6d4", text: "#155e75", gradient: "linear-gradient(135deg, #06b6d4, #22d3ee)" },
    purple:  { bg: "#ede9fe", icon: "#7c3aed", text: "#4c1d95", gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)" },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="stat-card-modern" style={{ borderLeft: `4px solid ${c.icon}` }}>
      <div className="stat-card-content">
        <div className="stat-icon" style={{ background: c.bg, color: c.icon }}>
          <i className={`bi ${icon}`} />
        </div>
        <div className="stat-info">
          <p className="stat-title">{title}</p>
          <h3 className="stat-value">{value ?? "—"}</h3>
          <div className="stat-footer">
            {trend !== undefined && (
              <span className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
                <i className={`bi bi-arrow-${trend >= 0 ? "up" : "down"}-short`} />
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle && <span className="stat-subtitle">{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="section-heading">
      <div>
        <h5 className="section-title">{title}</h5>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#7c3aed", "#06b6d4", "#ec4899", "#14b8a6"];

const customTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "rgba(255, 255, 255, 0.98)",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
    fontSize: 12,
    padding: "10px 14px",
  },
  labelStyle: { fontWeight: 600, color: "#0f172a", marginBottom: 6 },
  itemStyle: { padding: "2px 0" },
};

/* ─── Demo data ─────────────────────────────────────────────────── */
const DEMO = {
  active_students: 648,
  total_teachers: 42,
  total_classrooms: 28,
  collection_rate: 78.4,
  total_fees_expected: 5200000,
  total_fees_collected: 4076800,
  total_fees_outstanding: 1123200,
  current_academic_year: { year: "2024/2025", is_active: true },
  current_term: { term_number: 2, name: "Term 2" },
  recent_payments: [
    { id:1, invoice:{ student:1, student_name:"Alice Wanjiru", admission_no:"S001" }, transaction_reference:"QBK7821X", payment_method:"MPESA", amount:12000, payment_date:"2025-05-10T09:30:00", confirmed:true },
    { id:2, invoice:{ student:2, student_name:"Brian Otieno", admission_no:"S002"  }, transaction_reference:"QBL9234Y", payment_method:"MPESA", amount:8500,  payment_date:"2025-05-09T14:12:00", confirmed:true },
    { id:3, invoice:{ student:3, student_name:"Carol Muthoni", admission_no:"S003" }, transaction_reference:"QBM1023Z", payment_method:"Bank",  amount:15000, payment_date:"2025-05-08T11:00:00", confirmed:false },
    { id:4, invoice:{ student:4, student_name:"David Kamau", admission_no:"S004"   }, transaction_reference:"QBN3347W", payment_method:"MPESA", amount:9000,  payment_date:"2025-05-07T16:45:00", confirmed:true },
    { id:5, invoice:{ student:5, student_name:"Esther Wambui", admission_no:"S005" }, transaction_reference:"QBP9812V", payment_method:"Cash",  amount:11000, payment_date:"2025-05-06T10:20:00", confirmed:true },
  ],
  students_per_form: [
    { form: "Form 1", count: 180, boys: 98, girls: 82 },
    { form: "Form 2", count: 162, boys: 85, girls: 77 },
    { form: "Form 3", count: 155, boys: 79, girls: 76 },
    { form: "Form 4", count: 151, boys: 80, girls: 71 },
  ],
  monthly_revenue: [
    { month:"Jan",revenue:380000,expenses:210000 },{ month:"Feb",revenue:420000,expenses:225000 },
    { month:"Mar",revenue:510000,expenses:240000 },{ month:"Apr",revenue:390000,expenses:230000 },
    { month:"May",revenue:450000,expenses:245000 },{ month:"Jun",revenue:600000,expenses:260000 },
    { month:"Jul",revenue:540000,expenses:250000 },{ month:"Aug",revenue:490000,expenses:240000 },
    { month:"Sep",revenue:520000,expenses:255000 },{ month:"Oct",revenue:560000,expenses:265000 },
    { month:"Nov",revenue:610000,expenses:270000 },{ month:"Dec",revenue:700000,expenses:290000 },
  ],
  attendance_week: [
    { day:"Mon",present:620,absent:28,late:12 },
    { day:"Tue",present:615,absent:33,late:8 },
    { day:"Wed",present:630,absent:18,late:5 },
    { day:"Thu",present:608,absent:40,late:10 },
    { day:"Fri",present:595,absent:53,late:15 },
  ],
  fee_breakdown: [
    { name:"Tuition",    value: 2400000, percentage: 58.8 },
    { name:"Boarding",   value: 876800,  percentage: 21.5 },
    { name:"Activity",   value: 420000,  percentage: 10.3 },
    { name:"Transport",  value: 380000,  percentage: 9.4 },
  ],
  grade_distribution: [
    { grade: "A", count: 45, percentage: 12 },
    { grade: "B", count: 98, percentage: 26 },
    { grade: "C", count: 142, percentage: 38 },
    { grade: "D", count: 67, percentage: 18 },
    { grade: "E", count: 22, percentage: 6 },
  ],
  notifications: [
    { icon:"bi-cash-coin",    color:"success", title:"Fee payment received", msg:"KES 15,000 from Alice Wanjiru", time:"5 minutes ago" },
    { icon:"bi-journal-check",color:"primary", title:"Exam results published", msg:"End Term 1 – Form 2 results are out", time:"2 hours ago" },
    { icon:"bi-person-plus",  color:"warning", title:"New student admitted",  msg:"James Kipchoge added to Form 1A", time:"Yesterday" },
    { icon:"bi-calendar-check",color:"info", title:"Parent meeting scheduled", msg:"Form 4 parents meeting on May 20", time:"Yesterday" },
  ],
  quick_actions: [
    { to:"/admin/students/new",              icon:"bi-person-plus",       label:"Admit Student", color:"primary" },
    { to:"/admin/exams/new",                 icon:"bi-journal-plus",       label:"Create Exam", color:"success" },
    { to:"/admin/finance/invoices/generate", icon:"bi-receipt",            label:"Invoices", color:"warning" },
    { to:"/admin/students/promote",          icon:"bi-arrow-up-circle",    label:"Promote", color:"info" },
    { to:"/admin/teachers/new",              icon:"bi-person-badge",       label:"Add Teacher", color:"purple" },
    { to:"/admin/attendance",                icon:"bi-calendar-check",     label:"Attendance", color:"primary" },
    { to:"/admin/finance/mpesa",             icon:"bi-phone",              label:"MPESA", color:"success" },
    { to:"/admin/settings/grading",          icon:"bi-gear",               label:"Settings", color:"secondary" },
  ],
  upcoming_events: [
    { title:"Mid-Term Exams", date:"May 25, 2025", type:"exam", icon:"bi-journal-bookmark-fill" },
    { title:"Sports Day", date:"May 30, 2025", type:"event", icon:"bi-trophy-fill" },
    { title:"Fee Deadline", date:"June 5, 2025", type:"deadline", icon:"bi-cash-stack" },
  ],
};

/* ─── Main component ────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => {
        setData(DEMO);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard…" />;
  if (error) return <AlertMessage type="danger" message={error} />;
  if (!data) return null;

  const d = { ...DEMO, ...data };
  const collRate = parseFloat(d.collection_rate || 0);

  return (
    <div className="admin-dashboard-modern">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <div>
            <h1 className="welcome-title">
              Welcome back, Admin
            </h1>
            <p className="welcome-subtitle">
              Here's what's happening with your school today.
            </p>
          </div>
          <div className="date-badge">
            <i className="bi bi-calendar-week"></i>
            <span>{new Date().toLocaleDateString("en-KE", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}</span>
          </div>
        </div>
        <div className="academic-badge">
          <i className="bi bi-mortarboard"></i>
          <div>
            <span className="academic-year">{d.current_academic_year?.year}</span>
            <span className="academic-term">• {d.current_term?.name || `Term ${d.current_term?.term_number}`}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="stat-grid">
        <StatCard 
          title="Active Students" 
          value={d.active_students.toLocaleString()} 
          icon="bi-people-fill" 
          color="primary" 
          subtitle="Enrolled this year" 
          trend={4.2} 
        />
        <StatCard 
          title="Teachers" 
          value={d.total_teachers} 
          icon="bi-person-badge-fill" 
          color="success" 
          subtitle="Active staff" 
          trend={1.1} 
        />
        <StatCard 
          title="Classrooms" 
          value={d.total_classrooms} 
          icon="bi-building" 
          color="warning" 
          subtitle="In use" 
          trend={0} 
        />
        <StatCard 
          title="Collection Rate" 
          value={`${collRate.toFixed(1)}%`} 
          icon="bi-cash-coin" 
          color={collRate >= 80 ? "success" : collRate >= 60 ? "warning" : "danger"} 
          subtitle="Fee collection" 
          trend={collRate >= 80 ? 3.5 : -2.1} 
        />
      </div>

      {/* Tabs Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="bi bi-speedometer2"></i> Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <i className="bi bi-cash-stack"></i> Finance
        </button>
        <button 
          className={`tab-btn ${activeTab === 'academics' ? 'active' : ''}`}
          onClick={() => setActiveTab('academics')}
        >
          <i className="bi bi-journal-bookmark-fill"></i> Academics
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <>
            {/* Fee Summary & Students Distribution */}
            <div className="row g-4">
              <div className="col-lg-5">
                <div className="modern-card">
                  <div className="card-header-custom">
                    <h6 className="card-title-custom">Fee Summary</h6>
                    <Link to="/admin/finance" className="link-custom">View All →</Link>
                  </div>
                  <div className="card-body-custom">
                    <div className="fee-summary">
                      <div className="fee-item expected">
                        <span>Expected</span>
                        <strong>{formatCurrency(d.total_fees_expected)}</strong>
                      </div>
                      <div className="fee-item collected">
                        <span>Collected</span>
                        <strong>{formatCurrency(d.total_fees_collected)}</strong>
                      </div>
                      <div className="fee-item outstanding">
                        <span>Outstanding</span>
                        <strong className="text-danger">{formatCurrency(d.total_fees_outstanding)}</strong>
                      </div>
                    </div>
                    
                    <div className="progress-section">
                      <div className="progress-label">
                        <span>Collection Progress</span>
                        <strong>{collRate.toFixed(1)}%</strong>
                      </div>
                      <div className="progress-bar-custom">
                        <div className="progress-fill" style={{ width: `${Math.min(collRate, 100)}%` }}></div>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={d.fee_breakdown} 
                          dataKey="value" 
                          nameKey="name"
                          cx="50%" 
                          cy="50%" 
                          innerRadius={40} 
                          outerRadius={65}
                          paddingAngle={2}
                        >
                          {d.fee_breakdown.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip {...customTooltip} formatter={(v) => formatCurrency(v)} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="modern-card">
                  <div className="card-header-custom">
                    <h6 className="card-title-custom">Students by Form</h6>
                    <Link to="/admin/students" className="link-custom">Manage →</Link>
                  </div>
                  <div className="card-body-custom">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={d.students_per_form} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="form" tick={{ fontSize: 12, fill: "#64748b" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                        <Tooltip {...customTooltip} />
                        <Bar dataKey="count" name="Students" radius={[8, 8, 0, 0]} fill="#2563eb">
                          {d.students_per_form.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Attendance & Grade Distribution */}
            <div className="row g-4 mt-2">
              <div className="col-lg-7">
                <div className="modern-card">
                  <div className="card-header-custom">
                    <h6 className="card-title-custom">Weekly Attendance</h6>
                    <span className="badge-modern">This Week</span>
                  </div>
                  <div className="card-body-custom">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={d.attendance_week} margin={{ top:5, right:10, left:-20, bottom:5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill:"#64748b" }} />
                        <YAxis tick={{ fontSize: 11, fill:"#64748b" }} />
                        <Tooltip {...customTooltip} />
                        <Bar dataKey="present" name="Present" fill="#10b981" radius={[6,6,0,0]} />
                        <Bar dataKey="absent"  name="Absent"  fill="#ef4444" radius={[6,6,0,0]} />
                        <Bar dataKey="late"    name="Late"    fill="#f59e0b" radius={[6,6,0,0]} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="modern-card">
                  <div className="card-header-custom">
                    <h6 className="card-title-custom">Grade Distribution</h6>
                    <span className="badge-modern">Term 1</span>
                  </div>
                  <div className="card-body-custom">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={d.grade_distribution}
                          dataKey="count"
                          nameKey="grade"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          label={({ grade, percentage }) => `${grade} (${percentage}%)`}
                          labelLine={false}
                        >
                          {d.grade_distribution.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i]} strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip {...customTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'finance' && (
          <>
            {/* Revenue Trend */}
            <div className="modern-card full-width">
              <div className="card-header-custom">
                <h6 className="card-title-custom">Annual Revenue vs Expenses</h6>
                <div className="legend-inline">
                  <span><i className="bi bi-circle-fill" style={{ color: "#2563eb" }}></i> Revenue</span>
                  <span><i className="bi bi-circle-fill" style={{ color: "#ef4444" }}></i> Expenses</span>
                </div>
              </div>
              <div className="card-body-custom">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={d.monthly_revenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip {...customTooltip} formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revenueGradient)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#expenseGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Sources */}
            <div className="row g-4 mt-2">
              {d.fee_breakdown.map((source, i) => (
                <div className="col-md-3" key={source.name}>
                  <div className="revenue-card" style={{ borderTopColor: CHART_COLORS[i] }}>
                    <i className="bi bi-wallet2" style={{ color: CHART_COLORS[i] }}></i>
                    <h6>{source.name}</h6>
                    <h4>{formatCurrency(source.value)}</h4>
                    <span className="percentage">{source.percentage}% of total</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'academics' && (
          <>
            {/* Exam Performance Radar */}
            <div className="modern-card">
              <div className="card-header-custom">
                <h6 className="card-title-custom">Subject Performance Overview</h6>
              </div>
              <div className="card-body-custom">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: "Math", A: 85, fullMark: 100 },
                    { subject: "English", A: 78, fullMark: 100 },
                    { subject: "Kiswahili", A: 82, fullMark: 100 },
                    { subject: "Science", A: 88, fullMark: 100 },
                    { subject: "History", A: 75, fullMark: 100 },
                    { subject: "Geography", A: 79, fullMark: 100 },
                  ]}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Average Score" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                    <Tooltip {...customTooltip} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Payments & Notifications Row */}
      <div className="row g-4 mt-3">
        <div className="col-lg-8">
          <div className="modern-card">
            <div className="card-header-custom">
              <h6 className="card-title-custom">Recent Payments</h6>
              <Link to="/admin/finance/payments" className="link-custom">View All →</Link>
            </div>
            <div className="card-body-custom p-0">
              <div className="table-responsive-modern">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Admission No.</th>
                      <th>Reference</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(d.recent_payments || []).map((p) => (
                      <tr key={p.id}>
                        <td className="student-name">{p.invoice?.student_name}</td>
                        <td className="admission-no">{p.invoice?.admission_no}</td>
                        <td><code className="ref-code">{p.transaction_reference}</code></td>
                        <td>
                          <span className={`method-badge ${p.payment_method.toLowerCase()}`}>
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="amount">{formatCurrency(p.amount)}</td>
                        <td className="date">{formatDateTime(p.payment_date)}</td>
                        <td>
                          <span className={`status-badge ${p.confirmed ? 'confirmed' : 'pending'}`}>
                            {p.confirmed ? "Confirmed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="modern-card">
            <div className="card-header-custom">
              <h6 className="card-title-custom">Recent Notifications</h6>
              <i className="bi bi-bell-fill" style={{ color: "#2563eb" }}></i>
            </div>
            <div className="card-body-custom p-0">
              <div className="notifications-list">
                {d.notifications.map((n, i) => (
                  <div className="notification-item" key={i}>
                    <div className={`notification-icon ${n.color}`}>
                      <i className={`bi ${n.icon}`} />
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{n.title}</div>
                      <div className="notification-message">{n.msg}</div>
                      <div className="notification-time">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events & Quick Actions */}
      <div className="row g-4 mt-3">
        <div className="col-lg-4">
          <div className="modern-card">
            <div className="card-header-custom">
              <h6 className="card-title-custom">Upcoming Events</h6>
              <i className="bi bi-calendar-event-fill" style={{ color: "#f59e0b" }}></i>
            </div>
            <div className="card-body-custom p-0">
              <div className="events-list">
                {d.upcoming_events.map((event, i) => (
                  <div className="event-item" key={i}>
                    <div className={`event-icon ${event.type}`}>
                      <i className={`bi ${event.icon}`} />
                    </div>
                    <div className="event-details">
                      <div className="event-title">{event.title}</div>
                      <div className="event-date">
                        <i className="bi bi-calendar3"></i> {event.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="modern-card">
            <div className="card-header-custom">
              <h6 className="card-title-custom">Quick Actions</h6>
              <span className="text-muted small">Common tasks</span>
            </div>
            <div className="card-body-custom">
              <div className="quick-actions-grid">
                {d.quick_actions.map((action) => (
                  <Link to={action.to} className="action-btn" key={action.to}>
                    <i className={`bi ${action.icon}`}></i>
                    <span>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Modern Dashboard Styles */
        .admin-dashboard-modern {
          animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .welcome-banner {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          border-radius: 24px;
          padding: 28px 32px;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
          color: white;
        }
        
        .welcome-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .welcome-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          position: relative;
          z-index: 1;
        }
        
        .welcome-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: white;
        }
        
        .welcome-subtitle {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
        }
        
        .date-badge {
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          padding: 8px 18px;
          border-radius: 40px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .academic-badge {
          position: absolute;
          bottom: 20px;
          right: 32px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          padding: 8px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }
        
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }
        
        .stat-card-modern {
          background: white;
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
        }
        
        .stat-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }
        
        .stat-card-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .stat-info {
          flex: 1;
        }
        
        .stat-title {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin: 0 0 4px 0;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          font-family: 'Inter', sans-serif;
        }
        
        .stat-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
        }
        
        .stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-weight: 600;
        }
        
        .stat-trend.positive { color: #10b981; }
        .stat-trend.negative { color: #ef4444; }
        
        .stat-subtitle {
          color: #94a3b8;
        }
        
        .dashboard-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 28px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
        }
        
        .tab-btn {
          padding: 10px 24px;
          border: none;
          background: transparent;
          font-weight: 600;
          color: #64748b;
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .tab-btn:hover {
          color: #2563eb;
          background: #eff6ff;
        }
        
        .tab-btn.active {
          color: #2563eb;
          background: #eff6ff;
        }
        
        .modern-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .modern-card.full-width {
          grid-column: 1 / -1;
        }
        
        .card-header-custom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #fafbfc;
        }
        
        .card-title-custom {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: #0f172a;
        }
        
        .link-custom {
          font-size: 13px;
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }
        
        .link-custom:hover {
          text-decoration: underline;
        }
        
        .card-body-custom {
          padding: 20px 24px;
        }
        
        .fee-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        
        .fee-item {
          text-align: center;
          padding: 12px;
          border-radius: 12px;
        }
        
        .fee-item.expected { background: #eff6ff; }
        .fee-item.collected { background: #ecfdf5; }
        .fee-item.outstanding { background: #fef2f2; }
        
        .fee-item span {
          font-size: 12px;
          color: #64748b;
          display: block;
          margin-bottom: 6px;
        }
        
        .fee-item strong {
          font-size: 18px;
          font-weight: 800;
        }
        
        .progress-section {
          margin-bottom: 20px;
        }
        
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
        }
        
        .progress-bar-custom {
          height: 8px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #3b82f6);
          border-radius: 10px;
          transition: width 0.5s ease;
        }
        
        .badge-modern {
          background: #e2e8f0;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
        }
        
        .legend-inline {
          display: flex;
          gap: 16px;
          font-size: 12px;
        }
        
        .revenue-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          transition: all 0.3s ease;
          border-top: 3px solid;
        }
        
        .revenue-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
        
        .revenue-card i {
          font-size: 32px;
          margin-bottom: 10px;
          display: block;
        }
        
        .revenue-card h6 {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin: 0 0 8px 0;
        }
        
        .revenue-card h4 {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }
        
        .revenue-card .percentage {
          font-size: 11px;
          color: #94a3b8;
        }
        
        .table-responsive-modern {
          overflow-x: auto;
        }
        
        .table-modern {
          width: 100%;
          border-collapse: collapse;
        }
        
        .table-modern thead th {
          text-align: left;
          padding: 14px 16px;
          background: #f8fafc;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .table-modern tbody td {
          padding: 14px 16px;
          font-size: 13px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .student-name {
          font-weight: 600;
          color: #0f172a;
        }
        
        .admission-no {
          color: #64748b;
          font-size: 12px;
        }
        
        .ref-code {
          font-size: 11px;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 6px;
          font-family: monospace;
        }
        
        .method-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .method-badge.mpesa {
          background: #ecfdf5;
          color: #10b981;
        }
        
        .method-badge.bank {
          background: #eff6ff;
          color: #2563eb;
        }
        
        .method-badge.cash {
          background: #fef3c7;
          color: #f59e0b;
        }
        
        .amount {
          font-weight: 700;
          color: #10b981;
        }
        
        .date {
          font-size: 11px;
          color: #94a3b8;
        }
        
        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .status-badge.confirmed {
          background: #ecfdf5;
          color: #10b981;
        }
        
        .status-badge.pending {
          background: #fef3c7;
          color: #f59e0b;
        }
        
        .notifications-list {
          display: flex;
          flex-direction: column;
        }
        
        .notification-item {
          display: flex;
          gap: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }
        
        .notification-item:hover {
          background: #fafbfc;
        }
        
        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .notification-icon.success {
          background: #ecfdf5;
          color: #10b981;
        }
        
        .notification-icon.primary {
          background: #eff6ff;
          color: #2563eb;
        }
        
        .notification-icon.warning {
          background: #fef3c7;
          color: #f59e0b;
        }
        
        .notification-icon.info {
          background: #cffafe;
          color: #06b6d4;
        }
        
        .notification-content {
          flex: 1;
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 13px;
          color: #0f172a;
          margin-bottom: 4px;
        }
        
        .notification-message {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }
        
        .notification-time {
          font-size: 10px;
          color: #94a3b8;
        }
        
        .events-list {
          display: flex;
          flex-direction: column;
        }
        
        .event-item {
          display: flex;
          gap: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .event-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        
        .event-icon.exam {
          background: #eff6ff;
          color: #2563eb;
        }
        
        .event-icon.event {
          background: #ecfdf5;
          color: #10b981;
        }
        
        .event-icon.deadline {
          background: #fef3c7;
          color: #f59e0b;
        }
        
        .event-title {
          font-weight: 600;
          font-size: 13px;
          color: #0f172a;
          margin-bottom: 4px;
        }
        
        .event-date {
          font-size: 11px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        
        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px 12px;
          background: #f8fafc;
          border-radius: 16px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
        }
        
        .action-btn i {
          font-size: 24px;
          color: #2563eb;
        }
        
        .action-btn span {
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
        }
        
        .action-btn:hover {
          transform: translateY(-4px);
          background: #2563eb;
          border-color: #2563eb;
        }
        
        .action-btn:hover i,
        .action-btn:hover span {
          color: white;
        }
        
        @media (max-width: 768px) {
          .welcome-banner {
            padding: 20px;
          }
          .welcome-title {
            font-size: 22px;
          }
          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .card-header-custom {
            padding: 14px 18px;
          }
          .card-body-custom {
            padding: 16px 18px;
          }
        }
      `}} />
    </div>
  );
}