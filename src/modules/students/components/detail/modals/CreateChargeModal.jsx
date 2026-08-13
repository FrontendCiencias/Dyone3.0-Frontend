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
  isSuccess,
  errorMessage,
}) {
  const resolveConceptOptionValue = (concept) => concept?.id || concept?._id || concept?.code || concept?.name || "";
  const selectedConcept = billingConcepts.find(
    (concept) => String(resolveConceptOptionValue(concept)) === String(chargeForm.billingConceptId || ""),
  );
  const requiresCustomDescription = String(selectedConcept?.code || "").trim().toUpperCase() === "OTHER";

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Crear cargo"
      statusOverlay={isPending ? {
        state: "loading",
        title: "Creando cargo",
        message: "Registrando el nuevo cargo del alumno...",
      } : isSuccess ? {
        state: "success",
        title: "Cargo creado",
        message: "",
      } : errorMessage ? {
        state: "error",
        title: "No se pudo crear el cargo",
        message: errorMessage,
      } : null}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <Button
            onClick={onCreate}
            disabled={isPending || isSuccess || (requiresCustomDescription && !String(chargeForm.customDescription || "").trim())}
          >
            Crear cargo
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-5 text-sm text-gray-700">
        <label className="block text-sm font-medium text-gray-700">Concepto</label>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          value={chargeForm.billingConceptId}
          onChange={(e) => {
            const nextValue = e.target.value;
            const nextConcept = billingConcepts.find(
              (concept) => String(resolveConceptOptionValue(concept)) === String(nextValue),
            );
            const isOther = String(nextConcept?.code || "").trim().toUpperCase() === "OTHER";
            setChargeForm((prev) => ({
              ...prev,
              billingConceptId: nextValue,
              customDescription: isOther ? prev.customDescription : "",
            }));
          }}
        >
          <option value="">Selecciona un concepto</option>
          {billingConcepts.map((concept) => (
            <option key={resolveConceptOptionValue(concept)} value={resolveConceptOptionValue(concept)}>
              {concept.name || concept.code || concept.label || "Concepto"}
            </option>
          ))}
        </select>
        {requiresCustomDescription ? (
          <Input
            label="Descripción específica del cargo"
            value={chargeForm.customDescription || ""}
            maxLength={200}
            required
            placeholder="Ej.: Paseo de promoción"
            onChange={(e) => setChargeForm((prev) => ({ ...prev, customDescription: e.target.value }))}
          />
        ) : null}
        <Input
          label="Monto"
          type="number"
          min="0"
          value={chargeForm.amount}
          onChange={(e) => setChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(chargeForm.hasDueDate)}
            onChange={(e) =>
              setChargeForm((prev) => ({
                ...prev,
                hasDueDate: e.target.checked,
                dueDate: e.target.checked ? prev.dueDate : "",
              }))
            }
          />
          Definir fecha de vencimiento
        </label>
        {chargeForm.hasDueDate ? (
          <Input
            label="Fecha vencimiento"
            type="date"
            value={chargeForm.dueDate}
            onChange={(e) => setChargeForm((prev) => ({ ...prev, dueDate: e.target.value }))}
          />
        ) : (
          <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Si no defines vencimiento, el cargo vencerá en la fecha de creación.
          </p>
        )}
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
