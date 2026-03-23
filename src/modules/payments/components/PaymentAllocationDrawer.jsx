import React, { useEffect, useMemo, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import Input from "../../../components/ui/Input";
import { useCreatePaymentMutation } from "../hooks/useCreatePaymentMutation";
import { printPaymentReceipt } from "../services/paymentReceipt";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function todayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentTimestamp() {
  return new Date().toISOString();
}

function normalizeAmountInput(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export default function PaymentAllocationDrawer({
  open,
  onClose,
  student,
  charges = [],
  selectedAmounts = {},
  onChangeAmount,
  onRemoveCharge,
}) {
  const [useHistoricalReceipt, setUseHistoricalReceipt] = useState(false);
  const [paymentDate, setPaymentDate] = useState(todayDate());
  const [method, setMethod] = useState("CASH");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const createPaymentMutation = useCreatePaymentMutation(student?.id);

  useEffect(() => {
    if (!open) {
      setCreatedReceipt(null);
      return;
    }

    setUseHistoricalReceipt(false);
    setPaymentDate(todayDate());
    setMethod("CASH");
    setReceiptNumber("");
    setNotes("");
    setFormError("");
    setCreatedReceipt(null);
    createPaymentMutation.reset();
  }, [open]);

  const allocations = useMemo(
    () =>
      charges
        .map((charge) => ({
          chargeId: charge.id,
          amount: normalizeAmountInput(selectedAmounts[charge.id]),
          charge,
        }))
        .filter((row) => row.amount > 0),
    [charges, selectedAmounts],
  );

  const subtotal = useMemo(
    () => allocations.reduce((acc, row) => acc + row.amount, 0),
    [allocations],
  );

  const handleSubmit = async () => {
    if (!student?.id) {
      setFormError("No se pudo resolver el alumno.");
      return;
    }
    if (!allocations.length) {
      setFormError("Selecciona al menos un cargo con monto mayor a 0.");
      return;
    }

    for (const row of allocations) {
      const pending = Number(row.charge.outstandingAmount || 0);
      if (row.amount > pending) {
        setFormError(`El monto del cargo ${row.charge.concept || row.charge.id} no puede exceder el pendiente.`);
        return;
      }
    }

    setFormError("");
    const effectivePaymentDate = useHistoricalReceipt ? paymentDate : currentTimestamp();
    const result = await createPaymentMutation.mutateAsync({
      studentId: student.id,
      paidAt: effectivePaymentDate,
      method,
      receiptNumber: useHistoricalReceipt ? receiptNumber.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
      amount: subtotal,
      allocations: allocations.map((row) => ({
        chargeId: row.chargeId,
        amount: Number(row.amount.toFixed(2)),
      })),
    });

    const payment = result?.payment || {};
    const savedReceipt = {
      id: payment._id || payment.id || null,
      internalCode: payment.internalCode || "-",
      receiptNumber: payment.receiptNumber || null,
      date: payment.paidAt || effectivePaymentDate,
      method: payment.method || method,
      amount: Number(payment.totalAmount?.$numberDecimal || payment.totalAmount || subtotal || 0),
      note: payment.notes || notes || null,
      allocations: allocations.map((row) => ({
        chargeId: row.chargeId,
        amount: Number(row.amount.toFixed(2)),
        concept: row.charge.concept || row.charge.description || "Cargo",
        isPartial: Number(row.amount) < Number(row.charge.outstandingAmount || 0),
      })),
    };

    setCreatedReceipt(savedReceipt);
  };

  const handlePrint = () => {
    if (!createdReceipt) return;
    printPaymentReceipt({
      student,
      payment: createdReceipt,
    });
  };

  if (!open) return null;

  return (
    <Card className="border border-gray-200 shadow-sm xl:sticky xl:top-4">
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {createdReceipt ? "Pago registrado" : "Pago seleccionado"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {[student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno"} - DNI {student?.dni || "-"}
          </p>
        </div>
        <SecondaryButton onClick={() => onClose?.(Boolean(createdReceipt))}>Cerrar</SecondaryButton>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-3">
          {charges.map((charge) => {
            const pending = Number(charge.outstandingAmount || 0);
            const amount = selectedAmounts[charge.id] ?? pending;
            const normalizedAmount = normalizeAmountInput(amount);

            return (
              <div key={charge.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{charge.concept || "-"}</p>
                    <p className="text-xs text-gray-500">Pendiente: {formatMoney(pending)}</p>
                    <p className="text-xs text-gray-500">
                      Vence: {charge.dueDate ? String(charge.dueDate).slice(0, 10) : "-"}
                    </p>
                  </div>
                  {!createdReceipt ? (
                    <SecondaryButton className="px-2 py-1 text-xs" onClick={() => onRemoveCharge?.(charge.id)}>
                      Quitar
                    </SecondaryButton>
                  ) : null}
                </div>

                <div className="mt-3">
                  <Input
                    label="Monto a pagar"
                    type="number"
                    min="0"
                    max={pending}
                    step="0.01"
                    value={amount}
                    disabled={Boolean(createdReceipt)}
                    onChange={(e) => onChangeAmount?.(charge.id, e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {normalizedAmount > 0 && normalizedAmount < pending ? "Pago parcial" : "Pago completo"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm text-gray-500">Subtotal</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(subtotal)}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Metodo</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={method}
            disabled={Boolean(createdReceipt)}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="CASH">Efectivo</option>
            <option value="YAPE">Yape</option>
            <option value="TRANSFER">Transferencia</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={useHistoricalReceipt}
            disabled={Boolean(createdReceipt)}
            onChange={(e) => {
              const checked = e.target.checked;
              setUseHistoricalReceipt(checked);
              if (!checked) {
                setReceiptNumber("");
                setPaymentDate(todayDate());
              }
            }}
          />
          Recibo fisico anterior
        </label>

        {useHistoricalReceipt ? (
          <div className="space-y-3">
            <Input
              label="Numero de recibo"
              value={receiptNumber}
              disabled={Boolean(createdReceipt)}
              onChange={(e) => setReceiptNumber(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Ej: 003268"
            />
            <p className="-mt-2 text-xs text-gray-500">Si ingresas 3268 se guardara como 003268.</p>
            <Input
              label="Fecha del pago"
              type="date"
              value={paymentDate}
              disabled={Boolean(createdReceipt)}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2"
            value={notes}
            disabled={Boolean(createdReceipt)}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {createPaymentMutation.isError ? (
          <p className="text-sm text-red-600">
            {createPaymentMutation.error?.response?.data?.message || "No se pudo registrar el pago."}
          </p>
        ) : null}
        {createdReceipt ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Pago registrado. Codigo interno: <strong>{createdReceipt.internalCode}</strong>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
        {!createdReceipt ? (
          <>
            <SecondaryButton onClick={() => onClose?.(false)} disabled={createPaymentMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button onClick={handleSubmit} disabled={createPaymentMutation.isPending || !allocations.length}>
              {createPaymentMutation.isPending ? "Registrando..." : "Registrar pago"}
            </Button>
          </>
        ) : (
          <>
            <SecondaryButton onClick={() => onClose?.(true)}>Cerrar</SecondaryButton>
            <Button onClick={handlePrint}>Imprimir recibo</Button>
          </>
        )}
      </div>
    </Card>
  );
}
