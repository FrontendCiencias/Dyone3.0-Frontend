import React from "react";
import Card from "../../../../../components/ui/Card";

function getStudentFullName(student) {
  return [student?.personId?.lastNames, student?.personId?.names].filter(Boolean).join(", ") || "Sin nombre";
}

export default function StudentsCard({ students = [] }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">Hijos / alumnos vinculados</h3>
      <div className="space-y-2 text-sm">
        {students.length ? students.map((student, index) => {
          const studentId = student?.id || student?._id || student?.studentId || index;
          return (
            <div key={studentId} className="rounded-md border border-gray-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>{getStudentFullName(student)} · DNI: {student?.personId?.dni || "-"}</p>
              </div>
            </div>
          );
        }) : <p className="text-gray-500">Sin alumnos vinculados.</p>}
      </div>
    </Card>
  );
}

export { getStudentFullName };
