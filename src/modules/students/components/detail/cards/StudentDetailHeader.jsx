import React from "react";
import Card from "../../../../../components/ui/Card";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";
import StudentsContextBar from "../../StudentsContextBar";
import { formatEducationLevel } from "../../../../../shared/domain/formatters.js/educationLevel";
import { formatEnrollmentStatus } from "../../../../../shared/domain/formatters.js/enrollmentStatus";

export default function StudentDetailHeader({
  status,
  campus,
  classroom,
  studentCode,
  studentDocument,
  onGoBack,
}) {
  const contextItems = [
    `Alumno: ${studentCode || "Sin código"}`,
    `DNI: ${studentDocument || "-"}`,
    `Campus: ${campus?.name || "-"}`,
    `Nivel: ${formatEducationLevel(classroom?.level) || "-"}`,
    `Grado: ${classroom?.grade || "-"}`,
    `Sección: ${classroom?.section || "-"}`,
    `Estado: ${formatEnrollmentStatus(status)}`,
  ];

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <StudentsContextBar items={contextItems} />
        </div>

        <div className="flex justify-end">
          <SecondaryButton className="w-full md:w-auto" onClick={onGoBack}>Volver</SecondaryButton>
        </div>
      </div>
    </Card>
  );
}
