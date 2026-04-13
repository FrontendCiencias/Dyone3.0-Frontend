import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, Coins, Filter, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import OperationalBlockState from "../../../shared/ui/OperationalBlockState";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalDataTable from "../../../shared/ui/OperationalDataTable";
import OperationalSearchBar from "../../../shared/ui/OperationalSearchBar";
import OperationalSummaryCard from "../../../shared/ui/OperationalSummaryCard";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { CAPABILITIES, hasCapability } from "../../auth/utils/capabilities";
import { useActivitiesListQuery } from "../hooks/useActivitiesListQuery";
import { useCreateActivityMutation } from "../hooks/useCreateActivityMutation";
import ActivityFormModal from "../components/ActivityFormModal";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar las actividades.";
}

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const { activeRole, activeCampus } = useAuth();
  const canManage = hasCapability(activeRole, CAPABILITIES.activitiesManage);
  const secretaryLike = String(activeRole || "").toUpperCase() === "SECRETARY" || String(activeRole || "").toUpperCase() === "AUXILIAR";

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState(activeCampus === "ALL" ? "" : activeCampus);
  const [statusFilter, setStatusFilter] = useState("");
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (secretaryLike) {
      setCampusFilter(activeCampus === "ALL" ? "" : activeCampus);
    }
  }, [activeCampus, secretaryLike]);

  const listQuery = useActivitiesListQuery({
    q: debouncedSearch || undefined,
    campus: campusFilter || undefined,
    status: statusFilter || undefined,
    limit: 50,
  });
  const createMutation = useCreateActivityMutation();

  const items = Array.isArray(listQuery.data?.items) ? listQuery.data.items : [];
  const visibleCount = items.length;
  const activeCount = items.filter((item) => item.status === "ACTIVE").length;
  const totalCollected = items.reduce((acc, item) => acc + Number(item?.summary?.totalCollected || 0), 0);
  const pendingCount = items.reduce((acc, item) => acc + Number(item?.summary?.pendingCount || 0), 0);
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Nombre",
        accessor: (item) => item.name || "-",
        sortType: "string",
        cellClassName: "text-gray-900",
        render: (item) => (
          <>
            <div className="font-medium">{item.name}</div>
            <div className="text-xs text-gray-500">{item.typeLabel}</div>
          </>
        ),
      },
      {
        key: "campus",
        header: "Campus",
        accessor: (item) => item.campus?.code || "-",
        sortType: "string",
      },
      {
        key: "audience",
        header: "Alcance",
        accessor: (item) => item.audienceLabel || "-",
        sortType: "string",
      },
      {
        key: "amount",
        header: "Monto",
        accessor: (item) => Number(item.amount || 0),
        sortType: "number",
        render: (item) => formatMoney(item.amount),
      },
      {
        key: "status",
        header: "Estado",
        accessor: (item) => item.status || "-",
        sortType: "string",
      },
      {
        key: "paidCount",
        header: "Pagados",
        accessor: (item) => Number(item.summary?.paidCount || 0),
        sortType: "number",
      },
      {
        key: "pendingCount",
        header: "Pendientes",
        accessor: (item) => Number(item.summary?.pendingCount || 0),
        sortType: "number",
      },
      {
        key: "collected",
        header: "Recaudado",
        accessor: (item) => Number(item.summary?.totalCollected || 0),
        sortType: "number",
        cellClassName: "font-medium text-gray-900",
        render: (item) => formatMoney(item.summary?.totalCollected || 0),
      },
    ],
    [],
  );

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: campusFilter || (activeCampus === "ALL" ? "Todos" : activeCampus) || "Todos" },
          { key: "Vista", value: "Actividades" },
          { key: "Visibles", value: `${visibleCount} actividades`, icon: Sparkles },
          { key: "Estado", value: statusFilter || "Todas", icon: Filter, grow: true },
        ]}
      />

      <div className={`grid gap-3 md:grid-cols-2 ${canManage ? "xl:grid-cols-5" : "xl:grid-cols-4"} ${listQuery.isFetching ? "opacity-75" : ""}`}>
        <OperationalSummaryCard
          label="Actividades"
          value={String(visibleCount)}
          hint="Resultados visibles"
          icon={Sparkles}
          loading={listQuery.isLoading}
        />
        <OperationalSummaryCard
          label="Activas"
          value={String(activeCount)}
          hint="Listas para cobrar"
          icon={CalendarClock}
          variant="green"
          loading={listQuery.isLoading}
        />
        <OperationalSummaryCard
          label="Pendientes"
          value={String(pendingCount)}
          hint="Alumnos que faltan pagar"
          icon={Users}
          variant="amber"
          loading={listQuery.isLoading}
        />
        <OperationalSummaryCard
          label="Recaudado"
          value={formatMoney(totalCollected)}
          hint="Suma visible en actividades"
          icon={Coins}
          variant="blue"
          loading={listQuery.isLoading}
        />
        {canManage ? (
          <OperationalSummaryCard
            label="Nueva actividad"
            value="Crear"
            hint="Concurso, evento o campaña"
            icon={Sparkles}
            actionLabel="Abrir"
            onAction={() => setOpenForm(true)}
          />
        ) : null}
      </div>

      <OperationalSearchBar>
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <Input
              label="Buscar actividad"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nombre o campaña"
            />
          </div>

          <div className="md:col-span-3">
            {secretaryLike ? (
              <Input label="Campus" value={campusFilter} disabled />
            ) : (
              <Input label="Campus" value={campusFilter} onChange={(e) => setCampusFilter(e.target.value.toUpperCase())} placeholder="CIENCIAS" />
            )}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
            <select className="h-[42px] w-full rounded-xl border border-gray-300 px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todas</option>
              <option value="ACTIVE">Activas</option>
              <option value="CLOSED">Cerradas</option>
              <option value="LIQUIDATED">Liquidadas</option>
            </select>
          </div>

          <div className="md:col-span-2">
            {canManage ? (
              <Button className="h-[42px] w-full" onClick={() => setOpenForm(true)}>Nueva actividad</Button>
            ) : (
              <div className="h-[42px]" />
            )}
          </div>
        </div>
      </OperationalSearchBar>

      {listQuery.isLoading ? (
        <OperationalBlockState message="Cargando actividades..." minHeight="420px" />
      ) : listQuery.isError ? (
        <OperationalBlockState mode="error" message={getErrorMessage(listQuery.error)} minHeight="420px" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Actividades</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Gestiona concursos, eventos y recaudaciones especiales separadas de la caja diaria ordinaria.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 md:flex">
                <Coins className="h-4 w-4" />
                <span>{formatMoney(totalCollected)} visibles</span>
              </div>
            </div>
          </div>

          <div className={`h-[48vh] overflow-auto ${listQuery.isFetching ? "bg-gray-50/40" : ""}`}>
            <OperationalDataTable
              columns={columns}
              data={items}
              rowKey={(item) => item.id}
              onRowClick={(item) => navigate(ROUTES.dashboardActivityDetail(item.id))}
            />
          </div>

          {!items.length ? (
            <div className="border-t border-gray-200 px-4 py-6 text-sm text-gray-500">
              No se encontraron actividades con esos filtros.
            </div>
          ) : null}
        </div>
      )}

      <ActivityFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        defaultCampus={activeCampus === "ALL" ? "" : activeCampus}
        submitting={createMutation.isPending}
        onSubmit={async (payload) => {
          await createMutation.mutateAsync(payload);
          setOpenForm(false);
        }}
      />
    </div>
  );
}
