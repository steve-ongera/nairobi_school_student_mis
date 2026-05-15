export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const gradeColor = (grade) => {
  if (!grade) return "secondary";
  const g = grade.toUpperCase();
  if (g === "A" || g === "A+") return "success";
  if (g.startsWith("B")) return "primary";
  if (g.startsWith("C")) return "warning";
  if (g.startsWith("D")) return "orange";
  return "danger";
};

export const gradeClass = (grade) => {
  if (!grade) return "";
  const g = grade.toUpperCase().replace("+", "-plus").replace("-", "-minus");
  return `grade-${g.toLowerCase()}`;
};

export const statusBadge = (status) => {
  const map = {
    active: "success",
    inactive: "secondary",
    graduated: "info",
    transferred: "warning",
    expelled: "danger",
    paid: "success",
    partial: "warning",
    unpaid: "danger",
    overdue: "danger",
    pending: "warning",
    completed: "success",
    failed: "danger",
  };
  return map[status?.toLowerCase()] || "secondary";
};