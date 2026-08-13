import React, { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import BaseModal from "../../../shared/ui/BaseModal";
import SecondaryButton from "../../../shared/ui/SecondaryButton";

export default function EditChargeModal({
  open,
  onClose,
  charge,
  onSave,
  onDelete,
  isSaving,
  isSaveSuccess,
  saveErrorMessage,
  isDeleting,
  isDeleteSuccess,
  deleteErrorMessage,
}) {
  const [form, setForm] = useState({
    amount: "",
    dueDate: "",
    customDescription: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      amount: charge?.amount ? String(charge.amount) : "",
      dueDate: charge?.dueDate ? String(charge.dueDate).slice(0, 10) : "",
      customDescription: charge?.customDescription || "",
    });
  }, [open, charge]);

  const isPending = isSaving || isDeleting;
  const isSuccess = isSaveSuccess || isDeleteSuccess;
  const errorMessage = deleteErrorMessage || saveErrorMessage || "";
  const requiresCustomDescription = String(charge?.conceptCode || "").trim().toUpperCase() === "OTHER";

  const statusOverlay = isDeleting
    ? {
        state: "loading",
        title: "Eliminando cargo",
        message: "Quitando el cargo del estado de cuenta...",
      }
    : isSaving
      ? {
          state: "loading",
          title: "Guardando cambios",
          message: "Actualizando el cargo...",
        }
      : isDeleteSuccess
        ? {
            state: "success",
            title: "Cargo eliminado",
            message: "",
          }
        : isSaveSuccess
          ? {
              state: "success",
              title: "Cargo actualizado",
              message: "",
            }
          : errorMessage
            ? {
                state: "error",
                title: isDeleting ? "No se pudo eliminar" : "No se pudo actualizar",
                message: errorMessage,
              }
            : null;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Editar cargo"
      statusOverlay={statusOverlay}
      footer={(
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onDelete?.()}
            disabled={isPending || isSuccess}
          >
            {isDeleting ? "Eliminando..." : "Eliminar cargo"}
          </button>
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <Button
            onClick={() => onSave?.(form)}
            disabled={isPending || isSuccess || (requiresCustomDescription && !String(form.customDescription || "").trim())}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      )}
    >
      <div className="space-y-3 p-5 text-sm text-gray-700">
        <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span className="font-medium">Concepto:</span> {charge?.concept || "-"}
        </p>
        <Input
          label="Monto"
          type="number"
          min="0"
          value={form.amount}
          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
        />
        <Input
          label="Fecha de vencimiento"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
        />
        {requiresCustomDescription ? (
          <Input
            label="Descripción específica del cargo"
            value={form.customDescription}
            maxLength={200}
            required
            onChange={(e) => setForm((prev) => ({ ...prev, customDescription: e.target.value }))}
          />
        ) : null}
      </div>
    </BaseModal>
  );
}
