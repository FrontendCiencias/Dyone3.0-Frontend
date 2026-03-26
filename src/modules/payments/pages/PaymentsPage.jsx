import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, Filter, Users, Wallet2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import OperationalBlockState from "../../../shared/ui/OperationalBlockState";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalSearchBar from "../../../shared/ui/OperationalSearchBar";
import OperationalSummaryCard from "../../../shared/ui/OperationalSummaryCard";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { usePaymentsDebtorsQuery } from "../hooks/usePaymentsDebtorsQuery";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function translateConceptCode(code) {
  const normalized = String(code || "").toUpperCase();
  const labels = {
    TUITION: "Pensiones",
    ADMISSION_FEE: "Derecho de Ingreso",
    ENROLLMENT_FEE: "Matricula",
    PLANNER: "Agenda",
    SCHOOL_BOOKS: "Libros",
    UNIFORM: "Uniforme",
    TRANSPORT: "Transporte",
    OTHER: "Otros",
  };
  return labels[normalized] || code || "-";
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar la cartera.";
}

function isSecretaryRole(activeRole) {
  return String(activeRole || "").toUpperCase().startsWith("SECRETARY");
}

function mapRow(item) {
  return {
    id: item?.studentId || item?.id || item?._id,
    names: item?.names || item?.student?.names || "",
    lastNames: item?.lastNames || item?.student?.lastNames || "",
    dni: item?.dni || item?.student?.dni || "",
    code: item?.code || item?.student?.code || "",
    campus: item?.campus || item?.student?.campus || "",
    totalPending: Number(item?.totalPending || 0),
    totalOverdue: Number(item?.totalOverdue || 0),
    conceptStatusByCode: item?.conceptStatusByCode || {},
  };
}

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { activeRole, activeCampus } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState(activeCampus === "ALL" ? "" : activeCampus);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [page, setPage] = useState(1);

  const secretaryMode = isSecretaryRole(activeRole);
  const isSearchMode = debouncedSearch.trim().length >= 2;
  const searchPageSize = 15;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, campusFilter, onlyOverdue]);

  useEffect(() => {
    if (secretaryMode) {
      setCampusFilter(activeCampus === "ALL" ? "" : activeCampus);
    }
  }, [activeRole, activeCampus, secretaryMode]);

  const listQuery = usePaymentsDebtorsQuery(
    { campus: campusFilter || undefined, limit: 25, cursor: page, onlyOverdue },
    !isSearchMode,
    "list",
  );

  const searchQuery = usePaymentsDebtorsQuery(
    { q: debouncedSearch, campus: campusFilter || undefined, limit: 60 },
    isSearchMode,
    "search",
  );

  const activeQuery = isSearchMode ? searchQuery : listQuery;
  const conceptColumns = useMemo(
    () => (Array.isArray(activeQuery.data?.conceptColumns) ? activeQuery.data.conceptColumns : []),
    [activeQuery.data],
  );
  const rows = useMemo(
    () => (Array.isArray(activeQuery.data?.items) ? activeQuery.data.items : []).map(mapRow).filter((row) => row.id),
    [activeQuery.data],
  );
  const pageInfo = activeQuery.data?.pageInfo || { page: 1, limit: 25, hasNext: false };
  const searchTotalPages = Math.max(1, Math.ceil(rows.length / searchPageSize));
  const visibleRows = useMemo(() => {
    if (!isSearchMode) return rows;
    const start = (page - 1) * searchPageSize;
    return rows.slice(start, start + searchPageSize);
  }, [isSearchMode, page, rows]);
  const canGoPrev = page > 1;
  const canGoNext = isSearchMode ? page < searchTotalPages : Boolean(pageInfo.hasNext);

  const visibleStudents = visibleRows.length;
  const totalPending = useMemo(
    () => visibleRows.reduce((acc, row) => acc + Number(row.totalPending || 0), 0),
    [visibleRows],
  );
  const totalOverdue = useMemo(
    () => visibleRows.reduce((acc, row) => acc + Number(row.totalOverdue || 0), 0),
    [visibleRows],
  );
  const filterModeLabel = onlyOverdue ? "Solo vencidos" : "Toda la cartera";
  const currentCampusLabel = campusFilter || (activeCampus === "ALL" ? "Todos" : activeCampus) || "Todos";

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: currentCampusLabel },
          { key: "Vista", value: "Cartera por alumno" },
          { key: "Visibles", value: `${visibleStudents} alumnos`, icon: Users },
          { key: "Filtro", value: filterModeLabel, icon: Filter, grow: true },
        ]}
      />

      {activeQuery.isError ? (
        <OperationalBlockState mode="error" minHeight="120px" message={getErrorMessage(activeQuery.error)} />
      ) : (
        <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-4 ${activeQuery.isFetching ? "opacity-75" : ""}`}>
          <OperationalSummaryCard
            label="Alumnos"
            value={String(visibleStudents)}
            hint={isSearchMode ? "Resultados de búsqueda" : "Registros visibles en cartera"}
            icon={Users}
            variant="neutral"
            loading={activeQuery.isLoading}
          />
          <OperationalSummaryCard
            label="Pendiente"
            value={formatMoney(totalPending)}
            hint="Suma de deuda visible"
            icon={Clock3}
            variant="neutral"
            loading={activeQuery.isLoading}
          />
          <OperationalSummaryCard
            label="Vencido"
            value={formatMoney(totalOverdue)}
            hint="Deuda vencida visible"
            icon={AlertCircle}
            variant="amber"
            loading={activeQuery.isLoading}
          />
          <OperationalSummaryCard
            label="Caja del día"
            value="Abrir vista"
            hint="Resumen operativo e historico por fecha"
            actionLabel="Ir a caja"
            icon={Wallet2}
            variant="blue"
            onAction={() => navigate(ROUTES.dashboardPaymentsDailyCash)}
          />
        </div>
      )}

      <OperationalSearchBar>
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <Input
              label="Buscar alumno"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="DNI, nombres, apellidos o codigo"
            />
          </div>

          {!secretaryMode ? (
            <div className="md:col-span-3">
              <Input
                label="Campus"
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                placeholder="CIMAS / CIENCIAS..."
              />
            </div>
          ) : (
            <div className="md:col-span-3">
              <Input label="Campus" value={campusFilter} disabled />
            </div>
          )}

          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">Filtro rapido</label>
            <button
              type="button"
              className={[
                "inline-flex h-[42px] w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
                onlyOverdue
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
              ].join(" ")}
              onClick={() => setOnlyOverdue((prev) => !prev)}
              disabled={isSearchMode}
            >
              {onlyOverdue ? "Solo vencidos" : "Mostrar todos"}
            </button>
          </div>
        </div>
      </OperationalSearchBar>

      {activeQuery.isLoading ? (
        <OperationalBlockState message="Cargando cartera..." minHeight="420px" />
      ) : activeQuery.isError ? (
        <OperationalBlockState mode="error" message={getErrorMessage(activeQuery.error)} minHeight="420px" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Cartera por alumno</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Consulta deuda resumida por alumno y abre el detalle para registrar pagos o revisar cargos.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 md:flex">
                <Wallet2 className="h-4 w-4" />
                <span>{formatMoney(totalPending)} pendientes visibles</span>
              </div>
            </div>
          </div>

          <div className={`h-[34vh] overflow-auto ${activeQuery.isFetching ? "bg-gray-50/40" : ""}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Alumno</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">DNI</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Codigo</th>
                    {conceptColumns.map((column) => (
                      <th key={column.code} className="px-4 py-3 text-left font-medium text-gray-700">
                        {translateConceptCode(column.code)}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Pendiente</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Vencido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {visibleRows.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer transition hover:bg-gray-50"
                      onClick={() => navigate(ROUTES.dashboardPaymentDetail(row.id))}
                    >
                      <td className="px-4 py-3 text-gray-900">{[row.lastNames, row.names].filter(Boolean).join(", ") || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{row.dni || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{row.code || "-"}</td>
                      {conceptColumns.map((column) => {
                        const concept = row.conceptStatusByCode?.[column.code];
                        return (
                          <td key={`${row.id}-${column.code}`} className="px-4 py-3 text-gray-700">
                            {concept?.owes ? formatMoney(concept.pendingAmount) : "No debe"}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(row.totalPending)}</td>
                      <td className="px-4 py-3 font-medium text-amber-700">{formatMoney(row.totalOverdue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!rows.length ? (
            <div className="border-t border-gray-200 px-4 py-6 text-sm text-gray-500">
              {isSearchMode ? "No se encontraron alumnos para esa busqueda." : "No hay deudores para los filtros seleccionados."}
            </div>
          ) : null}

          {rows.length ? (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <SecondaryButton onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={!canGoPrev}>
                Anterior
              </SecondaryButton>
              <p className="text-sm text-gray-600">
                Pagina {page}
                {isSearchMode ? ` de ${searchTotalPages}` : ""}
              </p>
              <SecondaryButton onClick={() => setPage((prev) => prev + 1)} disabled={!canGoNext}>
                Siguiente
              </SecondaryButton>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
