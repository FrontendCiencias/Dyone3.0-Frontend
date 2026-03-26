import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";

export default function ActivityCollectModal({
  open,
  onClose,
  student,
  activity,
  onSubmit,
  submitting = false,
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(activity?.amount ? String(activity.amount) : "");
    setMethod("CASH");
    setNotes("");
    setError("");
  }, [open, activity]);

  const statusOverlay = useMemo(() => (
    submitting ? { state: "loading", title: "Registrando cobro..." } : null
  ), [submitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!student?.id) {
      setError("No se pudo resolver el alumno.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    try {
      await onSubmit?.({
        studentId: student.id,
        amount: Number(amount),
        method,
        notes: notes.trim(),
      });
    } catch (submitError) {
      const message = submitError?.response?.data?.message || submitError?.message || "No se pudo registrar el cobro.";
      setError(Array.isArray(message) ? message.join(". ") : message);
    }
  };

  const studentLabel = [student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno";

  return (
    <BaseModal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Registrar cobro"
      maxWidthClass="max-w-xl"
      statusOverlay={statusOverlay}
      footer={(
        <div className="flex items-center justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={submitting}>Cancelar</SecondaryButton>
          <Button type="submit" form="activity-collect-form" disabled={submitting}>Registrar cobro</Button>
        </div>
      )}
    >
      <form id="activity-collect-form" onSubmit={handleSubmit} className="grid gap-4 px-5 py-4">
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Alumno</p>
          <p className="mt-1 font-semibold text-gray-900">{studentLabel}</p>
          <p className="mt-1 text-xs text-gray-500">
            {student?.internalCode || "-"} · {student?.dni || "-"}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Monto" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Método</label>
            <select className="rounded border px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Efectivo</option>
              <option value="YAPE">Yape</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>
        </div>

        <Input label="Observaciones" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
      </form>
    </BaseModal>
  );
}
