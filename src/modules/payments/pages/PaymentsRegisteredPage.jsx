import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, Layers3, ReceiptText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import OperationalBlockState from "../../../shared/ui/OperationalBlockState";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalDataTable from "../../../shared/ui/OperationalDataTable";
import OperationalSearchBar from "../../../shared/ui/OperationalSearchBar";
import { useAuth } from "../../../lib/auth";
import { getRegisteredPayments } from "../services/payments.service";

function formatDate(value) {
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

function formatDueDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar la lista de pagos.";
}

function isSecretaryRole(activeRole) {
  return String(activeRole || "").toUpperCase().startsWith("SECRETARY");
}

const METHOD_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "CASH", label: "Efectivo" },
  { value: "YAPE", label: "Yape" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "CAJA_AREQUIPA", label: "Caja Arequipa" },
];

export default function PaymentsRegisteredPage() {
  const { activeRole, activeCampus } = useAuth();
  const secretaryMode = isSecretaryRole(activeRole);
  const [campus, setCampus] = useState(activeCampus === "ALL" ? "" : activeCampus);
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (secretaryMode) {
      setCampus(activeCampus === "ALL" ? "" : activeCampus);
    }
  }, [secretaryMode, activeCampus]);

  const query = useQuery({
    queryKey: ["payments", "registered", campus || "ALL", method || "ALL", page],
    queryFn: () => getRegisteredPayments({ campus: campus || undefined, method: method || undefined, page, limit: 25 }),
    keepPreviousData: true,
  });

  const rows = useMemo(() => (Array.isArray(query.data?.items) ? query.data.items : []), [query.data]);
  const pageInfo = query.data?.pageInfo || { page: 1, limit: 25, hasNext: false };

  const columns = useMemo(
    () => [
      { key: "studentName", header: "Alumno", accessor: (row) => row.studentName || "-", sortType: "string", cellClassName: "text-gray-900" },
      { key: "studentDni", header: "DNI", accessor: (row) => row.studentDni || "-", sortType: "string" },
      { key: "studentCode", header: "Código", accessor: (row) => row.studentCode || "-", sortType: "string" },
      { key: "conceptLabel", header: "Concepto", accessor: (row) => row.conceptLabel || "-", sortType: "string" },
      { key: "paidAt", header: "Fecha", accessor: (row) => row.paidAt || "", sortType: "date", render: (row) => formatDate(row.paidAt) },
      { key: "originLabel", header: "Origen", accessor: (row) => row.originLabel || "-", sortType: "string" },
      { key: "dueDate", header: "Vencimiento", accessor: (row) => row.dueDate || "", sortType: "date", render: (row) => formatDueDate(row.dueDate) },
    ],
    [],
  );

  const currentCampusLabel = campus || (activeCampus === "ALL" ? "Todos" : activeCampus) || "Todos";
  const currentMethodLabel = METHOD_OPTIONS.find((item) => item.value === method)?.label || "Todos";

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: currentCampusLabel },
          { key: "Vista", value: "Pagos registrados" },
          { key: "Filas", value: `${rows.length} pagos`, icon: ReceiptText },
          { key: "Método", value: currentMethodLabel, icon: CreditCard, grow: true },
        ]}
      />

      <OperationalSearchBar className="py-2.5">
        <div className="grid gap-3 md:grid-cols-6 md:items-end">
          {!secretaryMode ? (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Campus</label>
              <input
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                value={campus}
                onChange={(e) => {
                  setCampus(e.target.value.toUpperCase());
                  setPage(1);
                }}
                placeholder="Ej. CIENCIAS"
              />
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Campus</label>
              <input className="w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600" value={campus} disabled />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Método</label>
            <select
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setPage(1);
              }}
            >
              {METHOD_OPTIONS.map((option) => (
                <option key={option.value || "ALL"} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                <span>Página <strong className="text-gray-900">{pageInfo.page || page}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </OperationalSearchBar>

      {query.isLoading ? (
        <OperationalBlockState message="Cargando pagos registrados..." minHeight="420px" />
      ) : query.isError ? (
        <OperationalBlockState mode="error" message={getErrorMessage(query.error)} minHeight="420px" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4">
            <h2 className="text-base font-semibold text-gray-900">Pagos registrados</h2>
            <p className="mt-1 text-sm text-gray-600">
              Consulta pagos guardados en base de datos con su concepto, origen y vencimiento asociado.
            </p>
          </div>

          <OperationalDataTable
            columns={columns}
            data={rows}
            rowKey="paymentId"
            bodyScrollClassName={`h-[48vh] min-h-0 overflow-auto ${query.isFetching ? "bg-gray-50/40" : ""}`}
            emptyMessage="No hay pagos para los filtros seleccionados."
            emptyMinHeight="48vh"
          />

          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">Mostrando hasta {pageInfo.limit || 25} pagos por página.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || query.isFetching}
              >
                Anterior
              </button>
              <button
                type="button"
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!pageInfo.hasNext || query.isFetching}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
