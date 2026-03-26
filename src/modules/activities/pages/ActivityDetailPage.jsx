import React, { useEffect, useMemo, useState } from "react";
import { CreditCard, Eye, Pencil, Search, Sparkles, UserCheck, UserRoundPlus, Users, Wallet2 } from "lucide-react";
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
  return "No se pudo cargar la activity.";
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
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(term);
}

function ParticipantCard({ item, canCollect, canPrint, onCollect, onPrint }) {
  const studentLabel = [item?.student?.lastNames, item?.student?.names].filter(Boolean).join(", ") || "Alumno";
  const paid = item?.status === "PAID";

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${paid ? "border-emerald-200 bg-emerald-50/40" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{studentLabel}</p>
          <p className="mt-1 text-xs text-gray-500">
            {item?.student?.internalCode || "-"} · {item?.student?.dni || "-"}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">{item?.status || "-"}</p>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {paid ? "Pagado" : "Pendiente"}
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

export default function ActivityDetailPage() {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const { activeRole } = useAuth();
  const isAuxiliar = String(activeRole || "").toUpperCase() === "AUXILIAR";

  const canManageCapability = hasCapability(activeRole, CAPABILITIES.activitiesManage);
  const canCollectCapability = hasCapability(activeRole, CAPABILITIES.activitiesCollect);
  const canReportCapability = hasCapability(activeRole, CAPABILITIES.activitiesReport);
  const canPrintReceipt = ["ADMIN", "SECRETARY"].includes(String(activeRole || "").toUpperCase());

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openCollect, setOpenCollect] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);

  const detailQuery = useActivityDetailQuery(activityId);
  const createCollectionMutation = useCreateActivityCollectionMutation(activityId);
  const addParticipantMutation = useAddActivityParticipantMutation(activityId);
  const updateActivityMutation = useUpdateActivityMutation();

  const activity = detailQuery.data?.activity || null;
  const participants = Array.isArray(detailQuery.data?.participants) ? detailQuery.data.participants : [];
  const collections = Array.isArray(detailQuery.data?.collections) ? detailQuery.data.collections : [];
  const collectorReport = Array.isArray(detailQuery.data?.collectorReport) ? detailQuery.data.collectorReport : [];
  const registrationReport = Array.isArray(detailQuery.data?.registrationReport) ? detailQuery.data.registrationReport : [];
  const summary = detailQuery.data?.summary || {};
  const permissions = detailQuery.data?.permissions || {};

  const canManage = canManageCapability && permissions.canManage;
  const canCollect = canCollectCapability && permissions.canCollect;

  const visibleParticipants = useMemo(() => {
    return participants
      .filter((item) => (statusFilter ? item.status === statusFilter : true))
      .filter((item) => participantMatchesSearch(item, searchInput));
  }, [participants, searchInput, statusFilter]);

  const searchQuery = useActivityStudentSearchQuery(
    { q: searchInput.trim(), campus: activity?.campus?.code, limit: 10 },
    searchInput.trim().length >= 2,
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
        backLabel="Volver a Activities"
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
          <OperationalSummaryCard label="Inscritos" value={String(summary.participantsCount || 0)} hint="Base de la activity" icon={Users} />
          <OperationalSummaryCard label="Pagados" value={String(summary.paidCount || 0)} hint="Cobros cerrados" icon={UserCheck} variant="green" />
          <OperationalSummaryCard label="Pendientes" value={String(summary.pendingCount || 0)} hint="Aún por recaudar" icon={CreditCard} variant="amber" />
          <OperationalSummaryCard label="Recaudado" value={formatMoney(summary.totalCollected || 0)} hint="Total visible de la activity" icon={Wallet2} variant="blue" />
        </div>
      )}

      <OperationalSearchBar>
        <div className="grid gap-3 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Input
              label="Buscar alumno"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="DNI, código, nombres o apellidos"
            />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
            <select className="h-[42px] w-full rounded-xl border border-gray-300 px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="PAID">Pagados</option>
              <option value="ANULADO">Anulados</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <div className="flex h-[42px] items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
              <Search className="mr-2 h-4 w-4" />
              {visibleParticipants.length} visibles
            </div>
          </div>
        </div>
      </OperationalSearchBar>

      <div className={`grid min-h-0 gap-4 ${isAuxiliar ? "" : "xl:grid-cols-[1.4fr_1fr]"}`}>
        <div className="min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Participantes</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Revisa quién ya pagó en secretaría, auxiliar o admin, y registra cobros sin duplicarlos.
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {visibleParticipants.length} resultados
              </div>
            </div>
          </div>

          <div className="h-[52vh] overflow-auto p-4">
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

          {canReportCapability ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-4">
                <h2 className="text-base font-semibold text-gray-900">Quién inscribió</h2>
                <p className="mt-1 text-sm text-gray-600">Participantes registrados por cada cuenta y rol.</p>
              </div>
              <div className="h-[22vh] overflow-auto px-4 py-3">
                <div className="space-y-3">
                  {registrationReport.map((row) => (
                    <div key={`${row.registeredByUserId}-${row.registeredByRole}`} className="rounded-xl border border-gray-200 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{row.registeredByName}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-gray-400">{row.registeredByRole}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{row.participantsCount}</p>
                          <p className="text-xs text-gray-500">inscritos</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!registrationReport.length ? <p className="text-sm text-gray-500">Aún no hay registros manuales.</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-4">
              <h2 className="text-base font-semibold text-gray-900">Cobros recientes</h2>
              <p className="mt-1 text-sm text-gray-600">Últimos recibos ACT emitidos en esta activity.</p>
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
          await updateActivityMutation.mutateAsync({ activityId, payload });
          setOpenEdit(false);
        }}
      />
    </div>
  );
}
