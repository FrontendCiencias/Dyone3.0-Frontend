import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { createProgramSession, getProgramDetail } from "../services/admin.service";

function getErrorMessage(error, fallback) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProgramDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { programId } = useParams();
  const [sessionForm, setSessionForm] = useState({ date: todayInputValue(), notes: "" });
  const [error, setError] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin", "programs", "detail", programId],
    queryFn: () => getProgramDetail(programId),
    enabled: Boolean(programId),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const createSessionMutation = useMutation({
    mutationFn: (payload) => createProgramSession(programId, payload),
    onSuccess: async (created) => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "programs", "detail", programId] });
      if (created?.id) {
        navigate(ROUTES.dashboardProgramSessionDetail(programId, created.id));
      }
    },
    onError: (mutationError) => setError(getErrorMessage(mutationError, "No se pudo iniciar la sesión")),
  });

  const detail = detailQuery.data;
  const sessions = Array.isArray(detail?.sessions) ? detail.sessions : [];

  if (detailQuery.isLoading) {
    return <Card className="border border-gray-200 text-sm text-gray-500">Cargando programa...</Card>;
  }

  if (detailQuery.isError || !detail) {
    return (
      <Card className="border border-red-100 text-sm text-red-700">
        {getErrorMessage(detailQuery.error, "No se pudo cargar el programa")}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{detail.program?.name || "Programa"}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {detail.program?.notes || "Gestiona aquí las sesiones del programa."}
            </p>
          </div>
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardPrograms)}>Volver</SecondaryButton>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Iniciar nueva sesión</h2>
          <div className="mt-3 space-y-3">
            <Input
              label="Fecha"
              type="date"
              value={sessionForm.date}
              onChange={(e) => {
                setSessionForm((prev) => ({ ...prev, date: e.target.value }));
                setError("");
              }}
            />
            <Input
              label="Notas"
              value={sessionForm.notes}
              onChange={(e) => setSessionForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Opcional"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" onClick={() => createSessionMutation.mutate(sessionForm)} disabled={createSessionMutation.isPending}>
              Iniciar sesión
            </Button>
          </div>
        </Card>

        <Card className="border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Sesiones del programa</h2>
          <p className="mt-1 text-sm text-gray-600">
            Entra al detalle de una sesión para registrar asistencia, pagos y quién recibió el cobro.
          </p>
          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => navigate(ROUTES.dashboardProgramSessionDetail(programId, session.id))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:bg-gray-50"
              >
                <p className="font-medium text-gray-900">{String(session.date).slice(0, 10)}</p>
                <p className="mt-1 text-xs text-gray-600">
                  Asistencias: {session.entriesCount} · Pagados: {session.paidCount} · Deben: {session.pendingCount}
                </p>
              </button>
            ))}
            {!sessions.length ? <p className="text-sm text-gray-500">Todavía no hay sesiones registradas.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
