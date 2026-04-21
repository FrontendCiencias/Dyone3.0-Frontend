import React, { useMemo, useState } from "react";
import { Landmark, ReceiptText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Button from "../../../components/ui/Button";
import OperationalBlockState from "../../../shared/ui/OperationalBlockState";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalDataTable from "../../../shared/ui/OperationalDataTable";
import OperationalSearchBar from "../../../shared/ui/OperationalSearchBar";
import { useAuth } from "../../../lib/auth";
import { getAccountingPayments } from "../../payments/services/payments.service";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

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

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar la lista de pagos.";
}

const METHOD_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "CASH", label: "Efectivo" },
  { value: "YAPE", label: "Yape" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "CAJA_AREQUIPA", label: "Caja Arequipa" },
];

export default function AdminAccountingPage() {
  const { activeCampus } = useAuth();
  const [campus, setCampus] = useState(activeCampus === "ALL" ? "" : activeCampus);
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["payments", "accounting", campus || "ALL", method || "ALL", page],
    queryFn: () => getAccountingPayments({ campus: campus || undefined, method: method || undefined, page, limit: 25 }),
    keepPreviousData: true,
  });

  const rows = useMemo(() => (Array.isArray(query.data?.items) ? query.data.items : []), [query.data]);
  const pageInfo = query.data?.pageInfo || { page: 1, limit: 25, hasNext: false };

  const columns = useMemo(
    () => [
      { key: "paidAt", header: "Fecha", accessor: (row) => row.paidAt || "", sortType: "date", render: (row) => formatDate(row.paidAt) },
      { key: "methodLabel", header: "Método", accessor: (row) => row.methodLabel || row.method || "-", sortType: "string" },
      { key: "amount", header: "Monto", accessor: (row) => Number(row.amount || 0), sortType: "number", align: "right", render: (row) => formatMoney(row.amount), cellClassName: "font-medium text-gray-900" },
      { key: "studentName", header: "Alumno", accessor: (row) => row.studentName || "-", sortType: "string" },
      { key: "studentDni", header: "DNI", accessor: (row) => row.studentDni || "-", sortType: "string" },
      { key: "studentCode", header: "Cod. interno", accessor: (row) => row.studentCode || "-", sortType: "string" },
      { key: "campusCode", header: "Campus", accessor: (row) => row.campusCode || "-", sortType: "string" },
      { key: "internalCode", header: "Recibo interno", accessor: (row) => row.internalCode || "-", sortType: "string" },
      { key: "voucherNumber", header: "Voucher", accessor: (row) => row.voucherNumber || "-", sortType: "string" },
      { key: "receiptNumber", header: "Recibo físico", accessor: (row) => row.receiptNumber || "-", sortType: "string" },
    ],
    [],
  );

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: campus || "Todos" },
          { key: "Vista", value: "Contabilidad" },
          { key: "Filas", value: `${rows.length} pagos`, icon: ReceiptText },
          { key: "Método", value: METHOD_OPTIONS.find((item) => item.value === method)?.label || "Todos", icon: Landmark, grow: true },
        ]}
      />

      <OperationalSearchBar className="py-3">
        <div className="grid gap-3 md:grid-cols-6 md:items-end">
          <div>
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
          <div>
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
        </div>
      </OperationalSearchBar>

      {query.isLoading ? (
        <OperationalBlockState message="Cargando pagos..." minHeight="360px" />
      ) : query.isError ? (
        <OperationalBlockState mode="error" message={getErrorMessage(query.error)} minHeight="360px" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Pagos registrados</h2>
                <p className="mt-1 text-sm text-gray-600">Vista administrativa global para revisar métodos y ubicar pagos de Caja Arequipa.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Página <span className="font-semibold">{pageInfo.page || page}</span>
              </div>
            </div>
          </div>

          <OperationalDataTable
            columns={columns}
            data={rows}
            rowKey="paymentId"
            bodyScrollClassName={`h-[46vh] min-h-0 overflow-auto ${query.isFetching ? "bg-gray-50/40" : ""}`}
            emptyMessage="No hay pagos para los filtros seleccionados."
            emptyMinHeight="46vh"
          />

          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">Mostrando hasta {pageInfo.limit || 25} pagos por página.</p>
            <div className="flex gap-2">
              <Button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1 || query.isFetching}>
                Anterior
              </Button>
              <Button type="button" onClick={() => setPage((prev) => prev + 1)} disabled={!pageInfo.hasNext || query.isFetching}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
