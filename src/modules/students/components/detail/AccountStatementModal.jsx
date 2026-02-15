import React from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function isBackendPendingError(error) {
  const status = error?.response?.status;
  return status === 404 || status === 501;
}

export default function AccountStatementModal({ open, onClose, debtsSummary, accountQuery, onOpenRegisterPayment }) {
  const account = accountQuery?.data || {};
  const charges = Array.isArray(account?.charges) ? account.charges : [];
  const payments = Array.isArray(account?.payments) ? account.payments : [];
  const pendingTotal = Number(account?.totals?.pendingTotal ?? debtsSummary?.pendingTotal ?? 0);
  const overdueTotal = Number(account?.totals?.overdueTotal ?? debtsSummary?.overdueTotal ?? 0);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Estado de cuenta"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onOpenRegisterPayment}>Registrar pago</SecondaryButton>
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
        </div>
      }
    >
      <div className="space-y-3 p-5 text-sm text-gray-700">
        <p>Total pendiente: {formatMoney(pendingTotal)}</p>
        <p>Total vencido: {formatMoney(overdueTotal)}</p>

        {accountQuery?.isLoading || accountQuery?.isFetching ? (
          <p className="text-sm text-gray-500">Cargando estado de cuenta...</p>
        ) : accountQuery?.isError && isBackendPendingError(accountQuery?.error) ? (
          <div className="space-y-2">
            <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              Pendiente de backend: estado de cuenta del alumno.
            </p>
            <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              La deuda podría no actualizarse automáticamente hasta tener allocations en backend.
            </p>
          </div>
        ) : accountQuery?.isError ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            No se pudo cargar el estado de cuenta.
          </p>
        ) : (
          <>
            <div>
              <p className="font-medium text-gray-900">Cargos</p>
              {charges.length ? (
                <ul className="mt-1 space-y-1">
                  {charges.map((charge, index) => (
                    <li key={`${charge.id || charge.concept || "charge"}-${index}`} className="rounded-md border border-gray-200 p-2 text-xs">
                      {(charge.concept || charge.name || "Cargo")} · {formatMoney(charge.amount)} · Vence {String(charge.dueDate || "-").slice(0, 10)} · Pendiente {formatMoney(charge.outstandingAmount ?? charge.pendingAmount)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">Sin cargos disponibles.</p>
              )}
            </div>

            <div>
              <p className="font-medium text-gray-900">Pagos</p>
              {payments.length ? (
                <ul className="mt-1 space-y-1">
                  {payments.map((payment, index) => (
                    <li key={`${payment.id || payment.date || "payment"}-${index}`} className="rounded-md border border-gray-200 p-2 text-xs">
                      {String(payment.date || payment.paymentDate || "-").slice(0, 10)} · {formatMoney(payment.amount)} · {payment.method || "-"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">Sin pagos disponibles.</p>
              )}
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}
