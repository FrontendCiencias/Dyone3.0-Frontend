import React, { useMemo, useState } from "react";
import {
  Eye,
  LayoutGrid,
  List,
  ListFilter,
  Pencil,
  Search,
  Sparkles,
  UserCheck,
  UserRoundPlus,
  Users,
  Wallet2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import OperationalBlockState from "../../../shared/ui/OperationalBlockState";
import OperationalContextBar from "../../../shared/ui/OperationalContextBar";
import OperationalSearchBar from "../../../shared/ui/OperationalSearchBar";
import OperationalSummaryCard from "../../../shared/ui/OperationalSummaryCard";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { CAPABILITIES, hasCapability } from "../../auth/utils/capabilities";
import { useActivityDetailQuery } from "../hooks/useActivityDetailQuery";
import { useActivityStudentSearchQuery } from "../hooks/useActivityStudentSearchQuery";
import { useCreateActivityCollectionMutation } from "../hooks/useCreateActivityCollectionMutation";
import { useAddActivityParticipantMutation } from "../hooks/useAddActivityParticipantMutation";
import { useUpdateActivityMutation } from "../hooks/useUpdateActivityMutation";
import { getActivityCollectionReceipt } from "../services/activities.service";
import ActivityCollectModal from "../components/ActivityCollectModal";
import ActivityFormModal from "../components/ActivityFormModal";
import { printActivityReceipt } from "../components/activityReceipt";

function formatMoney(value) {
  const amount = Number(value || 0);
  return `S/ ${Number.isNaN(amount) ? "0.00" : amount.toFixed(2)}`;
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar la actividad.";
}

function participantMatchesSearch(participant, search) {
  const term = String(search || "").trim().toLowerCase();
  if (!term) return true;
  const haystack = [
    participant?.student?.internalCode,
    participant?.student?.bankCode,
    participant?.student?.dni,
    participant?.student?.lastNames,
    participant?.student?.names,
    participant?.student?.classroomDisplayName,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(term);
}

function getStudentLabel(student) {
  return [student?.lastNames, student?.names].filter(Boolean).join(", ") || "Alumno";
}

function getParticipantBadge(status) {
  if (status === "PAID") return "bg-emerald-100 text-emerald-700";
  if (status === "ANULADO") return "bg-slate-200 text-slate-600";
  return "bg-amber-100 text-amber-700";
}

function ParticipantCard({ item, canCollect, canPrint, onCollect, onPrint }) {
  const studentLabel = getStudentLabel(item?.student);
  const paid = item?.status === "PAID";

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${paid ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{studentLabel}</p>
          <p className="mt-1 text-xs text-gray-500">
            {item?.student?.internalCode || "-"} · {item?.student?.dni || "-"}
          </p>
          <p className="mt-1 text-xs text-gray-500">{item?.student?.classroomDisplayName || "Sin salón"}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">{item?.status || "-"}</p>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getParticipantBadge(item?.status)}`}>
          {paid ? "Pagado" : item?.status === "ANULADO" ? "Anulado" : "Pendiente"}
        </div>
      </div>

      {item?.latestCollection ? (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white/80 px-3 py-2 text-xs text-gray-600">
          <p>{item.latestCollection.receiptInternalCode} · {formatMoney(item.latestCollection.amount)}</p>
          <p className="mt-1">
            {item.latestCollection.collectorRole} · {item.latestCollection.collectorName || "Usuario"}
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!paid && canCollect ? (
          <Button className="h-[36px]" onClick={() => onCollect?.(item.student)}>Cobrar</Button>
        ) : null}
        {paid && canPrint ? (
          <SecondaryButton className="h-[36px]" onClick={() => onPrint?.(item.latestCollection?.id)}>
            <Eye className="mr-1 h-4 w-4" />
            Recibo
          </SecondaryButton>
        ) : null}
      </div>
    </div>
  );
}

function SectionModeToggle({ value, onChange }) {
  const options = [
    { value: "student", label: "Por alumno", icon: Search },
    { value: "classroom", label: "Por salón", icon: LayoutGrid },
  ];

  return (
    <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
      {options.map((option) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ClassroomCollectionPanel({ groups, selectedClassroomId, onSelectClassroom, canCollect, canPrintReceipt, onCollect, onPrint }) {
  const selected = groups.find((group) => group.classroomId === selectedClassroomId) || groups[0] || null;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.95fr_1.3fr]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4">
          <h3 className="text-base font-semibold text-gray-900">Salones</h3>
          <p className="mt-1 text-sm text-gray-600">Elige un salón para ver quién ya pagó y quién falta.</p>
        </div>
        <div className="max-h-[44vh] overflow-auto p-4">
          <div className="grid gap-3">
            {groups.map((group) => {
              const active = group.classroomId === selected?.classroomId;
              return (
                <button
                  key={group.classroomId}
                  type="button"
                  onClick={() => onSelectClassroom(group.classroomId)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    active ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{group.classroomDisplayName}</p>
                      <p className={`mt-1 text-xs ${active ? "text-slate-200" : "text-gray-500"}`}>
                        {group.pendingCount} pendientes · {group.paidCount} pagados
                      </p>
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {group.participants.length}
                    </div>
                  </div>
                </button>
              );
            })}

            {!groups.length ? (
              <OperationalBlockState mode="empty" message="No hay participantes agrupables por salón." minHeight="160px" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{selected?.classroomDisplayName || "Selecciona un salón"}</h3>
              <p className="mt-1 text-sm text-gray-600">Vista rápida de pendientes y pagos registrados para ese salón.</p>
            </div>
            {selected ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {selected.pendingCount} pendientes
              </div>
            ) : null}
          </div>
        </div>

        <div className="max-h-[44vh] overflow-auto p-4">
          <div className="grid gap-3">
            {selected?.participants.map((item) => (
              <ParticipantCard
                key={item.id}
                item={item}
                canCollect={canCollect}
                canPrint={canPrintReceipt}
                onCollect={onCollect}
                onPrint={onPrint}
              />
            ))}

            {!selected ? <OperationalBlockState mode="empty" message="Selecciona un salón para comenzar." minHeight="160px" /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const activityDetailId = params?.activityId || null;
  const { activeRole } = useAuth();
  const normalizedRole = String(activeRole || "").toUpperCase();
  const isAuxiliar = normalizedRole === "AUXILIAR";

  const canManageCapability = hasCapability(activeRole, CAPABILITIES.activitiesManage);
  const canCollectCapability = hasCapability(activeRole, CAPABILITIES.activitiesCollect);
  const canReportCapability = hasCapability(activeRole, CAPABILITIES.activitiesReport);
  const canPrintReceipt = ["ADMIN", "SECRETARY"].includes(normalizedRole);

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [collectViewMode, setCollectViewMode] = useState("student");
  const [openCollect, setOpenCollect] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState(null);

  const detailQuery = useActivityDetailQuery(activityDetailId);
  const createCollectionMutation = useCreateActivityCollectionMutation(activityDetailId);
  const addParticipantMutation = useAddActivityParticipantMutation(activityDetailId);
  const updateActivityMutation = useUpdateActivityMutation();

  const activity = detailQuery.data?.activity || null;
  const participants = Array.isArray(detailQuery.data?.participants) ? detailQuery.data.participants : [];
  const collections = Array.isArray(detailQuery.data?.collections) ? detailQuery.data.collections : [];
  const collectorReport = Array.isArray(detailQuery.data?.collectorReport) ? detailQuery.data.collectorReport : [];
  const summary = detailQuery.data?.summary || {};
  const permissions = detailQuery.data?.permissions || {};

  const canManage = canManageCapability && permissions.canManage;
  const canCollect = canCollectCapability && permissions.canCollect;

  const visibleParticipants = useMemo(() => {
    return participants
      .filter((item) => (statusFilter ? item.status === statusFilter : true))
      .filter((item) => participantMatchesSearch(item, searchInput));
  }, [participants, searchInput, statusFilter]);

  const classroomGroups = useMemo(() => {
    const map = new Map();

    visibleParticipants.forEach((item) => {
      const classroomId = item?.student?.classroomId || "unassigned";
      const classroomDisplayName = item?.student?.classroomDisplayName || "Sin salón";
      if (!map.has(classroomId)) {
        map.set(classroomId, {
          classroomId,
          classroomDisplayName,
          participants: [],
          paidCount: 0,
          pendingCount: 0,
        });
      }
      const group = map.get(classroomId);
      group.participants.push(item);
      if (item.status === "PAID") group.paidCount += 1;
      else if (item.status !== "ANULADO") group.pendingCount += 1;
    });

    return [...map.values()]
      .sort((a, b) => a.classroomDisplayName.localeCompare(b.classroomDisplayName, "es"))
      .map((group) => ({
        ...group,
        participants: [...group.participants].sort((a, b) => {
          const aPaid = a.status === "PAID" ? 1 : 0;
          const bPaid = b.status === "PAID" ? 1 : 0;
          if (aPaid !== bPaid) return aPaid - bPaid;
          return getStudentLabel(a.student).localeCompare(getStudentLabel(b.student), "es");
        }),
      }));
  }, [visibleParticipants]);

  React.useEffect(() => {
    if (!classroomGroups.length) {
      setSelectedClassroomId(null);
      return;
    }

    if (!selectedClassroomId || !classroomGroups.some((group) => group.classroomId === selectedClassroomId)) {
      setSelectedClassroomId(classroomGroups[0].classroomId);
    }
  }, [classroomGroups, selectedClassroomId]);

  const searchQuery = useActivityStudentSearchQuery(
    { q: searchInput.trim(), campus: activity?.campus?.code, limit: 10 },
    collectViewMode === "student" && searchInput.trim().length >= 2,
  );

  const remoteSearchResults = useMemo(() => {
    const mapByStudentId = new Map(participants.map((item) => [String(item?.student?.id), item]));
    return (Array.isArray(searchQuery.data?.items) ? searchQuery.data.items : []).map((item) => ({
      ...item,
      participant: mapByStudentId.get(String(item.id)) || null,
    }));
  }, [participants, searchQuery.data]);

  const handleOpenCollect = (student) => {
    setSelectedStudent(student);
    setOpenCollect(true);
  };

  const handlePrintReceipt = async (collectionId) => {
    if (!collectionId) return;
    const receipt = await getActivityCollectionReceipt(collectionId);
    printActivityReceipt(receipt);
  };

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <OperationalContextBar
        items={[
          { key: "Campus", value: activity?.campus?.code || "-" },
          { key: "Estado", value: activity?.status || "-" },
          { key: "Monto", value: activity ? formatMoney(activity.amount) : "-" },
          { key: "Alcance", value: activity?.audienceLabel || "-", grow: true },
        ]}
        actions={canManage ? [{ label: "Editar", icon: Pencil, onClick: () => setOpenEdit(true) }] : []}
        onBack={() => navigate(ROUTES.dashboardActivities)}
        backLabel="Volver a actividades"
      />

      {detailQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <OperationalSummaryCard key={index} label="Cargando" value="..." icon={Sparkles} loading />
          ))}
        </div>
      ) : detailQuery.isError ? (
        <OperationalBlockState mode="error" message={getErrorMessage(detailQuery.error)} minHeight="120px" />
      ) : (
        <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-4 ${detailQuery.isFetching ? "opacity-75" : ""}`}>
          <OperationalSummaryCard label="Inscritos" value={String(summary.participantsCount || 0)} hint="Base de la actividad" icon={Users} />
          <OperationalSummaryCard label="Pagados" value={String(summary.paidCount || 0)} hint="Cobros cerrados" icon={UserCheck} variant="green" />
          <OperationalSummaryCard label="Recaudado" value={formatMoney(summary.totalCollected || 0)} hint="Total visible de la actividad" icon={Wallet2} variant="blue" />
          <OperationalSummaryCard
            label="Lista"
            value="Ver pagados"
            hint="Abrir tabla completa con DNI y recibos"
            icon={List}
            actionLabel="Abrir"
            onAction={() => navigate(ROUTES.dashboardActivityPaidList(activityDetailId))}
          />
        </div>
      )}

      <div className={`grid gap-4 ${isAuxiliar ? "" : "xl:grid-cols-[1.4fr_1fr]"}`}>
        <div className="min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4">
            <div className={`flex flex-col gap-3 ${isAuxiliar ? "" : "md:flex-row md:items-start md:justify-between"}`}>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {isAuxiliar ? "Cobranza de actividad" : "Participantes"}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {isAuxiliar
                    ? "Elige si quieres cobrar buscando al alumno o revisando salón por salón."
                    : "Revisa quién ya pagó en secretaría, auxiliar o admin, y registra cobros sin duplicarlos."}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start">
                {canCollect ? (
                  <SectionModeToggle value={collectViewMode} onChange={setCollectViewMode} />
                ) : null}
                {!isAuxiliar ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    {visibleParticipants.length} resultados
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-4">
            <OperationalSearchBar className="mb-4">
              <div className="grid gap-3 md:grid-cols-12 md:items-end">
                <div className={collectViewMode === "classroom" ? "md:col-span-8" : "md:col-span-7"}>
                  <Input
                    label={collectViewMode === "classroom" ? "Buscar alumno o salón" : "Buscar alumno"}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={collectViewMode === "classroom" ? "Salón, DNI, código, nombres o apellidos" : "DNI, código, nombres o apellidos"}
                  />
                </div>
                <div className={collectViewMode === "classroom" ? "md:col-span-2" : "md:col-span-3"}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
                  <select className="h-[42px] w-full rounded-xl border border-gray-300 px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="PAID">Pagados</option>
                    <option value="ANULADO">Anulados</option>
                  </select>
                </div>
                <div className={collectViewMode === "classroom" ? "md:col-span-2" : "md:col-span-2"}>
                  <div className="flex h-[42px] items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                    <ListFilter className="mr-2 h-4 w-4" />
                    {collectViewMode === "classroom" ? `${classroomGroups.length} salones` : `${visibleParticipants.length} visibles`}
                  </div>
                </div>
              </div>
            </OperationalSearchBar>

            {collectViewMode === "classroom" ? (
              <ClassroomCollectionPanel
                groups={classroomGroups}
                selectedClassroomId={selectedClassroomId}
                onSelectClassroom={setSelectedClassroomId}
                canCollect={canCollect}
                canPrintReceipt={canPrintReceipt}
                onCollect={handleOpenCollect}
                onPrint={handlePrintReceipt}
              />
            ) : (
              <div className="h-[52vh] overflow-auto">
                <div className="grid gap-3">
                  {visibleParticipants.map((item) => (
                    <ParticipantCard
                      key={item.id}
                      item={item}
                      canCollect={canCollect}
                      canPrint={canPrintReceipt}
                      onCollect={handleOpenCollect}
                      onPrint={handlePrintReceipt}
                    />
                  ))}

                  {!visibleParticipants.length && searchInput.trim().length >= 2 ? (
                    <>
                      {searchQuery.isLoading ? (
                        <OperationalBlockState message="Buscando alumno..." minHeight="120px" />
                      ) : remoteSearchResults.length ? (
                        remoteSearchResults.map((item) => {
                          const paid = item.participant?.status === "PAID";
                          const studentLabel = [item.lastNames, item.names].filter(Boolean).join(", ") || "Alumno";
                          return (
                            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{studentLabel}</p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {item.internalCode || "-"} · {item.dni || "-"} · {item.classroomDisplayName || "-"}
                                  </p>
                                </div>
                                <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${paid ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                                  {paid ? "Ya pagó" : item.participant ? "Pendiente" : "Sin inscribir"}
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {!item.participant && canManage ? (
                                  <SecondaryButton
                                    onClick={async () => {
                                      await addParticipantMutation.mutateAsync({ studentId: item.id });
                                    }}
                                  >
                                    <UserRoundPlus className="mr-1 h-4 w-4" />
                                    Inscribir
                                  </SecondaryButton>
                                ) : null}
                                {!paid && canCollect ? (
                                  <Button onClick={() => handleOpenCollect(item.participant?.student || item)}>Cobrar</Button>
                                ) : null}
                                {paid && canPrintReceipt && item.participant?.latestCollection?.id ? (
                                  <SecondaryButton onClick={() => handlePrintReceipt(item.participant.latestCollection.id)}>
                                    <Eye className="mr-1 h-4 w-4" />
                                    Recibo
                                  </SecondaryButton>
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <OperationalBlockState mode="empty" message="No se encontró ningún alumno con esa búsqueda." minHeight="120px" />
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {!isAuxiliar ? (
          <div className="grid min-h-0 gap-4">
            {canReportCapability ? (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-4 py-4">
                  <h2 className="text-base font-semibold text-gray-900">Reporte por cobrador</h2>
                  <p className="mt-1 text-sm text-gray-600">Cuánto recaudó cada cuenta y a qué alumnos cobró.</p>
                </div>
                <div className="h-[25vh] overflow-auto px-4 py-3">
                  <div className="space-y-3">
                    {collectorReport.map((row) => (
                      <div key={`${row.collectorUserId}-${row.collectorRole}`} className="rounded-xl border border-gray-200 px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{row.collectorName}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-400">{row.collectorRole}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{formatMoney(row.totalAmount)}</p>
                            <p className="text-xs text-gray-500">{row.collectionsCount} cobros</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!collectorReport.length ? <p className="text-sm text-gray-500">Aún no hay cobros registrados.</p> : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-4">
                <h2 className="text-base font-semibold text-gray-900">Cobros recientes</h2>
                <p className="mt-1 text-sm text-gray-600">Últimos recibos ACT emitidos en esta actividad.</p>
              </div>
              <div className="h-[26vh] overflow-auto">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Recibo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Alumno</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Rol</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {collections.map((row) => (
                        <tr key={row.id} className="transition hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">
                            <button type="button" className="font-semibold text-sky-700 hover:underline" onClick={() => handlePrintReceipt(row.id)}>
                              {row.receiptInternalCode}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{[row.student?.lastNames, row.student?.names].filter(Boolean).join(", ") || "-"}</td>
                          <td className="px-4 py-3 text-gray-700">{row.collectorRole}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!collections.length ? <div className="px-4 py-6 text-sm text-gray-500">Aún no hay cobros registrados.</div> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ActivityCollectModal
        open={openCollect}
        onClose={() => setOpenCollect(false)}
        student={selectedStudent}
        activity={activity}
        submitting={createCollectionMutation.isPending}
        onSubmit={async (payload) => {
          await createCollectionMutation.mutateAsync(payload);
          setOpenCollect(false);
          setSelectedStudent(null);
        }}
      />

      <ActivityFormModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        initialActivity={activity}
        defaultCampus={activity?.campus?.code || ""}
        submitting={updateActivityMutation.isPending}
        onSubmit={async (payload) => {
          await updateActivityMutation.mutateAsync({ activityId: activityDetailId, payload });
          setOpenEdit(false);
        }}
      />
    </div>
  );
}
