export const GRADE_POINTS = {
  "A+": 12, A: 12, "B+": 11, B: 10, "C+": 9, C: 8,
  "D+": 7, D: 6, E: 5,
};

export const getGradeColor = (grade) => {
  if (!grade) return "secondary";
  const g = grade.toUpperCase();
  if (g === "A+" || g === "A") return "success";
  if (g.startsWith("B")) return "primary";
  if (g.startsWith("C")) return "warning";
  if (g.startsWith("D")) return "orange";
  return "danger";
};

export const getPointsFromGrade = (grade) => GRADE_POINTS[grade?.toUpperCase()] ?? 0;

export const getMeanGrade = (meanPoints) => {
  if (meanPoints >= 11) return "A";
  if (meanPoints >= 10) return "B+";
  if (meanPoints >= 9) return "B";
  if (meanPoints >= 8) return "C+";
  if (meanPoints >= 7) return "C";
  if (meanPoints >= 6) return "D+";
  if (meanPoints >= 5) return "D";
  return "E";
};

export const isGoodGrade = (grade) => ["A+", "A", "B+", "B"].includes(grade?.toUpperCase());

export const formatGradeDisplay = (grade, points) =>
  `${grade || "—"}${points != null ? ` (${points} pts)` : ""}`;