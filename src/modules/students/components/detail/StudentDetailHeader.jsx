import React from "react";
import Button from "../../../../components/ui/Button";
import Card from "../../../../components/ui/Card";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";

export default function StudentDetailHeader({
  student,
  status,
  statusClassName,
  classroomName,
  fullName,
  showConfirmEnrollment,
  onConfirmEnrollment,
  onGoBack,
}) {
  return (
    <Card className="sticky top-0 z-20 border border-gray-200 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-600">
            {student.internalCode || "COD_SIN_ASIGNAR"} · DNI: {student.dni || "-"}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">Sede: {student.campusCode || "-"}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">Nivel: {student.level || "-"}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">Grado-Sección: {classroomName}</span>
            <span className={`rounded-full px-2 py-1 font-semibold ${statusClassName}`}>Estado: {status}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          {showConfirmEnrollment && <Button onClick={onConfirmEnrollment}>Confirmar matrícula</Button>}
          <SecondaryButton onClick={onGoBack}>Volver</SecondaryButton>
        </div>
      </div>
    </Card>
  );
}
