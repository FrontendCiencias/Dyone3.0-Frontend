import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { useDailyPaymentSummaryQuery } from "../hooks/useDailyPaymentSummaryQuery";
import { useDailyPaymentTransactionsQuery } from "../hooks/useDailyPaymentTransactionsQuery";
import PaymentDetailModal from "./PaymentDetailModal";

function getLimaTodayString() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatMethod(value) {
  if (value === "CASH") return "Efectivo";
  if (value === "YAPE") return "Yape";
  if (value === "TRANSFER") return "Transferencia";
  return value || "-";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar la caja diaria.";
}

function SummaryCard({ label, value, hint, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-gray-950 lg:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function methodAccent(method) {
  const normalized = String(method || "").toUpperCase();
  if (normalized === "CASH") return "text-emerald-700";
  if (normalized === "YAPE") return "text-sky-700";
  if (normalized === "TRANSFER") return "text-amber-700";
  return "text-gray-700";
}

export default function DailyCashReviewSection({ campus }) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getLimaTodayString);
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [campus]);

  const summaryQuery = useDailyPaymentSummaryQuery({ date: selectedDate, campus }, true);
  const transactionsQuery = useDailyPaymentTransactionsQuery({ date: selectedDate, campus, page, limit: 20 }, true);

  const totalsByMethod = useMemo(() => {
    const rows = Array.isArray(summaryQuery.data?.totalsByMethod) ? summaryQuery.data.totalsByMethod : [];
    const byMethod = new Map(rows.map((row) => [String(row.method || "").toUpperCase(), row]));
    return ["CASH", "YAPE", "TRANSFER"].map((method) => ({
      method,
      label: formatMethod(method),
      totalAmount: Number(byMethod.get(method)?.totalAmount || 0),
      paymentsCount: Number(byMethod.get(method)?.paymentsCount || 0),
    }));
  }, [summaryQuery.data]);

  const transactions = useMemo(
    () => (Array.isArray(transactionsQuery.data?.items) ? transactionsQuery.data.items : []),
    [transactionsQuery.data],
  );
  const pageInfo = transactionsQuery.data?.pageInfo || { page: 1, hasNext: false };

  const selectedStudent = selectedPayment
    ? {
        names: (() => {
          const value = String(selectedPayment.studentName || "");
          const parts = value.split(",");
          return parts.length > 1 ? parts.slice(1).join(",").trim() : value;
        })(),
        lastNames: (() => {
          const value = String(selectedPayment.studentName || "");
          const parts = value.split(",");
          return parts[0]?.trim() || "";
        })(),
        code: null,
        dni: null,
      }
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Caja diaria</h2>
            <p className="mt-1 text-sm text-gray-600">
              Revisa cuentas del dia y consulta movimientos de fechas anteriores sin salir del modulo de pagos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Fecha"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {summaryQuery.isError ? (
        <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm text-red-700">
          {getErrorMessage(summaryQuery.error)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-5">
          <SummaryCard
            label="Ingreso total"
            value={formatMoney(summaryQuery.data?.totalIncome)}
            hint="Suma de pagos del dia seleccionado"
            className="md:col-span-4 xl:col-span-1"
          />
          <SummaryCard
            label="Pagos"
            value={String(summaryQuery.data?.paymentsCount || 0)}
            hint="Operaciones registradas"
          />
          {totalsByMethod.map((row) => (
            <SummaryCard
              key={row.method}
              label={row.label}
              value={formatMoney(row.totalAmount)}
              hint={`${row.paymentsCount} pago(s)`}
              className={methodAccent(row.method)}
            />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-gray-900">Movimientos del dia</h3>
            <p className="text-sm text-gray-600">
              Pagos registrados para la fecha seleccionada, con acceso a reimpresion y al detalle del alumno.
            </p>
          </div>
        </div>

        {transactionsQuery.isError ? (
          <div className="px-4 py-5 text-sm text-red-700">{getErrorMessage(transactionsQuery.error)}</div>
        ) : transactionsQuery.isLoading || transactionsQuery.isFetching ? (
          <div className="px-4 py-5 text-sm text-gray-500">Cargando movimientos...</div>
        ) : (
          <>
            <div className="max-h-[420px] overflow-auto">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Hora</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Alumno</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Concepto</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Metodo</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Codigo</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Total</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {transactions.map((row) => (
                      <tr key={row.paymentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{formatDateTime(row.paidAt)}</td>
                        <td className="px-4 py-3 text-gray-900">{row.studentName || "Alumno"}</td>
                        <td className="px-4 py-3 text-gray-700">{row.categoryLabel || "-"}</td>
                        <td className="px-4 py-3 text-gray-700">{row.methodLabel || formatMethod(row.method)}</td>
                        <td className="px-4 py-3 text-gray-700">{row.internalCode || "-"}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(row.amount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <SecondaryButton onClick={() => setSelectedPayment(row)}>Ver pago</SecondaryButton>
                            {row.studentId ? (
                              <SecondaryButton onClick={() => navigate(ROUTES.dashboardPaymentDetail(row.studentId))}>
                                Ver alumno
                              </SecondaryButton>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!transactions.length ? (
              <div className="px-4 py-6 text-sm text-gray-500">
                No hay pagos registrados para la fecha seleccionada.
              </div>
            ) : null}

            {transactions.length ? (
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <SecondaryButton onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
                  Anterior
                </SecondaryButton>
                <p className="text-sm text-gray-600">Pagina {pageInfo.page || page}</p>
                <SecondaryButton onClick={() => setPage((prev) => prev + 1)} disabled={!pageInfo.hasNext}>
                  Siguiente
                </SecondaryButton>
              </div>
            ) : null}
          </>
        )}
      </div>

      <PaymentDetailModal
        open={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        student={selectedStudent}
        payment={selectedPayment ? {
          ...selectedPayment,
          date: selectedPayment.paidAt,
          allocations: selectedPayment.allocations || [],
          amount: selectedPayment.amount,
        } : null}
      />
    </div>
  );
}
