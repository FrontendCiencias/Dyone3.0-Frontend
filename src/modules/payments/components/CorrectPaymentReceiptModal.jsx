import React, { useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import Input from "../../../components/ui/Input";
import { useEnrollmentsStudentSearchQuery } from "../../enrollments/hooks/useEnrollmentsStudentSearchQuery";
import { getStudentCharges } from "../../students/services/students.service";

function formatMethod(value) {
  if (value === "CASH") return "Efectivo";
  if (value === "YAPE") return "Yape";
  if (value === "TRANSFER") return "Transferencia";
  if (value === "CAJA_AREQUIPA") return "Caja Arequipa";
  return value || "-";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getErrorMessage(error) {
  const message = error?.response?.data?.message || error?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "No se pudo corregir el recibo.";
}

function getStudentLabel(student) {
  if (!student) return "";
  const names = student?.names || student?.personId?.names || "";
  const lastNames = student?.lastNames || student?.personId?.lastNames || "";
  const fullName = [lastNames, names].filter(Boolean).join(", ").trim();
  return [fullName, student.code || student.internalCode || null].filter(Boolean).join(" · ");
}

function summarizeCharge(charge) {
  return {
    id: charge?.id || charge?._id || "",
    concept: charge?.concept || charge?.description || "Cargo",
    outstandingAmount: Number(charge?.outstandingAmount || 0),
    amount: Number(charge?.amount || 0),
    dueDate: charge?.dueDate || null,
  };
}

export default function CorrectPaymentReceiptModal({
  open,
  onClose,
  payment,
  onSave,
  isPending,
  isSuccess,
  error,
  canEditAmount = false,
  canEditPaidAt = false,
  canReassign = false,
  currentStudentId = null,
  availableCharges = [],
}) {
  const currentPrimaryChargeId = Array.isArray(payment?.allocations) && payment.allocations.length === 1
    ? String(payment.allocations[0]?.chargeId || "")
    : "";

  const [form, setForm] = useState({
    method: payment?.method || "CASH",
    amount: payment?.amount ? String(Number(payment.amount).toFixed(2)) : "",
    paidAt: formatDateTimeLocal(payment?.paidAt || payment?.date),
    targetChargeId: currentPrimaryChargeId,
    receiptNumber: payment?.receiptNumber || "",
    voucherNumber: payment?.voucherNumber || "",
    notes: payment?.note || "",
    correctionReason: "",
    reassignEnabled: false,
    targetStudentId: "",
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [targetCharges, setTargetCharges] = useState([]);
  const [targetChargesLoading, setTargetChargesLoading] = useState(false);
  const [targetChargesError, setTargetChargesError] = useState("");
  const [allocationAmounts, setAllocationAmounts] = useState({});

  const studentSearchQuery = useEnrollmentsStudentSearchQuery({
    q: studentSearch,
    enabled: open && canReassign && form.reassignEnabled,
    limit: 12,
  });

  React.useEffect(() => {
    if (!open) return;
    setForm({
      method: payment?.method || "CASH",
      amount: payment?.amount ? String(Number(payment.amount).toFixed(2)) : "",
      paidAt: formatDateTimeLocal(payment?.paidAt || payment?.date),
      targetChargeId: Array.isArray(payment?.allocations) && payment.allocations.length === 1
        ? String(payment.allocations[0]?.chargeId || "")
        : "",
      receiptNumber: payment?.receiptNumber || "",
      voucherNumber: payment?.voucherNumber || "",
      notes: payment?.note || "",
      correctionReason: "",
      reassignEnabled: false,
      targetStudentId: "",
    });
    setStudentSearch("");
    setTargetCharges([]);
    setTargetChargesError("");
    setAllocationAmounts({});
  }, [open, payment]);

  React.useEffect(() => {
    if (!open || !canReassign || !form.reassignEnabled || !form.targetStudentId) {
      setTargetCharges([]);
      setTargetChargesError("");
      setAllocationAmounts({});
      return;
    }

    let ignore = false;
    setTargetChargesLoading(true);
    setTargetChargesError("");

    getStudentCharges(form.targetStudentId)
      .then((rows) => {
        if (ignore) return;
        const normalized = (Array.isArray(rows) ? rows : [])
          .map(summarizeCharge)
          .filter((charge) => charge.id && charge.outstandingAmount > 0);
        setTargetCharges(normalized);
        setAllocationAmounts({});
      })
      .catch((loadError) => {
        if (ignore) return;
        setTargetCharges([]);
        setAllocationAmounts({});
        setTargetChargesError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (!ignore) setTargetChargesLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, canReassign, form.reassignEnabled, form.targetStudentId]);

  const searchItems = Array.isArray(studentSearchQuery.data)
    ? studentSearchQuery.data
    : (Array.isArray(studentSearchQuery.data?.items) ? studentSearchQuery.data.items : []);

  const filteredSearchItems = useMemo(
    () => searchItems.filter((student) => String(student?.id || student?._id || "") !== String(currentStudentId || "")),
    [searchItems, currentStudentId],
  );

  const impactText = useMemo(() => {
    const previousMethod = String(payment?.method || "").toUpperCase();
    const nextMethod = String(form.method || "").toUpperCase();
    if (!previousMethod || previousMethod === nextMethod) return null;
    if (previousMethod === "CASH" && ["YAPE", "TRANSFER"].includes(nextMethod)) {
      return "Este pago dejara de contar como efectivo en caja y pasara a pagos no presenciales.";
    }
    if (["YAPE", "TRANSFER"].includes(previousMethod) && nextMethod === "CASH") {
      return "Este pago pasara a sumar dinero fisico disponible en caja.";
    }
    return `El metodo cambiara de ${formatMethod(previousMethod)} a ${formatMethod(nextMethod)}.`;
  }, [form.method, payment?.method]);

  const paymentAmount = Number(payment?.amount || 0);
  const editedAmount = Number(form.amount || 0);
  const effectivePaymentAmount = canEditAmount && editedAmount > 0 ? editedAmount : paymentAmount;

  const allocationTotal = useMemo(
    () => Object.values(allocationAmounts).reduce((acc, value) => acc + Number(value || 0), 0),
    [allocationAmounts],
  );
  const allocationDifference = useMemo(
    () => Math.round(((effectivePaymentAmount - allocationTotal) + Number.EPSILON) * 100) / 100,
    [allocationTotal, effectivePaymentAmount],
  );

  const canSave = useMemo(() => {
    if (!form.method || String(form.correctionReason || "").trim().length < 5) return false;
    if (canEditAmount && !(editedAmount > 0)) return false;
    if (!form.reassignEnabled) return true;
    if (!form.targetStudentId) return false;
    return Math.abs(allocationDifference) < 0.001;
  }, [allocationDifference, canEditAmount, editedAmount, form.correctionReason, form.method, form.reassignEnabled, form.targetStudentId]);

  const chargeOptions = useMemo(
    () =>
      (Array.isArray(availableCharges) ? availableCharges : [])
        .map((charge) => ({
          id: String(charge.id || charge._id || ""),
          label: charge.concept || charge.description || "Cargo",
          amount: Number(charge.amount || 0),
          outstandingAmount: Number(charge.outstandingAmount || 0),
        }))
        .filter((charge) => charge.id),
    [availableCharges],
  );

  const handleToggleCharge = (charge) => {
    setAllocationAmounts((prev) => {
      const next = { ...prev };
      if (next[charge.id] !== undefined) {
        delete next[charge.id];
      } else {
        next[charge.id] = Number(charge.outstandingAmount || 0);
      }
      return next;
    });
  };

  const handleChangeAllocationAmount = (chargeId, value) => {
    const parsed = Number(value);
    setAllocationAmounts((prev) => ({
      ...prev,
      [chargeId]: Number.isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSubmit = () => {
    const payload = {
      method: form.method,
      amount: canEditAmount ? Number(form.amount || 0) || undefined : undefined,
      paidAt: canEditPaidAt ? String(form.paidAt || "").trim() || undefined : undefined,
      receiptNumber: String(form.receiptNumber || "").trim() || undefined,
      voucherNumber: String(form.voucherNumber || "").trim() || undefined,
      notes: String(form.notes || "").trim() || undefined,
      correctionReason: String(form.correctionReason || "").trim(),
    };

    const normalizedTargetChargeId = String(form.targetChargeId || "").trim();
    if (
      !form.reassignEnabled &&
      currentStudentId &&
      normalizedTargetChargeId &&
      normalizedTargetChargeId !== String(currentPrimaryChargeId || "")
    ) {
      payload.reassignStudentId = String(currentStudentId);
      payload.reassignAllocations = [{
        chargeId: normalizedTargetChargeId,
        amount: effectivePaymentAmount,
      }];
    }

    if (form.reassignEnabled && form.targetStudentId) {
      payload.reassignStudentId = form.targetStudentId;
      payload.reassignAllocations = Object.entries(allocationAmounts)
        .map(([chargeId, amount]) => ({
          chargeId,
          amount: Number(amount || 0),
        }))
        .filter((row) => row.amount > 0);
    }

    onSave?.(payload);
  };

  return (
    <BaseModal
      open={open}
      onClose={isPending ? undefined : onClose}
      title="Corregir recibo"
      maxWidthClass="max-w-4xl"
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose} disabled={isPending}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={isPending || isSuccess || !canSave}>
            {isPending ? "Guardando..." : "Guardar correccion"}
          </Button>
        </div>
      )}
    >
      <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p><strong>Pago:</strong> {payment?.internalCode || "-"}</p>
          <p className="mt-1"><strong>Metodo actual:</strong> {formatMethod(payment?.method)}</p>
          <p className="mt-1"><strong>Monto:</strong> {payment?.amount ? `S/ ${Number(payment.amount).toFixed(2)}` : "-"}</p>
        </div>

        {impactText ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {impactText}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Metodo de pago</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={form.method}
              onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}
            >
              <option value="CASH">Efectivo</option>
              <option value="YAPE">Yape</option>
              <option value="TRANSFER">Transferencia</option>
              {payment?.method === "CAJA_AREQUIPA" ? <option value="CAJA_AREQUIPA">Caja Arequipa</option> : null}
            </select>
          </div>

          {canEditAmount ? (
            <Input
              label="Monto del recibo"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Monto del recibo</div>
              <div className="text-sm text-gray-800">{formatMoney(payment?.amount)}</div>
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {canEditPaidAt ? (
            <Input
              label="Fecha del pago"
              type="datetime-local"
              value={form.paidAt}
              onChange={(e) => setForm((prev) => ({ ...prev, paidAt: e.target.value }))}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="mb-1 text-sm font-medium text-gray-700">Fecha del pago</div>
              <div className="text-sm text-gray-800">{formatDateTimeLocal(payment?.paidAt || payment?.date) || "-"}</div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cargo pagado</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={form.targetChargeId}
              onChange={(e) => setForm((prev) => ({ ...prev, targetChargeId: e.target.value }))}
            >
              <option value="">Mantener cargo actual</option>
              {chargeOptions.map((charge) => (
                <option key={charge.id} value={charge.id}>
                  {`${charge.label} · ${formatMoney(charge.amount)} · Pendiente ${formatMoney(charge.outstandingAmount)}`}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Si eliges otro cargo, el pago se reaplica dentro del mismo alumno.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Recibo fisico"
            value={form.receiptNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, receiptNumber: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
            placeholder="Opcional"
          />
          <Input
            label="Voucher / operacion"
            value={form.voucherNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, voucherNumber: e.target.value }))}
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Observacion visible del recibo</label>
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-gray-300 px-3 py-2"
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        {canReassign ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.reassignEnabled}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  reassignEnabled: e.target.checked,
                  targetStudentId: e.target.checked ? prev.targetStudentId : "",
                }))}
              />
              <span>
                <span className="block font-medium text-gray-900">Reasignar el pago a otro alumno</span>
                <span className="block text-xs text-gray-500">
                  Solo para correcciones administrativas donde el recibo fue aplicado al alumno equivocado.
                </span>
              </span>
            </label>

            {form.reassignEnabled ? (
              <div className="mt-4 space-y-4">
                <Input
                  label="Buscar alumno destino"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="DNI, codigo, nombres o apellidos"
                />

                {studentSearchQuery.isFetching ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    Buscando alumnos...
                  </div>
                ) : null}

                {studentSearch.trim().length >= 2 ? (
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200">
                    {filteredSearchItems.length ? (
                      filteredSearchItems.map((student) => {
                        const studentId = String(student?.id || student?._id || "");
                        const selected = studentId === String(form.targetStudentId || "");
                        return (
                          <button
                            key={studentId}
                            type="button"
                            className={`flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 ${
                              selected ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                            }`}
                            onClick={() => setForm((prev) => ({ ...prev, targetStudentId: studentId }))}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{getStudentLabel(student)}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {student?.dni || student?.personId?.dni || "-"} {student?.campusCode ? `· ${student.campusCode}` : ""}
                              </p>
                            </div>
                            {selected ? <span className="text-xs font-medium text-blue-700">Seleccionado</span> : null}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No se encontraron alumnos.</div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Escribe al menos 2 caracteres para buscar otro alumno.</p>
                )}

                {form.targetStudentId ? (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    El total asignado a los cargos destino debe ser exactamente {formatMoney(effectivePaymentAmount)}.
                  </div>
                ) : null}

                {targetChargesLoading ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Cargando cargos del alumno destino...
                  </div>
                ) : null}

                {targetChargesError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {targetChargesError}
                  </div>
                ) : null}

                {form.targetStudentId && !targetChargesLoading ? (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Sel.</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Concepto</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Pendiente</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">A aplicar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {targetCharges.length ? targetCharges.map((charge) => (
                          <tr key={charge.id}>
                            <td className="px-3 py-2 text-gray-700">
                              <input
                                type="checkbox"
                                checked={allocationAmounts[charge.id] !== undefined}
                                onChange={() => handleToggleCharge(charge)}
                              />
                            </td>
                            <td className="px-3 py-2 text-gray-900">{charge.concept}</td>
                            <td className="px-3 py-2 text-gray-700">{formatMoney(charge.outstandingAmount)}</td>
                            <td className="px-3 py-2 text-gray-700">
                              <input
                                type="number"
                                min="0"
                                max={charge.outstandingAmount}
                                step="0.01"
                                disabled={allocationAmounts[charge.id] === undefined}
                                className="w-28 rounded-lg border border-gray-300 px-2 py-1"
                                value={allocationAmounts[charge.id] ?? ""}
                                onChange={(e) => handleChangeAllocationAmount(charge.id, e.target.value)}
                              />
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="px-3 py-3 text-gray-500">
                              El alumno destino no tiene cargos pendientes compatibles.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className={`rounded-lg border px-4 py-3 text-sm ${
                  Math.abs(allocationDifference) < 0.001
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <span>Total del recibo</span>
                    <strong>{formatMoney(effectivePaymentAmount)}</strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span>Total asignado</span>
                    <strong>{formatMoney(allocationTotal)}</strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span>Diferencia</span>
                    <strong>{formatMoney(allocationDifference)}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Motivo de correccion</label>
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-gray-300 px-3 py-2"
            value={form.correctionReason}
            onChange={(e) => setForm((prev) => ({ ...prev, correctionReason: e.target.value }))}
            placeholder="Ej. Se registro como efectivo por error, el padre pago por Yape."
          />
          <p className="mt-1 text-xs text-gray-500">Obligatorio. Se guardara en auditoria.</p>
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
