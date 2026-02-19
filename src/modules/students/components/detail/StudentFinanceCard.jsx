import React from "react";
import Card from "../../../../components/ui/Card";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${amount.toFixed(2)}`;
}

export default function StudentFinanceCard({
  debtsSummary,
  upcomingCharges,
  disableAccountStatement,
  canManagePayments,
  onOpenAccountStatement,
  onRegisterPayment,
  onCreateCharge,
}) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Finanzas</h3>
      <div className="space-y-2 text-sm text-gray-700">
        <p>Deuda total: {formatMoney(debtsSummary.pendingTotal)}</p>
        <p>Vencido: {formatMoney(debtsSummary.overdueTotal)}</p>
        <div>
          <p className="font-medium text-gray-900">Próximos cargos:</p>
          <ul className="list-inside list-disc text-sm text-gray-600">
            {upcomingCharges.length ? (
              upcomingCharges.map((charge, index) => (
                <li key={`${charge.id || charge.concept || "charge"}-${index}`}>
                  {charge.concept || charge.name || "Cargo"} - {formatMoney(charge.amount)}
                </li>
              ))
            ) : (
              <li>Sin cargos próximos.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <SecondaryButton disabled={disableAccountStatement} onClick={onOpenAccountStatement}>
          Ver estado de cuenta
        </SecondaryButton>
        <SecondaryButton disabled={!canManagePayments} onClick={onRegisterPayment}>
          Registrar pago
        </SecondaryButton>
        <SecondaryButton disabled={!canManagePayments} onClick={onCreateCharge}>
          Crear cargo
        </SecondaryButton>
      </div>
    </Card>
  );
}
