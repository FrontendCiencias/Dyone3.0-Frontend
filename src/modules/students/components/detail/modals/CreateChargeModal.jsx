import React from "react";
import Button from "../../../../../components/ui/Button";
import Input from "../../../../../components/ui/Input";
import BaseModal from "../../../../../shared/ui/BaseModal";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";

export default function CreateChargeModal({
  open,
  onClose,
  chargeForm,
  setChargeForm,
  billingConcepts,
  onCreate,
  isPending,
  errorMessage,
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Crear cargo"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isPending}>Cancelar</SecondaryButton>
          <Button onClick={onCreate} disabled={isPending}>Crear cargo</Button>
        </div>
      }
    >
      <div className="space-y-3 p-5 text-sm text-gray-700">
        <label className="block text-sm font-medium text-gray-700">Concepto</label>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          value={chargeForm.billingConceptId}
          onChange={(e) => setChargeForm((prev) => ({ ...prev, billingConceptId: e.target.value }))}
        >
          <option value="">Selecciona un concepto</option>
          {billingConcepts.map((concept) => (
            <option key={concept.id} value={concept.id}>
              {concept.name || concept.code || concept.label || "Concepto"}
            </option>
          ))}
        </select>
        <Input
          label="Monto"
          type="number"
          min="0"
          value={chargeForm.amount}
          onChange={(e) => setChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
        />
        <Input
          label="Fecha vencimiento"
          type="date"
          value={chargeForm.dueDate}
          onChange={(e) => setChargeForm((prev) => ({ ...prev, dueDate: e.target.value }))}
        />
        <label className="block text-sm font-medium text-gray-700">Observación</label>
        <textarea
          value={chargeForm.observation}
          onChange={(e) => setChargeForm((prev) => ({ ...prev, observation: e.target.value }))}
          className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        {errorMessage ? <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{errorMessage}</p> : null}
      </div>
    </BaseModal>
  );
}
