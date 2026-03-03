import React, { useMemo } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import PaymentsAgreementEditor from "./PaymentsAgreementEditor";

function toMoney(value) {
  const safe = Number(value || 0);
  return `S/ ${Number.isNaN(safe) ? "0.00" : safe.toFixed(2)}`;
}

export default function RightSummarySidebar({ family, items = [], payments, onPaymentsChange, onSaveDraft, onConfirm, isSaving, isConfirming }) {
  const totals = useMemo(() => {
    const rights = items.reduce((acc, item) => acc + Number(item?.admissionFee || 0), 0);
    const enrollment = Number(payments?.enrollmentFee || 0);
    const pension = payments?.editMonthly
      ? (payments?.monthlyAmounts || []).reduce((acc, value) => acc + Number(value || 0), 0)
      : Number(payments?.monthlyAmount || 0) * 10;

    return { rights, enrollment, pension, total: rights + enrollment + pension };
  }, [items, payments]);

  return (
    <div className="lg:sticky lg:top-4">
      <Card className="space-y-4 border border-gray-200 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Resumen final</h3>
          {!family ? <p className="text-sm text-gray-500">Completa los pasos para continuar.</p> : null}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-800">Familia</p>
          <p className="text-xs text-gray-600">Tutor: {family?.primaryTutor?.lastNames || family?.primaryTutor_send?.lastNames || "-"}</p>
          <p className="text-xs text-gray-600">Alumnos en paquete: {items.length}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-800">Alumnos</p>
          <div className="space-y-1 text-xs text-gray-600">
            {items.map((item) => (
              <p key={`summary-${item.id}`}>
                {item.fullName} · {item.assignedClassroomLabel || item.selectedClassroomLabel || "Aula pendiente"}
              </p>
            ))}
            {!items.length ? <p>Sin alumnos agregados.</p> : null}
          </div>
        </div>

        <PaymentsAgreementEditor payments={payments} onChange={onPaymentsChange} />

        <div className="space-y-1 text-sm text-gray-700">
          <p>Matrícula: <span className="font-semibold">{toMoney(totals.enrollment)}</span></p>
          <p>Derecho de ingreso: <span className="font-semibold">{toMoney(totals.rights)}</span></p>
          <p>Pensión total: <span className="font-semibold">{toMoney(totals.pension)}</span></p>
          <p>Total familiar: <span className="font-semibold">{toMoney(totals.total)}</span></p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={onSaveDraft} disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar borrador"}</Button>
          <Button onClick={onConfirm} disabled={isConfirming}>{isConfirming ? "Confirmando..." : "Confirmar matrícula"}</Button>
        </div>
      </Card>
    </div>
  );
}
