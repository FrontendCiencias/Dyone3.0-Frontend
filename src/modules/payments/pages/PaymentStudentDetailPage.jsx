import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { useStudentAccountStatementQuery } from "../hooks/useStudentAccountStatementQuery";
import PaymentAllocationDrawer from "../components/PaymentAllocationDrawer";
import PaymentDetailModal from "../components/PaymentDetailModal";

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
  return value || "-";
}

function formatChargeStatus(value) {
  if (value === "PAID") return "Completo";
  if (value === "PARTIAL") return "Parcial";
  if (value === "PENDING") return "Pendiente";
  if (value === "OVERDUE") return "Vencido";
  if (value === "CANCELLED") return "Cancelado";
  return value || "-";
}

export default function PaymentStudentDetailPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCharges, setSelectedCharges] = useState({});
  const [selectedPayment, setSelectedPayment] = useState(null);
  const accountQuery = useStudentAccountStatementQuery(studentId, true);

  const account = accountQuery.data || {};
  const charges = Array.isArray(account.charges) ? account.charges : [];
  const payments = Array.isArray(account.payments) ? account.payments : [];
  const student = useMemo(() => account.student || {}, [account.student]);

  const selectedChargeRows = useMemo(
    () => charges.filter((charge) => selectedCharges[charge.id] !== undefined),
    [charges, selectedCharges],
  );
  const showDrawer = drawerOpen && selectedChargeRows.length > 0;

  useEffect(() => {
    if (!selectedChargeRows.length) {
      setDrawerOpen(false);
    }
  }, [selectedChargeRows.length]);

  const toggleCharge = (charge) => {
    setSelectedCharges((prev) => {
      const next = { ...prev };
      if (next[charge.id] !== undefined) {
        delete next[charge.id];
      } else {
        next[charge.id] = Number(charge.outstandingAmount || 0);
      }
      return next;
    });
    setDrawerOpen(true);
  };

  const updateChargeAmount = (chargeId, value) => {
    setSelectedCharges((prev) => ({
      ...prev,
      [chargeId]: value,
    }));
  };

  const removeCharge = (chargeId) => {
    setSelectedCharges((prev) => {
      const next = { ...prev };
      delete next[chargeId];
      return next;
    });
  };

  const resetSelection = (shouldRefresh = false) => {
    setDrawerOpen(false);
    setSelectedCharges({});
    if (shouldRefresh) {
      accountQuery.refetch();
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-stretch">
          <div className="rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-500">Pendiente</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatMoney(account?.totals?.pending)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <p className="text-sm text-amber-700">Vencido</p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">{formatMoney(account?.totals?.overdue)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <p className="text-sm text-emerald-700">Pagado</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-800">{formatMoney(account?.totals?.paid)}</p>
          </div>
          <div className="flex items-center justify-end">
            <SecondaryButton onClick={() => navigate(ROUTES.dashboardPayments)}>Volver a pagos</SecondaryButton>
          </div>
        </div>
      </Card>

      {accountQuery.isLoading ? (
        <Card className="border border-gray-200 text-sm text-gray-500">Cargando estado de cuenta...</Card>
      ) : accountQuery.isError ? (
        <Card className="border border-red-200 text-sm text-red-700">
          No se pudo cargar el estado de cuenta del alumno.
        </Card>
      ) : (
        <div
          className={
            showDrawer
              ? "grid gap-4 transition-all duration-300 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start"
              : "space-y-4 transition-all duration-300"
          }
        >
          <div className="space-y-4">
            {accountQuery.isFetching ? (
              <Card className="border border-blue-100 bg-blue-50 text-sm text-blue-700 shadow-sm">
                Actualizando estado de cuenta...
              </Card>
            ) : null}

            <Card className="border border-gray-200 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Cargos</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Selecciona uno o varios cargos para preparar el pago.
                  </p>
                </div>
                {selectedChargeRows.length ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {selectedChargeRows.length} cargo(s) seleccionado(s)
                  </span>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Sel.</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Concepto</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Monto</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Pendiente</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Vence</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {charges.map((charge) => (
                      <tr
                        key={charge.id}
                        className={`transition ${selectedCharges[charge.id] !== undefined ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-3 text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedCharges[charge.id] !== undefined}
                            disabled={Number(charge.outstandingAmount || 0) <= 0}
                            onChange={() => toggleCharge(charge)}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-900">{charge.concept || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{formatMoney(charge.amount)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatMoney(charge.outstandingAmount)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(charge.dueDate)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatChargeStatus(charge.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!charges.length ? <p className="mt-3 text-sm text-gray-500">No hay cargos registrados.</p> : null}
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Pagos registrados</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Codigo interno</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Recibo fisico</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Monto</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Metodo</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="cursor-pointer transition hover:bg-gray-50"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <td className="px-4 py-3 text-gray-700">{payment.internalCode || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{payment.receiptNumber || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(payment.date)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatMoney(payment.amount)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatMethod(payment.method)}</td>
                        <td className="px-4 py-3 text-gray-700">{payment.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!payments.length ? (
                <p className="mt-3 text-sm text-gray-500">No hay pagos registrados.</p>
              ) : (
                <p className="mt-3 text-xs text-gray-500">
                  Haz click en un pago para ver el detalle e imprimir el recibo nuevamente.
                </p>
              )}
            </Card>
          </div>

          {showDrawer ? (
            <div className="space-y-4">
              <PaymentAllocationDrawer
                open={showDrawer}
                onClose={resetSelection}
                student={{
                  id: studentId,
                  names: student.names,
                  lastNames: student.lastNames,
                  dni: student.dni,
                  code: student.code,
                }}
                charges={selectedChargeRows}
                selectedAmounts={selectedCharges}
                onChangeAmount={updateChargeAmount}
                onRemoveCharge={removeCharge}
              />
            </div>
          ) : null}
        </div>
      )}

      <PaymentDetailModal
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        student={{
          id: studentId,
          names: student.names,
          lastNames: student.lastNames,
          dni: student.dni,
          code: student.code,
        }}
        payment={selectedPayment}
      />
    </div>
  );
}
