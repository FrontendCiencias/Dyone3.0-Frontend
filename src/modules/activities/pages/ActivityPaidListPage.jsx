import React, { useMemo, useState } from "react";
import { Eye, Pencil, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import OperationalBlockState from "../../../shared/ui/OperationalBlockState";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalDataTable from "../../../shared/ui/OperationalDataTable";
import OperationalSummaryCard from "../../../shared/ui/OperationalSummaryCard";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { CAPABILITIES, hasCapability } from "../../auth/utils/capabilities";
import { useActivityDetailQuery } from "../hooks/useActivityDetailQuery";
import { useUpdateActivityCollectionMutation } from "../hooks/useUpdateActivityCollectionMutation";
import { getActivityCollectionReceipt } from "../services/activities.service";
import { printActivityReceipt } from "../components/activityReceipt";
import ActivityCollectionEditModal from "../components/ActivityCollectionEditModal";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error) {
  const message = error?.response?.data?.message || error?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "No se pudo cargar la lista de pagados.";
}

function getStudentLabel(student) {
  return [student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno";
}

export default function ActivityPaidListPage() {
  const navigate = useNavigate();
  const params = useParams();
  const activityId = params?.activityId || null;
  const { activeRole } = useAuth();
  const canManage = hasCapability(activeRole, CAPABILITIES.activitiesManage);
  const detailQuery = useActivityDetailQuery(activityId, Boolean(activityId));
  const updateCollectionMutation = useUpdateActivityCollectionMutation(activityId);
  const [editingItem, setEditingItem] = useState(null);

  const activity = detailQuery.data?.activity || null;
  const participants = Array.isArray(detailQuery.data?.participants) ? detailQuery.data.participants : [];

  const paidParticipants = useMemo(
    () =>
      participants
        .filter((item) => item?.status === "PAID")
        .sort((a, b) => getStudentLabel(a?.student).localeCompare(getStudentLabel(b?.student), "es")),
    [participants],
  );

  const totalCollected = useMemo(
    () => paidParticipants.reduce((acc, item) => acc + Number(item?.latestCollection?.amount || 0), 0),
    [paidParticipants],
  );

  const columns = useMemo(
    () => [
      {
        key: "student",
        header: "Estudiante",
        accessor: (item) => getStudentLabel(item.student),
        sortType: "string",
        cellClassName: "text-gray-900",
      },
      {
        key: "dni",
        header: "DNI",
        accessor: (item) => item?.student?.dni || "-",
        sortType: "string",
      },
      {
        key: "internalCode",
        header: "Cod. interno",
        accessor: (item) => item?.student?.internalCode || "-",
        sortType: "string",
      },
      {
        key: "classroom",
        header: "Aula",
        accessor: (item) => item?.student?.classroomDisplayName || "-",
        sortType: "string",
      },
      {
        key: "receipt",
        header: "Recibo",
        accessor: (item) => item?.latestCollection?.receiptInternalCode || "-",
        sortType: "string",
      },
      {
        key: "date",
        header: "Fecha",
        accessor: (item) => item?.latestCollection?.collectedAt || null,
        sortType: "date",
        render: (item) => formatDate(item?.latestCollection?.collectedAt),
      },
      {
        key: "amount",
        header: "Monto",
        accessor: (item) => Number(item?.latestCollection?.amount || 0),
        sortType: "number",
        cellClassName: "font-medium text-gray-900",
        render: (item) => formatMoney(item?.latestCollection?.amount || 0),
      },
      {
        key: "collector",
        header: "Cobrado por",
        accessor: (item) => item?.latestCollection?.collectorName || "-",
        sortType: "string",
        render: (item) => (
          <>
            {item?.latestCollection?.collectorName || "-"}
            {item?.latestCollection?.collectorRole ? (
              <div className="text-xs uppercase tracking-[0.14em] text-gray-400">{item.latestCollection.collectorRole}</div>
            ) : null}
          </>
        ),
      },
      {
        key: "action",
        header: "Acciones",
        sortable: false,
        cellClassName: "text-right",
        headerCellClassName: "text-right",
        render: (item) =>
          item?.latestCollection?.id ? (
            <div className="flex items-center justify-end gap-2">
              {canManage ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditingItem(item);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Editar pago"
                  title="Editar pago"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handlePrintReceipt(item.latestCollection.id);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800"
                aria-label="Ver recibo"
                title="Ver recibo"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          ),
      },
    ],
    [canManage],
  );

  const handlePrintReceipt = async (collectionId) => {
    if (!collectionId) return;
    const receipt = await getActivityCollectionReceipt(collectionId);
    printActivityReceipt(receipt);
  };

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-0 flex-col gap-4">
        <OperationalContextBar
          items={[
            { key: "Campus", value: "-" },
            { key: "Actividad", value: "Cargando...", grow: true },
          ]}
          onBack={() => navigate(ROUTES.dashboardActivityDetail(activityId))}
          backLabel="Volver a actividad"
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <OperationalSummaryCard key={index} label="Cargando" value="..." icon={Users} loading />
          ))}
        </div>
        <OperationalBlockState message="Cargando lista de pagados..." minHeight="220px" />
      </div>
    );
  }

  if (detailQuery.isError) {
    return <OperationalBlockState mode="error" message={getErrorMessage(detailQuery.error)} minHeight="220px" />;
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: activity?.campus?.code || "-" },
          { key: "Actividad", value: activity?.name || "-", grow: true },
          { key: "Pagados", value: String(paidParticipants.length) },
        ]}
        onBack={() => navigate(ROUTES.dashboardActivityDetail(activityId))}
        backLabel="Volver a actividad"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <OperationalSummaryCard
          label="Pagados"
          value={String(paidParticipants.length)}
          hint="Participantes con pago registrado"
          icon={Users}
          variant="green"
        />
        <OperationalSummaryCard
          label="Recaudado"
          value={formatMoney(totalCollected)}
          hint="Monto visible de los pagos listados"
          icon={Users}
          variant="blue"
        />
        <OperationalSummaryCard
          label="Actividad"
          value={activity?.name || "-"}
          hint={activity?.audienceLabel || "Sin alcance"}
          icon={Users}
          variant="neutral"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Lista de pagados</h2>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-0 text-sm text-gray-600">
              {paidParticipants.length} registros
            </div>
          </div>
        </div>

        {!paidParticipants.length ? (
          <div className="h-[42vh]">
            <OperationalBlockState mode="empty" message="Aun no hay estudiantes pagados en esta actividad." minHeight="220px" />
          </div>
        ) : (
          <div className="h-[42vh]">
            <OperationalDataTable columns={columns} data={paidParticipants} rowKey={(item) => item.id} />
          </div>
        )}
      </div>

      {canManage ? (
        <ActivityCollectionEditModal
          open={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          activity={activity}
          item={editingItem}
          submitting={updateCollectionMutation.isPending}
          onSubmit={async ({ collectionId, payload }) => {
            await updateCollectionMutation.mutateAsync({ collectionId, payload });
            setEditingItem(null);
          }}
        />
      ) : null}
    </div>
  );
}
