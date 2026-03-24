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

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("es-PE", {
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
    <div className={`rounded-2xl border px-4 py-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-gray-950 lg:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function methodAccent(method) {
  const normalized = String(method || "").toUpperCase();
  if (normalized === "TOTAL") return "border-slate-200 bg-slate-50";
  if (normalized === "PAYMENTS") return "border-violet-200 bg-violet-50";
  if (normalized === "CASH") return "border-emerald-200 bg-emerald-50";
  if (normalized === "YAPE") return "border-sky-200 bg-sky-50";
  if (normalized === "TRANSFER") return "border-amber-200 bg-amber-50";
  return "border-gray-100 bg-gray-50/70";
}

export default function DailyCashReviewSection({ campus }) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(getLimaTodayString);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    setCollapsedCategories({});
  }, [selectedDate, campus]);

  const summaryQuery = useDailyPaymentSummaryQuery({ date: selectedDate, campus }, true);
  const transactionsQuery = useDailyPaymentTransactionsQuery({ date: selectedDate, campus, page: 1, limit: 100 }, true);

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
  const categoryMovements = useMemo(() => {
    return transactions.flatMap((row) => {
      if (Array.isArray(row.allocations) && row.allocations.length) {
        return row.allocations.map((allocation, index) => ({
          movementId: `${row.paymentId}-${allocation.chargeId || index}`,
          paymentId: row.paymentId,
          studentId: row.studentId,
          studentName: row.studentName,
          gradeLabel: row.gradeLabel,
          paidAt: row.paidAt,
          method: row.method,
          methodLabel: row.methodLabel,
          internalCode: row.internalCode,
          receiptNumber: row.receiptNumber,
          voucherNumber: row.voucherNumber,
          note: row.note,
          amount: Number(allocation.amount || 0),
          categoryLabel: allocation.concept || row.categoryLabel || "Otros",
          detailLabel: allocation.concept || row.categoryLabel || "Concepto",
          isPartial: Boolean(allocation.isPartial),
          campusCode: allocation.campusCode || row.campusCode || null,
          sourcePayment: row,
        }));
      }

      return [
        {
          movementId: `${row.paymentId}-fallback`,
          paymentId: row.paymentId,
          studentId: row.studentId,
          studentName: row.studentName,
          gradeLabel: row.gradeLabel,
          paidAt: row.paidAt,
          method: row.method,
          methodLabel: row.methodLabel,
          internalCode: row.internalCode,
          receiptNumber: row.receiptNumber,
          voucherNumber: row.voucherNumber,
          note: row.note,
          amount: Number(row.amount || 0),
          categoryLabel: row.categoryLabel || "Otros",
          detailLabel: row.categoryLabel || "Pago",
          isPartial: false,
          campusCode: row.campusCode || null,
          sourcePayment: row,
        },
      ];
    });
  }, [transactions]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map();
    for (const movement of categoryMovements) {
      const key = movement.categoryLabel || "Otros";
      if (!groups.has(key)) {
        groups.set(key, {
          categoryLabel: key,
          subtotal: 0,
          movements: [],
        });
      }
      const group = groups.get(key);
      group.subtotal += Number(movement.amount || 0);
      group.movements.push(movement);
    }
    return Array.from(groups.values()).map((group) => ({
      ...group,
      subtotal: Number(group.subtotal || 0),
      movementsCount: group.movements.length,
    })).sort((a, b) => b.subtotal - a.subtotal || a.categoryLabel.localeCompare(b.categoryLabel, "es"));
  }, [categoryMovements]);
  const defaultCollapsedCategories = useMemo(
    () =>
      Object.fromEntries(groupedTransactions.map((group) => [group.categoryLabel, true])),
    [groupedTransactions],
  );

  useEffect(() => {
    setCollapsedCategories(defaultCollapsedCategories);
  }, [defaultCollapsedCategories]);

  function toggleCategory(categoryLabel) {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryLabel]: !prev[categoryLabel],
    }));
  }

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
            className={`md:col-span-4 xl:col-span-1 ${methodAccent("TOTAL")}`}
          />
          <SummaryCard
            label="Pagos"
            value={String(summaryQuery.data?.paymentsCount || 0)}
            hint="Operaciones registradas"
            className={methodAccent("PAYMENTS")}
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
            <p className="text-xs text-gray-500">
              Los pagos mixtos se reparten por concepto. Un mismo ticket puede aparecer en mas de una categoria.
            </p>
          </div>
        </div>

        {transactionsQuery.isError ? (
          <div className="px-4 py-5 text-sm text-red-700">{getErrorMessage(transactionsQuery.error)}</div>
        ) : transactionsQuery.isLoading || transactionsQuery.isFetching ? (
          <div className="px-4 py-5 text-sm text-gray-500">Cargando movimientos...</div>
        ) : (
          <>
            <div className="max-h-[420px] space-y-4 overflow-auto px-4 py-4">
              {groupedTransactions.map((group) => (
                <section key={group.categoryLabel} className="overflow-hidden rounded-2xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.categoryLabel)}
                    className="flex w-full items-center justify-between gap-3 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none text-gray-400">
                        {collapsedCategories[group.categoryLabel] ? "+" : "-"}
                      </span>
                      <div>
                      <h4 className="text-sm font-semibold text-gray-900">{group.categoryLabel}</h4>
                      <p className="text-xs text-gray-500">{group.movementsCount} movimiento(s)</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatMoney(group.subtotal)}</p>
                  </button>

                  {!collapsedCategories[group.categoryLabel] ? (
                    <div className="divide-y divide-gray-100 bg-white">
                      {group.movements.map((movement) => (
                        <div key={movement.movementId} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <p className="text-sm font-semibold text-gray-900">{movement.studentName || "Alumno"}</p>
                              <span className="text-xs text-gray-500">{formatTime(movement.paidAt)}</span>
                              {movement.sourcePayment?.gradeLabel ? (
                                <span className="text-xs text-gray-500">{movement.sourcePayment.gradeLabel}</span>
                              ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span>{movement.methodLabel || formatMethod(movement.method)}</span>
                              <span>{movement.internalCode || "-"}</span>
                              {movement.receiptNumber ? <span>Recibo {movement.receiptNumber}</span> : null}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <p className="truncate text-gray-700">{movement.detailLabel || "Concepto"}</p>
                                <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
                                  {movement.isPartial ? <span>Pago parcial</span> : <span>Pago completo</span>}
                                  {movement.campusCode ? <span>{movement.campusCode}</span> : null}
                                </div>
                              </div>
                              <span className="whitespace-nowrap font-medium text-gray-900">
                                {formatMoney(movement.amount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <Button onClick={() => setSelectedPayment(movement.sourcePayment)}>Ver pago</Button>
                            {movement.studentId ? (
                              <SecondaryButton onClick={() => navigate(ROUTES.dashboardPaymentDetail(movement.studentId))}>
                                Ver alumno
                              </SecondaryButton>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>

            {!transactions.length ? (
              <div className="px-4 py-6 text-sm text-gray-500">
                No hay pagos registrados para la fecha seleccionada.
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
