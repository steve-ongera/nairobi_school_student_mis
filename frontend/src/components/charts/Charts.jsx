import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, PieChart, Pie, Cell, Legend,
} from "recharts";

const getBarColor = (marks) => {
  if (marks >= 80) return "#2eca6a";
  if (marks >= 60) return "#4154f1";
  if (marks >= 50) return "#ff771d";
  return "#dc3545";
};

export function GradeBarChart({ results = [] }) {
  const data = results.map((r) => ({
    subject: (r.subject_name || r.subject_code || "").substring(0, 10),
    marks: parseFloat(r.marks) || 0,
    grade: r.grade,
  }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ebeef4" />
        <XAxis dataKey="subject" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip
          formatter={(v, _, props) => [`${v} (${props.payload.grade})`, "Marks"]}
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
        />
        <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getBarColor(entry.marks)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FeePaymentChart({ payments = [] }) {
  const grouped = payments.reduce((acc, p) => {
    const month = new Date(p.payment_date).toLocaleDateString("en-KE", { month: "short", year: "2-digit" });
    acc[month] = (acc[month] || 0) + parseFloat(p.amount || 0);
    return acc;
  }, {});
  const data = Object.entries(grouped).map(([month, amount]) => ({ month, amount }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ebeef4" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v) => [`KES ${v.toLocaleString()}`, "Amount"]}
          contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
        />
        <Line type="monotone" dataKey="amount" stroke="#4154f1" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PerformanceTrend({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ebeef4" />
        <XAxis dataKey="exam" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} />
        <ReferenceLine y={50} stroke="#dc3545" strokeDasharray="4 2" label={{ value: "Pass", position: "right", fontSize: 11 }} />
        <Line type="monotone" dataKey="mean" name="Mean Score" stroke="#2eca6a" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const ATT_COLORS = { present: "#2eca6a", absent: "#dc3545", late: "#ff771d", sick: "#4154f1" };

export function AttendanceDonut({ present = 0, absent = 0, late = 0, sick = 0 }) {
  const total = present + absent + late + sick;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const data = [
    { name: "Present", value: present, color: ATT_COLORS.present },
    { name: "Absent", value: absent, color: ATT_COLORS.absent },
    { name: "Late", value: late, color: ATT_COLORS.late },
    { name: "Sick", value: sick, color: ATT_COLORS.sick },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value">
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 22, fontWeight: 800, fill: pct >= 80 ? "#2eca6a" : "#dc3545" }}>
          {pct}%
        </text>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ClassPerformanceChart({ results = [] }) {
  const data = results.map((r) => ({
    subject: (r.subject_name || "").substring(0, 10),
    mean: parseFloat(r.mean_score) || 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
      <BarChart layout="vertical" data={data} margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ebeef4" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="subject" tick={{ fontSize: 11 }} width={60} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} />
        <Bar dataKey="mean" name="Mean Score" fill="#4154f1" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={getBarColor(entry.mean)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}