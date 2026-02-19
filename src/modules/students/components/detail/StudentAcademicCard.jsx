import React from "react";
import Card from "../../../../components/ui/Card";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";

export default function StudentAcademicCard({ enrollmentStatus, status, canChangeClassroom, onChangeClassroom }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Estado académico</h3>
      <div className="space-y-2 text-sm text-gray-700">
        <p>Ciclo actual: {enrollmentStatus.cycleName || enrollmentStatus.cycle?.name || "-"}</p>
        <p>Aula actual: {enrollmentStatus.classroomName || enrollmentStatus.classroom?.displayName || "-"}</p>
        <p>Estado: {status}</p>
      </div>
      <div className="mt-3">
        <SecondaryButton disabled={!canChangeClassroom} onClick={onChangeClassroom}>
          Cambiar aula
        </SecondaryButton>
      </div>
    </Card>
  );
}
