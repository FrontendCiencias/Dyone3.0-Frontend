import React, { useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import Input from "../../../components/ui/Input";

function formatMethod(value) {
  if (value === "CASH") return "Efectivo";
  if (value === "YAPE") return "Yape";
  if (value === "TRANSFER") return "Transferencia";
  return value || "-";
}

function getErrorMessage(error) {
  const message = error?.response?.data?.message || error?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "No se pudo corregir el recibo.";
}

export default function CorrectPaymentReceiptModal({
  open,
  onClose,
  payment,
  onSave,
  isPending,
  isSuccess,
  error,
}) {
  const [form, setForm] = useState({
    method: payment?.method || "CASH",
    receiptNumber: payment?.receiptNumber || "",
    voucherNumber: payment?.voucherNumber || "",
    notes: payment?.note || "",
    correctionReason: "",
  });

  React.useEffect(() => {
    if (!open) return;
    setForm({
      method: payment?.method || "CASH",
      receiptNumber: payment?.receiptNumber || "",
      voucherNumber: payment?.voucherNumber || "",
      notes: payment?.note || "",
      correctionReason: "",
    });
  }, [open, payment]);

  const impactText = useMemo(() => {
    const previousMethod = String(payment?.method || "").toUpperCase();
    const nextMethod = String(form.method || "").toUpperCase();
    if (!previousMethod || previousMethod === nextMethod) return null;
    if (previousMethod === "CASH" && ["YAPE", "TRANSFER"].includes(nextMethod)) {
      return "Este pago dejará de contar como efectivo en caja y pasará a pagos no presenciales.";
    }
    if (["YAPE", "TRANSFER"].includes(previousMethod) && nextMethod === "CASH") {
      return "Este pago pasará a sumar dinero físico disponible en caja.";
    }
    return `El método cambiará de ${formatMethod(previousMethod)} a ${formatMethod(nextMethod)}.`;
  }, [form.method, payment?.method]);

  const canSave = Boolean(form.method && String(form.correctionReason || "").trim().length >= 5);

  return (
    <BaseModal
      open={open}
      onClose={isPending ? undefined : onClose}
      title="Corregir recibo"
      maxWidthClass="max-w-2xl"
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isPending}>Cancelar</SecondaryButton>
          <Button onClick={() => onSave?.(form)} disabled={isPending || isSuccess || !canSave}>
            {isPending ? "Guardando..." : "Guardar corrección"}
          </Button>
        </div>
      )}
    >
      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p><strong>Pago:</strong> {payment?.internalCode || "-"}</p>
          <p className="mt-1"><strong>Método actual:</strong> {formatMethod(payment?.method)}</p>
          <p className="mt-1"><strong>Monto:</strong> {payment?.amount ? `S/ ${Number(payment.amount).toFixed(2)}` : "-"}</p>
        </div>

        {impactText ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {impactText}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Método de pago</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={form.method}
            onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}
          >
            <option value="CASH">Efectivo</option>
            <option value="YAPE">Yape</option>
            <option value="TRANSFER">Transferencia</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Recibo físico"
            value={form.receiptNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, receiptNumber: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
            placeholder="Opcional"
          />
          <Input
            label="Voucher / operación"
            value={form.voucherNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, voucherNumber: e.target.value }))}
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Observación visible del recibo</label>
          <textarea
            className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Motivo de corrección</label>
          <textarea
            className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2"
            value={form.correctionReason}
            onChange={(e) => setForm((prev) => ({ ...prev, correctionReason: e.target.value }))}
            placeholder="Ej. Se registró como efectivo por error, el padre pagó por Yape."
          />
          <p className="mt-1 text-xs text-gray-500">Obligatorio. Se guardará en auditoría.</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(error)}
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}
