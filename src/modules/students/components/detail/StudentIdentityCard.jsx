import React from "react";
import Card from "../../../../components/ui/Card";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";

export default function StudentIdentityCard({ student, disabled, onEdit }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Identidad</h3>
        <SecondaryButton disabled={disabled} onClick={onEdit}>
          Editar
        </SecondaryButton>
      </div>
      <div className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
        <p><span className="font-medium">Nombres:</span> {student.names || "-"}</p>
        <p><span className="font-medium">Apellidos:</span> {student.lastNames || "-"}</p>
        <p><span className="font-medium">DNI:</span> {student.dni || "-"}</p>
        <p><span className="font-medium">Código:</span> {student.internalCode || "-"}</p>
        <p><span className="font-medium">F. nacimiento:</span> {student.birthDate || "-"}</p>
        <p><span className="font-medium">Estado registro:</span> {student.isActive ? "Activo" : "Inactivo"}</p>
      </div>
    </Card>
  );
}
