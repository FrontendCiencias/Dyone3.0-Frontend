import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Banknote, ChevronDown, ChevronUp, CreditCard, Landmark, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../config/routes";
import WidgetShell from "./WidgetShell";

function formatMoney(value) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function methodIcon(method) {
  const normalized = String(method || "").toUpperCase();
  if (normalized === "CASH") return Wallet;
  if (normalized === "YAPE") return CreditCard;
  return Landmark;
}

function methodAccent(method) {
  const normalized = String(method || "").toUpperCase();
  if (normalized === "CASH") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (normalized === "YAPE") return "bg-sky-50 text-sky-700 border-sky-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
}

function SummaryCard({ label, value, hint, accent = "text-gray-900" }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-sm text-gray-500">
      Aún no hay ingresos registrados hoy en el alcance seleccionado.
    </div>
  );
}

export default function CashTodaySummary({ data = {} }) {
  const navigate = useNavigate();
  const categories = Array.isArray(data?.byCategory) ? data.byCategory : [];
  const recentPayments = Array.isArray(data?.recentPayments) ? data.recentPayments : [];
  const totalsByMethod = Array.isArray(data?.totalsByMethod) ? data.totalsByMethod : [];
  const [expandedCategories, setExpandedCategories] = useState(() => new Set(categories.slice(0, 1).map((row) => row.category)));

  useEffect(() => {
    setExpandedCategories(new Set(categories.slice(0, 1).map((row) => row.category)));
  }, [categories]);

  const expandedSet = useMemo(() => expandedCategories, [expandedCategories]);

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <WidgetShell
      title="Caja del día"
      subtitle="Ingresos de hoy, desglosados por categoría y con detalle de cada pago registrado."
      right={(
        <button
          type="button"
          onClick={() => navigate(ROUTES.dashboardPayments)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 transition hover:text-gray-900"
        >
          Ir a pagos
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
      className="overflow-visible"
    >
      {!Number(data?.paymentsCount || 0) ? (
        <EmptyState />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <SummaryCard
              label="Ingreso total"
              value={formatMoney(data?.totalIncome)}
              hint="Suma de pagos registrados hoy"
              accent="text-emerald-700"
            />
            <SummaryCard
              label="Pagos"
              value={String(data?.paymentsCount || 0)}
              hint="Operaciones registradas hoy"
            />
            <SummaryCard
              label="Ticket promedio"
              value={formatMoney(data?.averageTicket)}
              hint="Promedio por operación"
            />
            <SummaryCard
              label="Categorías"
              value={String(data?.categoriesCount || categories.length || 0)}
              hint="Conceptos con movimiento hoy"
            />
          </div>

          {totalsByMethod.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {totalsByMethod.map((row) => {
                const MethodIcon = methodIcon(row.method);
                return (
                  <div key={row.method} className={`rounded-2xl border px-4 py-3 ${methodAccent(row.method)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">{row.label}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight">{formatMoney(row.totalAmount)}</p>
                        <p className="mt-1 text-xs opacity-80">
                          {row.paymentsCount} pago(s) · {row.share}% del día
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70">
                        <MethodIcon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Ingresos por categoría
              </div>

              {categories.map((category) => {
                const isOpen = expandedSet.has(category.category);
                return (
                  <div key={category.category} className="rounded-2xl border border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.category)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{category.label}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                            {category.paymentsCount} pagos
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                            {category.share}% del día
                          </span>
                        </div>
                        <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                          {formatMoney(category.totalAmount)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {category.detailsCount} detalle(s) asociados a esta categoría
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                          <div className="text-xs text-gray-500">Detalle</div>
                          <div className="text-sm font-medium text-gray-800">
                            {isOpen ? "Contraer" : "Expandir"}
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </div>
                    </button>

                    {isOpen ? (
                      <div className="border-t border-gray-100 px-4 py-3">
                        <div className="space-y-2">
                          {category.details.map((detail) => {
                            const MethodIcon = methodIcon(detail.method);
                            return (
                              <button
                                key={`${detail.paymentId}-${detail.studentId || detail.paidAt}-${detail.amount}`}
                                type="button"
                                onClick={() => navigate(detail.studentId ? ROUTES.dashboardPaymentDetail(detail.studentId) : ROUTES.dashboardPayments)}
                                className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50 md:grid-cols-[80px_minmax(0,1.4fr)_120px_120px_110px_110px]"
                              >
                                <div className="text-sm font-semibold text-gray-900">{formatTime(detail.paidAt)}</div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-gray-900">{detail.studentName}</div>
                                  <div className="mt-1 truncate text-xs text-gray-500">
                                    {detail.paymentInternalCode || "Pago"} · {detail.conceptLabel || category.label}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-700">{detail.gradeLabel || "Sin grado"}</div>
                                <div className="text-sm text-gray-700">{detail.campusCode || "Sin campus"}</div>
                                <div className="inline-flex items-center gap-2 text-sm text-gray-700">
                                  <MethodIcon className="h-4 w-4 text-gray-400" />
                                  {detail.methodLabel}
                                </div>
                                <div className="text-sm font-semibold text-gray-950">{formatMoney(detail.amount)}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Últimos pagos del día
              </div>

              <div className="space-y-2">
                {recentPayments.map((payment) => (
                  <button
                    key={payment.paymentId}
                    type="button"
                    onClick={() => navigate(payment.to || ROUTES.dashboardPayments)}
                    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                          <Banknote className="h-3.5 w-3.5" />
                          {payment.categoryLabel}
                        </span>
                        <span className="text-xs text-gray-400">{formatTime(payment.paidAt)}</span>
                      </div>
                      <div className="mt-2 truncate text-sm font-semibold text-gray-900">{payment.studentName}</div>
                      <div className="mt-1 truncate text-xs text-gray-500">
                        {[payment.gradeLabel || "Sin grado", payment.campusCode || "Sin campus", payment.methodLabel].join(" · ")}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-semibold text-gray-950">{formatMoney(payment.amount)}</div>
                      <div className="mt-1 text-xs text-gray-400">{payment.internalCode || ""}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
