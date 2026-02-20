import React from "react";
import Card from "../../../../../components/ui/Card";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";

export default function StudentFamilyCard({ tutors, disabled, onManage }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Tutores y familia</h3>
        <SecondaryButton disabled={disabled} onClick={onManage}>
          Gestionar
        </SecondaryButton>
      </div>
      <div className="space-y-2 text-sm text-gray-700">
        {tutors.length ? (
          tutors.map((tutor, index) => (
            <div key={`${tutor.id || tutor._id || "tutor"}-${index}`} className="rounded-md border border-gray-200 p-3">
              <p className="font-medium text-gray-900">{tutor.isPrimary ? "Tutor principal" : `Tutor ${index + 1}`}</p>
              <p>{`${tutor.lastNames || ""}, ${tutor.names || ""}`.replace(/^,\s*/, "").trim() || "-"}</p>
              <p>Relación: {tutor.relationship || "-"}</p>
              <p>Teléfono: {(Array.isArray(tutor.phones) ? tutor.phones.filter(Boolean).join(" - ") : tutor.phone) || "-"}</p>
            </div>
          ))
        ) : (
          <p>Sin tutores vinculados.</p>
        )}
      </div>
    </Card>
  );
}
