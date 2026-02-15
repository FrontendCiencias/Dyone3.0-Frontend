import React from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import Button from "../../../components/ui/Button";
import { ENROLLMENT_CASE_MONTHS } from "../domain/enrollmentCaseValidation";

export default function MonthlyPensionEditor({ open, onClose, values = [], onChange }) {
  const safeValues = Array.isArray(values) ? values : [];

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Personalizar pensiones (Mar-Dic)"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
          <Button onClick={onClose}>Listo</Button>
        </div>
      }
    >
      <div className="grid gap-3 p-5 md:grid-cols-2">
        {ENROLLMENT_CASE_MONTHS.map((label, index) => {
          const value = Number(safeValues[index]);
          const isNoAplica = value === -1;

          return (
            <label key={label} className="rounded-lg border border-gray-200 p-3 text-sm">
              <p className="mb-2 font-medium text-gray-800">{label}</p>
              {isNoAplica ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  No aplica
                </div>
              ) : (
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={Number.isFinite(value) ? value : 0}
                  onChange={(e) => onChange?.(index, Number(e.target.value))}
                />
              )}
            </label>
          );
        })}
      </div>
    </BaseModal>
  );
}
