import React from "react";
import BaseModal from "../../../../../shared/ui/BaseModal";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";

function tutorFullName(tutor = {}) {
  const names = String(tutor.names || "").trim();
  const lastNames = String(tutor.lastNames || "").trim();
  return [lastNames, names].filter(Boolean).join(", ") || "-";
}

export default function TutorsManageModal({ open, onClose, tutors }) {
  const list = Array.isArray(tutors) ? tutors : [];

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Gestionar tutores"
      footer={
        <div className="flex justify-end">
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
        </div>
      }
    >
      <div className="space-y-3 p-5">
        {!list.length && <p className="text-sm text-gray-600">No hay tutores registrados.</p>}

        {list.map((tutor, index) => (
          <div key={`${tutor.id || tutor._id || "tutor"}-${index}`} className="rounded-lg border border-gray-200 p-3 text-sm">
            <p className="font-semibold text-gray-900">{tutorFullName(tutor)}</p>
            <p className="text-gray-600">Relación: {tutor.relationship || "-"}</p>
            <p className="text-gray-600">Teléfonos: {Array.isArray(tutor.phones) ? tutor.phones.filter(Boolean).join(" - ") : tutor.phone || "-"}</p>
            {tutor.isPrimary && (
              <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                Principal
              </span>
            )}
          </div>
        ))}

        <p className="text-xs text-gray-500">TODO: agregar/editar/marcar principal cuando se conecten endpoints de tutores.</p>
      </div>
    </BaseModal>
  );
}
