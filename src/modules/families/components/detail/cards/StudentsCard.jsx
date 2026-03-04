import React from "react";
import Card from "../../../../../components/ui/Card";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";

function getStudentFullName(student) {
  return [student?.personId?.lastNames, student?.personId?.names].filter(Boolean).join(", ") || "Sin nombre";
}

export default function StudentsCard({ students = [], canUnlink = false, onUnlinkStudent, unlinkingStudentId = null }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">Hijos / alumnos vinculados</h3>
      <div className="space-y-2 text-sm">
        {students.length ? students.map((student, index) => {
          const studentId = student?.id || student?._id || student?.studentId || index;
          const isUnlinking = String(unlinkingStudentId || "") === String(studentId);

          return (
            <div key={studentId} className="rounded-md border border-gray-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>{getStudentFullName(student)} · DNI: {student?.personId?.dni || "-"}</p>
                {canUnlink ? (
                  <SecondaryButton
                    className="px-2 py-1 text-xs text-red-700 border-red-300 hover:bg-red-50"
                    onClick={() => onUnlinkStudent?.(student)}
                    disabled={isUnlinking}
                  >
                    {isUnlinking ? "Desvinculando..." : "Desvincular"}
                  </SecondaryButton>
                ) : null}
              </div>
            </div>
          );
        }) : <p className="text-gray-500">Sin alumnos vinculados.</p>}
      </div>
    </Card>
  );
}

export { getStudentFullName };
