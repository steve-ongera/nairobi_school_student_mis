import { useState } from "react";
import { getClassrooms } from "../../../utils/api";
import { useFetch } from "../../../hooks";
import { PageTitle, DataTable, AlertMessage } from "../../../components/common";

export function ClassroomList() {
  const { data: classrooms, loading, error } = useFetch(() => getClassrooms());

  const columns = [
    { header: "Classroom", render: (c) => <strong>{c.stream_display}</strong> },
    { header: "Form", key: "form_name" },
    { header: "Stream", key: "stream_name" },
    { header: "Year", key: "academic_year_display" },
    { header: "Class Teacher", render: (c) => c.class_teacher_name || "—" },
    { header: "Students", render: (c) => (
      <span className="badge bg-primary">{c.student_count}</span>
    )},
  ];

  return (
    <>
      <PageTitle title="Classrooms" breadcrumbs={[{ label: "Academics" }, { label: "Classrooms" }]} />
      {error && <AlertMessage type="danger" message={error} />}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">All Classrooms</h5>
          <DataTable columns={columns} data={classrooms} loading={loading} emptyMessage="No classrooms configured." />
        </div>
      </div>
    </>
  );
}