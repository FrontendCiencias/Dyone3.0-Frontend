import React from "react";
import Button from "../../../../../components/ui/Button";
import Input from "../../../../../components/ui/Input";
import LoadingOverlay from "../../../../../shared/ui/LoadingOverlay";
import BaseModal from "../../../../../shared/ui/BaseModal";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";
import Spinner from "../../../../../shared/ui/Spinner";

export default function ConfirmEnrollmentModal({
  open,
  onClose,
  form,
  setForm,
  onConfirm,
  isPending,
  errorMessage,
}) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Confirmar matrícula"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isPending}>Cancelar</SecondaryButton>
          <Button onClick={onConfirm} disabled={isPending}>Confirmar matrícula</Button>
        </div>
      }
    >
      <div className="relative space-y-3 p-5">
        <Input
          label="Pensión mensual"
          type="number"
          min="0"
          value={form.monthlyFee}
          onChange={(e) => setForm((prev) => ({ ...prev, monthlyFee: e.target.value }))}
        />
        <label className="block text-sm font-medium text-gray-700">Descuentos / exoneraciones</label>
        <textarea
          value={form.discountsDescription}
          onChange={(e) => setForm((prev) => ({ ...prev, discountsDescription: e.target.value }))}
          className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
        <textarea
          value={form.observations}
          onChange={(e) => setForm((prev) => ({ ...prev, observations: e.target.value }))}
          className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        {errorMessage ? <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{errorMessage}</p> : null}
        <LoadingOverlay open={isPending}>
          <Spinner />
          <p className="mt-3 text-sm">Confirmando matrícula...</p>
        </LoadingOverlay>
      </div>
    </BaseModal>
  );
}
