import React from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { printPaymentReceipt } from "../services/paymentReceipt";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatMethod(value) {
  if (value === "CASH") return "Efectivo";
  if (value === "YAPE") return "Yape";
  if (value === "TRANSFER") return "Transferencia";
  if (value === "CAJA_AREQUIPA") return "Caja Arequipa";
  return value || "-";
}

export default function PaymentDetailModal({ open, onClose, student, payment, canCorrect = false, onOpenCorrect = null }) {
  const allocations = Array.isArray(payment?.allocations) ? payment.allocations : [];

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Detalle del pago"
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
          {canCorrect ? (
            <SecondaryButton onClick={onOpenCorrect}>Corregir recibo</SecondaryButton>
          ) : null}
          <Button
            onClick={() =>
              printPaymentReceipt({
                student,
                payment,
              })
            }
          >
            Imprimir recibo
          </Button>
        </div>
      }
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            <p>
              <strong>Codigo interno:</strong> {payment?.internalCode || "-"}
            </p>
            <p className="mt-2">
              <strong>Recibo fisico:</strong> {payment?.receiptNumber || "-"}
            </p>
            <p className="mt-2">
              <strong>Voucher / operación:</strong> {payment?.voucherNumber || "-"}
            </p>
            <p className="mt-2">
              <strong>Fecha:</strong> {formatDate(payment?.date || payment?.paidAt)}
            </p>
            <p className="mt-2">
              <strong>Metodo:</strong> {formatMethod(payment?.method)}
            </p>
            <p className="mt-2">
              <strong>Total:</strong> {formatMoney(payment?.amount)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
            <p>
              <strong>Alumno:</strong> {[student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno"}
            </p>
            <p className="mt-2">
              <strong>DNI:</strong> {student?.dni || "-"}
            </p>
            <p className="mt-2">
              <strong>Codigo:</strong> {student?.code || "-"}
            </p>
            <p className="mt-2">
              <strong>Observaciones:</strong> {payment?.note || "-"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Aplicacion del pago</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Concepto</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Monto aplicado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {allocations.length ? (
                  allocations.map((allocation, index) => (
                    <tr key={`${allocation.chargeId || "allocation"}-${index}`}>
                      <td className="px-4 py-3 text-gray-700">{allocation.concept || "Cargo"}</td>
                      <td className="px-4 py-3 text-gray-700">{formatMoney(allocation.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-gray-500" colSpan={2}>
                      No hay detalle por cargo disponible para este pago.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
