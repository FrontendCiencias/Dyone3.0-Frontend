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

  const tutor = family?.primaryTutor || family?.primaryTutor_send || {};
  const tutors = Array.isArray(family?.tutors) ? family.tutors : [];

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Familia seleccionada</h3>
          <p className="text-sm text-gray-700">Tutor principal: {tutor?.lastNames || "-"} {tutor?.names || ""}</p>
          <p className="text-xs text-gray-500">DNI: {tutor?.dni || "-"} · Tel: {tutor?.phone || "-"}</p>
          {tutors.length ? <p className="mt-1 text-xs text-gray-600">Tutores registrados: {tutors.length}</p> : <p className="mt-1 text-xs text-amber-700">Sin tutores registrados.</p>}
        </div>
        <SecondaryButton size="sm" onClick={onClear}>Cambiar</SecondaryButton>
      </div>
    </Card>
  );
}
