import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarClock, CheckCheck, PlayCircle } from "lucide-react";
import Button from "../../../components/ui/Button";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { getRoleTheme } from "../../dashboard/config/roleTheme";
import { useAttendanceIntakeViewQuery } from "../hooks/useAttendanceIntakeViewQuery";
import { useAttendanceOpenSessionMutation } from "../hooks/useAttendanceOpenSessionMutation";
import { useCurrentAttendanceSessionQuery } from "../hooks/useCurrentAttendanceSessionQuery";
import {
  clearStoredAttendanceSessionId,
  getStoredAttendanceSessionId,
  setStoredAttendanceSessionId,
} from "../utils/attendanceSessionStorage";

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  const formatted = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getErrorMessage(error, fallback = "No se pudo completar la operación.") {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return fallback;
}

function InfoCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</div>
          <div className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">{value || "-"}</div>
          {hint ? <div className="mt-2 text-sm text-gray-500">{hint}</div> : null}
        </div>
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border"
          style={{ backgroundColor: accent.softBg, borderColor: "rgba(17,24,39,0.08)" }}
        >
          <Icon className="h-5 w-5" style={{ color: accent.main }} />
        </div>
      </div>
    </article>
  );
}

export default function AttendanceIntakePage() {
  const navigate = useNavigate();
  const { activeCampus } = useAuth();
  const theme = getRoleTheme(activeCampus);
  const [uiMessage, setUiMessage] = useState("");
  const today = getTodayDateInputValue();

  const openSessionMutation = useAttendanceOpenSessionMutation();
  const activeCampusCode = String(activeCampus || "").toUpperCase();

  const storedSessionId = useMemo(
    () => getStoredAttendanceSessionId({ campus: activeCampus, date: today }),
    [activeCampus, today],
  );
  const [resolvedSessionId, setResolvedSessionId] = useState(storedSessionId);

  const currentSessionQuery = useCurrentAttendanceSessionQuery({
    campusCode: activeCampusCode || undefined,
    date: today,
    enabled: Boolean(activeCampusCode),
  });

  useEffect(() => {
    setResolvedSessionId(storedSessionId);
  }, [storedSessionId]);

  const intakeViewQuery = useAttendanceIntakeViewQuery({
    sessionId: resolvedSessionId,
    limit: 1,
    enabled: Boolean(resolvedSessionId),
    suppressNotFound: true,
  });

  useEffect(() => {
    const currentSessionId = currentSessionQuery.data?.session?.id || "";
    if (!currentSessionId) return;
    if (String(currentSessionId) === String(resolvedSessionId || "")) return;
    setResolvedSessionId(currentSessionId);
    setStoredAttendanceSessionId({ campus: activeCampus, date: today, sessionId: currentSessionId });
  }, [activeCampus, currentSessionQuery.data?.session?.id, resolvedSessionId, today]);

  const effectiveSession = intakeViewQuery.data?.session
    || currentSessionQuery.data?.session
    || openSessionMutation.data?.session
    || null;

  useEffect(() => {
    if (!resolvedSessionId || intakeViewQuery.isLoading) return;
    if (intakeViewQuery.data !== null) return;
    clearStoredAttendanceSessionId({ campus: activeCampus, date: today });
    setResolvedSessionId("");
  }, [activeCampus, intakeViewQuery.data, intakeViewQuery.isLoading, resolvedSessionId, today]);

  const handleStartAttendance = async () => {
    if (!activeCampusCode) {
      setUiMessage("No se encontró el campus activo para iniciar el tomado.");
      return;
    }

    setUiMessage("");

    try {
      let sessionId = effectiveSession?.id || "";

      if (!sessionId) {
        const result = await openSessionMutation.mutateAsync({
          campusCode: activeCampusCode,
          date: today,
        });

        sessionId = result?.session?.id || "";
        setResolvedSessionId(sessionId);
        setStoredAttendanceSessionId({ campus: activeCampus, date: today, sessionId });
      }

      if (!sessionId) {
        setUiMessage("No se pudo iniciar la sesión del día.");
        return;
      }

      navigate(ROUTES.dashboardAttendanceTake(sessionId));
    } catch (error) {
      setUiMessage(getErrorMessage(error, "No se pudo iniciar el tomado de asistencia."));
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Asistencia</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">Iniciar tomado de asistencia</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              El horario del día se toma desde la configuración definida por administración para este campus.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            <Building2 className="h-4 w-4 text-gray-500" />
            {activeCampusCode || "Campus"}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard icon={Building2} label="Campus" value={activeCampusCode || "-"} hint="Contexto actual" accent={theme} />
        <InfoCard icon={CalendarClock} label="Fecha" value={formatLongDate(today)} hint="Jornada de hoy" accent={theme} />
        <InfoCard icon={CheckCheck} label="Sesión" value={effectiveSession?.status || "Se abrirá al iniciar"} hint={effectiveSession ? "Lista para continuar" : "Se creará usando la política activa"} accent={theme} />
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tomado operativo</h2>
            <p className="mt-1 text-sm text-gray-600">
              Inicia el tomado del día y entra directamente a la pantalla de registro por código.
            </p>
          </div>

          <Button onClick={handleStartAttendance} disabled={openSessionMutation.isPending}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {openSessionMutation.isPending ? "Iniciando..." : effectiveSession ? "Continuar tomado de asistencia" : "Iniciar tomado de asistencia"}
          </Button>
        </div>

        {effectiveSession ? (
          <div className="mt-5 grid gap-3 md:grid-cols-1">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Temprano hasta</div>
              <div className="mt-3 text-lg font-semibold text-gray-950">{effectiveSession.onTimeUntil || "--:--"}</div>
            </div>
          </div>
        ) : null}

        {false ? <div className="mt-5">
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardAttendance)}>Volver al módulo</SecondaryButton>
        </div> : null}

        {uiMessage ? <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{uiMessage}</p> : null}
      </section>
    </div>
  );
}
