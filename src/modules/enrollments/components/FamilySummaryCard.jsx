import React from "react";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";

export default function FamilySummaryCard({ family, onClear }) {
  if (!family) {
    return (
      <Card className="border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600">
        Aún no hay familia seleccionada.
      </Card>
    );
  }

  const primaryTutor = family?.primaryTutor || family?.primaryTutor_send || {};
  const otherTutors = Array.isArray(family?.otherTutors) ? family.otherTutors : [];
  const numberTutors = otherTutors.length + primaryTutor?.isPrimary ? 1 : 0 
  // console.log("[DBG] [numberTutors]: ",numberTutors)

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Familia seleccionada</h3>
          <p className="text-sm text-gray-700">Tutor principal: {primaryTutor?.tutorPerson?.lastNames || "-"} {primaryTutor?.tutorPerson?.names || ""}</p>
          <p className="text-xs text-gray-500">DNI: {primaryTutor?.tutorPerson?.dni || "-"} · Tel: {primaryTutor?.tutorPerson?.phone || "-"}</p>
          {numberTutors ? <p className="mt-1 text-xs text-gray-600">Tutores registrados: {numberTutors}</p> : <p className="mt-1 text-xs text-amber-700">Sin tutores registrados.</p>}
        </div>
        <SecondaryButton size="sm" onClick={onClear}>Cambiar</SecondaryButton>
      </div>
    </Card>
  );
}
