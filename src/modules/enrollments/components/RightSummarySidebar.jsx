import React, { useMemo } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

function toMoney(value) {
  const safe = Number(value || 0);
  return `S/ ${Number.isNaN(safe) ? "0.00" : safe.toFixed(2)}`;
}

export default function RightSummarySidebar({ family, items = [], payments, onPaymentsChange, onConfirm, onViewContract, isConfirming }) {
  const totals = useMemo(() => {
    const rights = items.reduce((acc, item) => acc + (item?.admissionFee?.applies && !item?.admissionFee?.isExempt ? Number(item?.admissionFee?.amount || 0) : 0), 0);
    const enrollment = items.reduce((acc, item) => acc + (!item?.enrollmentFee?.isExempt ? Number(item?.enrollmentFee?.amount || 0) : 0), 0);
    const pension = items.reduce((acc, item) => acc + (item?.pensionMonthlyAmounts || []).reduce((sum, val) => sum + Number(val || 0), 0), 0);

    const pensionByMonth = items.reduce((acc, item) => {
      (item?.pensionMonthlyAmounts || []).forEach((amount, index) => {
        acc[index] = Number(acc[index] || 0) + Number(amount || 0);
      });
      return acc;
    }, Array(10).fill(0));

    return { rights, enrollment, pension, pensionByMonth };
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
          <p className="text-xs text-gray-600">Tutor principal: {family?.primaryTutor?.tutorPerson?.lastNames || "-"} {family?.primaryTutor?.tutorPerson?.names || ""}</p>
          <p className="text-xs text-gray-600">DNI: {family?.primaryTutor?.tutorPerson?.dni || "-"} · Tel: {family?.primaryTutor?.tutorPerson?.phone || "-"}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-800">Alumnos</p>
          <div className="space-y-1 text-xs text-gray-600">
            {items.map((item) => (
              <p key={`summary-${item.id}`}>
                {item.fullName} · {item.assignedClassroomLabel || item.selectedClassroomLabel || "Aula pendiente"} · Total: {toMoney((item?.pensionMonthlyAmounts || []).reduce((acc, value) => acc + Number(value || 0), 0) + (item?.admissionFee?.applies && !item?.admissionFee?.isExempt ? Number(item?.admissionFee?.amount || 0) : 0) + (!item?.enrollmentFee?.isExempt ? Number(item?.enrollmentFee?.amount || 0) : 0))}
              </p>
            ))}
            {!items.length ? <p>Sin alumnos agregados.</p> : null}
          </div>
        </div>

        <Input label="Notas" value={payments?.notes || ""} onChange={(e) => onPaymentsChange?.({ notes: e.target.value })} />

        <div className="space-y-1 text-sm text-gray-700">
          <p>Derecho de Ingreso: <span className="font-semibold">{toMoney(totals.rights)}</span></p>
          <p>Matrícula: <span className="font-semibold">{toMoney(totals.enrollment)}</span></p>
          {items.some((item) => item?.isPensionCustomized)
            ? (
              <div className="space-y-1">
                <p>Pensión:</p>
                {totals.pensionByMonth.map((amount, index) => (
                  <p key={`pension-month-${index}`} className="pl-3 text-xs text-gray-600">{["Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][index]}: {toMoney(amount)}</p>
                ))}
                <p className="pl-3">Subtotal pensión: <span className="font-semibold">{toMoney(totals.pension)}</span></p>
              </div>
            )
            : <p>Pensión: <span className="font-semibold">{toMoney(totals.pension)}</span></p>}
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={onViewContract} disabled={!family || !items.length}>Ver contrato</Button>
          <Button onClick={onConfirm} disabled={isConfirming}>{isConfirming ? "Registrando..." : "Registrar matrícula"}</Button>
        </div>
      </Card>
    </div>
  );
}
