import React from "react";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import StudentPackageCard from "./StudentPackageCard";

export default function EnrollmentPackageList({ items = [], onRemove, onCreateStudent, onSearchStudent, classroomOptionsByStudent = {}, onChooseClassroom, onChangeCosts, studentSummaryById = {} }) {
  return (
    <Card className="space-y-3 border border-gray-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Paquete de alumnos por matricular</h3>
        <div className="flex gap-2">
          <SecondaryButton size="sm" onClick={onSearchStudent}>+ Buscar alumno</SecondaryButton>
          <SecondaryButton size="sm" onClick={onCreateStudent}>+ Crear nuevo alumno</SecondaryButton>
        </div>
      </div>

      {!items.length ? <p className="text-sm text-gray-500">Aún no hay alumnos en el paquete.</p> : null}

      <div className="space-y-2">
        {items.map((item) => (
          <StudentPackageCard
            key={item.id}
            item={item}
            classroomOptions={classroomOptionsByStudent[item.id] || []}
            onChooseClassroom={(classroomId, classroom) => onChooseClassroom?.(item.id, classroomId, classroom)}
            onRemove={() => onRemove?.(item.id)}
            onChangeCosts={(patch) => onChangeCosts?.(item.id, patch)}
            studentSummary={studentSummaryById[item.studentId]}
          />
        ))}
      </div>
    </Card>
  );
}
