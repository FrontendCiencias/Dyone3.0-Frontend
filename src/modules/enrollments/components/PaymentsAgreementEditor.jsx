import React from "react";
import Input from "../../../components/ui/Input";
import { ENROLLMENT_CASE_MONTHS, buildPensionArrayFromGeneralAmount } from "../domain/enrollmentCaseValidation";

export default function PaymentsAgreementEditor({ payments, onChange }) {
  const monthly = Array.isArray(payments?.monthlyAmounts) ? payments.monthlyAmounts : buildPensionArrayFromGeneralAmount(Number(payments?.monthlyAmount || 0), 0);

  return (
    <div className="space-y-3">
      <Input
        label="Matrícula familiar (S/)"
        type="number"
        value={Number(payments?.enrollmentFee || 0)}
        onChange={(e) => onChange?.({ enrollmentFee: Number(e.target.value || 0) })}
      />
      <Input
        label="Pensión mensual (S/)"
        type="number"
        value={Number(payments?.monthlyAmount || 0)}
        onChange={(e) => {
          const amount = Number(e.target.value || 0);
          onChange?.({ monthlyAmount: amount, monthlyAmounts: buildPensionArrayFromGeneralAmount(amount, 0) });
        }}
      />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(payments?.editMonthly)}
          onChange={(e) => onChange?.({ editMonthly: e.target.checked })}
        />
        Editar por mes
      </label>

      {payments?.editMonthly ? (
        <div className="grid gap-2 md:grid-cols-2">
          {ENROLLMENT_CASE_MONTHS.map((month, index) => (
            <label key={month} className="text-xs text-gray-600">
              {month}
              <input
                type="number"
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                value={Number(monthly[index] || 0)}
                onChange={(event) => {
                  const next = [...monthly];
                  next[index] = Number(event.target.value || 0);
                  onChange?.({ monthlyAmounts: next });
                }}
              />
            </label>
          ))}
        </div>
      ) : null}

      <Input label="Notas (opcional)" value={payments?.notes || ""} onChange={(e) => onChange?.({ notes: e.target.value })} />
    </div>
  );
}
