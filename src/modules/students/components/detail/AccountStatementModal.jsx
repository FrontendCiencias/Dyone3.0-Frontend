import React from "react";
import BaseModal from "../../../../shared/ui/BaseModal";
import SecondaryButton from "../../../../shared/ui/SecondaryButton";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${amount.toFixed(2)}`;
}

export default function AccountStatementModal({ open, onClose, debtsSummary }) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Estado de cuenta"
      footer={
        <div className="flex justify-end">
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
        </div>
      }
    >
      <div className="space-y-3 p-5 text-sm text-gray-700">
        <p>Total pendiente: {formatMoney(debtsSummary?.pendingTotal)}</p>
        <p>Total vencido: {formatMoney(debtsSummary?.overdueTotal)}</p>
        <p>Último pago: {debtsSummary?.lastPaymentDate?.slice?.(0, 10) || "-"}</p>
        <p className="text-xs text-gray-500">TODO: conectar detalle de cargos/pagos cuando endpoint de estado de cuenta esté disponible.</p>
      </div>
    </BaseModal>
  );
}
