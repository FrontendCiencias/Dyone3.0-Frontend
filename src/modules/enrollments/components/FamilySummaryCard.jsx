import React from "react";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import FamilyAddressEditor from "../../families/components/FamilyAddressEditor";
import { getTutorFullName } from "../../families/domain/familyDisplay";

export default function FamilySummaryCard({ family, familyId, tutors = [], onEditTutor, onAddTutor, onFamilyAddressSaved }) {
  if (!family) {
    return (
      <Card className="border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600">
        Aún no hay familia seleccionada.
      </Card>
    );
  }

  const primaryTutor = family?.primaryTutor || family?.primaryTutor_send || {};

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Familia seleccionada</h3>
        <p className="text-sm text-gray-700">Tutor principal: {primaryTutor?.tutorPerson?.lastNames || "-"} {primaryTutor?.tutorPerson?.names || ""}</p>
        <p className="text-xs text-gray-500">DNI: {primaryTutor?.tutorPerson?.dni || "-"} · Tel: {primaryTutor?.tutorPerson?.phone || "-"}</p>

        <FamilyAddressEditor
          familyId={familyId}
          address={family?.address || family?.family?.address}
          autoEditIfEmpty
          onSaved={onFamilyAddressSaved}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-600">Tutores registrados: {tutors.length}</p>
            <SecondaryButton size="sm" onClick={onAddTutor}>Agregar tutor</SecondaryButton>
          </div>
          {!tutors.length ? <p className="text-xs text-amber-700">Sin tutores registrados.</p> : null}
          {tutors.map((tutor) => {
            const person = tutor?.tutorPerson || tutor?.person || {};
            return (
              <div key={tutor?.id || tutor?._id || tutor?.tutorId || getTutorFullName(tutor)} className="flex items-start justify-between gap-2 rounded border border-gray-200 p-2">
                <div>
                  <p className="text-sm text-gray-800">{getTutorFullName(tutor)}{tutor?.isPrimary ? " · Principal" : ""}</p>
                  <p className="text-xs text-gray-600">DNI: {person?.dni || "-"} · Tel: {person?.phone || "-"}</p>
                </div>
                <SecondaryButton size="sm" onClick={() => onEditTutor?.(tutor)}>Editar</SecondaryButton>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
