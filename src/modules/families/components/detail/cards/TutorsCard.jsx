import React from "react";
import Card from "../../../../../components/ui/Card";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";
import { getTutorFullName, getTutorId } from "../../../domain/familyDisplay";

export default function TutorsCard({ tutors = [], primaryTutorId, onMakePrimary, onEditTutor, onDeleteTutor }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">Tutores</h3>
      <div className="space-y-2 text-sm">
        {tutors.length ? tutors.map((tutor, index) => {
          const tutorId = getTutorId(tutor);
          const isPrimary = Boolean(tutor?.isPrimary) || String(tutorId) === String(primaryTutorId);

          return (
            <div key={`${tutorId || index}`} className="rounded-md border border-gray-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-gray-900">{getTutorFullName(tutor)}</p>
                {isPrimary ? (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Principal</span>
                ) : (
                  <SecondaryButton className="px-2 py-1 text-xs" onClick={() => onMakePrimary?.(tutor)}>
                    Hacer principal
                  </SecondaryButton>
                )}
              </div>
              <p>Relación: {tutor.relationship || "?"}</p>
              <p>DNI: {tutor.tutorPerson?.dni || "?"} · Celular: {tutor.tutorPerson?.phone || "?"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <SecondaryButton className="px-2 py-1 text-xs" onClick={() => onEditTutor?.(tutor)}>
                  Editar
                </SecondaryButton>
                <SecondaryButton className="px-2 py-1 text-xs" onClick={() => onDeleteTutor?.(tutor)}>
                  Eliminar
                </SecondaryButton>
              </div>
            </div>
          );
        }) : <p className="text-gray-500">Sin tutores registrados.</p>}
      </div>
    </Card>
  );
}
