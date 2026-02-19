import React from "react";
import Card from "../../../../components/ui/Card";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";
import { formatEnrollmentStatus } from "../../../../shared/domain/formatters.js/enrollmentStatus";

export default function StudentAcademicCard({ enrollmentStatus, status, canChangeClassroom, onChangeClassroom }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Estado académico</h3>
        <SecondaryButton disabled={!canChangeClassroom} onClick={onChangeClassroom}>
          Cambiar aula
        </SecondaryButton>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        <p><span className="font-medium">Estado:</span> {formatEnrollmentStatus(status)}</p>
        <p><span className="font-medium">Aula actual:</span> {enrollmentStatus.classroomName || enrollmentStatus.classroom?.displayName || "-"}</p>
      </div>
      <div className="mt-3">
        
      </div>
    </Card>
  );
}
