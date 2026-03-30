import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CircleAlert, Clock3, Gavel } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import BaseModal from "../../../shared/ui/BaseModal";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { getRoleTheme } from "../../dashboard/config/roleTheme";
import { useAttendanceIntakeViewQuery } from "../hooks/useAttendanceIntakeViewQuery";
import { useAttendanceJustifyMutation } from "../hooks/useAttendanceJustifyMutation";
import { useAttendanceScanMutation } from "../hooks/useAttendanceScanMutation";

function getCurrentLocalTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
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

function getErrorMessage(error, fallback = "No se pudo completar la operacion.") {
  if (error?.response?.data?.code === "ATTENDANCE_ALREADY_MARKED") {
    return "La asistencia de este alumno ya fue registrada.";
  }
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return fallback;
}

function getLatestCardTone(status, justificationStatus) {
  if (justificationStatus === "JUSTIFIED") return "border-violet-200 bg-violet-50";
  if (status === "PRESENT") return "border-emerald-100 bg-emerald-50";
  if (status === "LATE") return "border-rose-200 bg-rose-50";
  if (status === "ABSENT") return "border-rose-100 bg-rose-50";
  return "border-gray-100 bg-slate-50";
}

const LATE_ALERT_THRESHOLD = 3;
const ABSENT_ALERT_THRESHOLD = 3;

function getFeaturedIcon(status) {
  if (status === "PRESENT") return CheckCircle2;
  if (status === "LATE") return Clock3;
  if (status === "ABSENT") return CircleAlert;
  return Clock3;
}

function getFeaturedIconTone(status) {
  if (status === "PRESENT") {
    return {
      backgroundColor: "#dcfce7",
      borderColor: "#bbf7d0",
      color: "#166534",
    };
  }
  if (status === "LATE") {
    return {
      backgroundColor: "#fee2e2",
      borderColor: "#fca5a5",
      color: "#b91c1c",
    };
  }
  if (status === "ABSENT") {
    return {
      backgroundColor: "#fecaca",
      borderColor: "#f87171",
      color: "#991b1b",
    };
  }
  return {
    backgroundColor: "#f8fafc",
    borderColor: "rgba(17,24,39,0.08)",
    color: "#0f172a",
  };
}

function getJustifiedIconTone() {
  return {
    backgroundColor: "#f5f3ff",
    borderColor: "#c4b5fd",
    color: "#6d28d9",
  };
}

function canJustify(status, justificationStatus) {
  return ["LATE", "ABSENT"].includes(status) && justificationStatus !== "JUSTIFIED";
}

function getJustificationButtonText(status) {
  return status === "ABSENT" ? "Justificar falta" : "Justificar tardanza";
}

export default function AttendanceTakePage() {
  const navigate = useNavigate();
  const { sessionId = "" } = useParams();
  const { activeCampus } = useAuth();
  const theme = getRoleTheme(activeCampus);
  const queryClient = useQueryClient();
  const scanInputRef = useRef(null);
  const [studentCode, setStudentCode] = useState("");
  const [featuredScan, setFeaturedScan] = useState(null);
  const [uiMessage, setUiMessage] = useState("");
  const [latestSearch, setLatestSearch] = useState("");
  const [justificationTarget, setJustificationTarget] = useState(null);
  const [justificationReason, setJustificationReason] = useState("");

  const syncClearNativeInput = () => {
    const input = scanInputRef.current;
    if (!input) return;
    input.value = "";
  };

  const focusScanInput = () => {
    requestAnimationFrame(() => {
      scanInputRef.current?.focus();
    });
  };

  const resetScanInput = () => {
    setStudentCode("");
    syncClearNativeInput();
    requestAnimationFrame(() => {
      syncClearNativeInput();
      scanInputRef.current?.focus();
    });
  };

  const intakeViewQuery = useAttendanceIntakeViewQuery({
    sessionId,
    limit: 5,
    q: latestSearch,
    enabled: Boolean(sessionId),
  });
  const scanMutation = useAttendanceScanMutation();
  const justifyMutation = useAttendanceJustifyMutation();

  useEffect(() => {
    focusScanInput();
  }, []);

  useEffect(() => {
    if (intakeViewQuery.isLoading || intakeViewQuery.isError) return;
    const records = Array.isArray(intakeViewQuery.data?.latestRecords) ? intakeViewQuery.data.latestRecords : [];
    if (!featuredScan && records.length) {
      const [first] = records;
      setFeaturedScan({
        student: { fullName: first?.person?.fullName || "Alumno" },
        classroom: first?.classroom || null,
        record: first?.attendance
          ? {
              id: first.recordId,
              status: first.attendance.status,
              arrivalTime: first.attendance.arrivalTime,
              markedAt: first.attendance.markedAt,
              justificationStatus: first.attendance.justificationStatus,
              justificationReason: first.attendance.justificationReason,
            }
          : null,
        monthlySummary: first?.monthlySummary || null,
      });
    }
  }, [featuredScan, intakeViewQuery.data, intakeViewQuery.isError, intakeViewQuery.isLoading]);

  const effectiveSession = intakeViewQuery.data?.session || null;
  const effectiveLatestRecords = Array.isArray(intakeViewQuery.data?.latestRecords)
    ? intakeViewQuery.data.latestRecords.slice(0, 5)
    : [];

  const openJustification = ({ recordId, status, studentName }) => {
    setJustificationTarget({ recordId, status, studentName });
    setJustificationReason("");
  };

  const closeJustification = () => {
    setJustificationTarget(null);
    setJustificationReason("");
  };

  const handleScanSubmit = async (event) => {
    event.preventDefault();
    const cleanCode = String(studentCode || "").trim();
    if (!sessionId || !cleanCode) {
      focusScanInput();
      return;
    }

    setUiMessage("");

    try {
      const result = await scanMutation.mutateAsync({
        sessionId,
        studentCode: cleanCode,
        arrivalTime: getCurrentLocalTime(),
        markMethod: "BARCODE",
      });

      resetScanInput();
      setFeaturedScan(result);
      setUiMessage(`Asistencia registrada para ${result?.student?.fullName || "alumno"}.`);
      await queryClient.invalidateQueries({
        queryKey: ["attendance", "intake-view", sessionId],
      });
      await intakeViewQuery.refetch();
    } catch (error) {
      resetScanInput();
      setUiMessage(getErrorMessage(error, "No se pudo registrar la asistencia."));
    } finally {
      focusScanInput();
    }
  };

  const handleJustificationSubmit = async (event) => {
    event.preventDefault();
    const recordId = justificationTarget?.recordId;
    const cleanReason = String(justificationReason || "").trim();
    if (!recordId || cleanReason.length < 3) return;

    try {
      await justifyMutation.mutateAsync({
        recordId,
        justificationReason: cleanReason,
      });

      setUiMessage(`Justificación guardada para ${justificationTarget?.studentName || "el alumno"}.`);

      if (featuredScan?.record?.id === recordId) {
        setFeaturedScan((current) => current ? {
          ...current,
          record: {
            ...current.record,
            justificationStatus: "JUSTIFIED",
            justificationReason: cleanReason,
          },
        } : current);
      }

      closeJustification();
      await queryClient.invalidateQueries({
        queryKey: ["attendance", "intake-view", sessionId],
      });
      await intakeViewQuery.refetch();
    } catch (error) {
      setUiMessage(getErrorMessage(error, "No se pudo guardar la justificación."));
    }
  };

  const featuredSummary = featuredScan?.monthlySummary || null;
  const featuredRecord = featuredScan?.record || null;
  const featuredStudentName = featuredScan?.student?.fullName || "Aun no hay registros";
  const formattedSessionDate = formatLongDate(effectiveSession?.date);
  const FeaturedIcon = getFeaturedIcon(featuredRecord?.status);
  const isFeaturedJustified = featuredRecord?.justificationStatus === "JUSTIFIED";
  const featuredIconTone = isFeaturedJustified
    ? getJustifiedIconTone()
    : getFeaturedIconTone(featuredRecord?.status);
  const hasLateAlert = (featuredSummary?.lateCount ?? 0) >= LATE_ALERT_THRESHOLD;
  const hasAbsentAlert = (featuredSummary?.absentCount ?? 0) >= ABSENT_ALERT_THRESHOLD;
  const featuredSectionClassName = hasAbsentAlert
    ? "rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm"
    : "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm";
  const monthlyLateCardClassName = hasLateAlert
    ? "rounded-2xl border border-rose-200 bg-rose-50 p-4"
    : "rounded-2xl border border-gray-100 bg-white p-4";
  const monthlyAbsentCardClassName = hasAbsentAlert
    ? "rounded-2xl border border-rose-200 bg-rose-100 p-4"
    : "rounded-2xl border border-gray-100 bg-white p-4";
  const featuredInfoCardClassName = hasAbsentAlert
    ? "rounded-2xl border border-rose-200 bg-rose-50 p-4"
    : "rounded-2xl border border-gray-100 bg-white p-4";

  if (!sessionId) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-gray-900">No se encontró una sesión</div>
        <p className="mt-2 text-sm text-gray-600">Primero prepara la jornada de hoy y luego entra a la toma operativa.</p>
        <Button className="mt-4" onClick={() => navigate(ROUTES.dashboardAttendanceIntake)}>Ir a preparar sesión</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4">
        <div className="flex items-start">
          <SecondaryButton onClick={() => navigate(ROUTES.dashboardAttendanceIntake)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a sesión
          </SecondaryButton>
        </div>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
            <div className="text-2xl font-semibold tracking-tight text-gray-950 capitalize">
              {formattedSessionDate || "Hoy"}
            </div>
            <div className="md:text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Horario de tardanza</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                {effectiveSession?.onTimeUntil || "--:--"}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]" onSubmit={handleScanSubmit}>
            <Input
              label="Codigo interno del alumno"
              value={studentCode}
              onChange={(event) => setStudentCode(event.target.value)}
              onBlur={focusScanInput}
              placeholder="Escanea o escribe el internalCode"
              disabled={scanMutation.isPending}
              inputMode="numeric"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              ref={scanInputRef}
            />
            <div className="flex items-end">
              <Button className="w-full" type="submit" disabled={!studentCode.trim() || scanMutation.isPending}>
                {scanMutation.isPending ? "Registrando..." : "Registrar ingreso"}
              </Button>
            </div>
          </form>

          {uiMessage ? <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{uiMessage}</p> : null}
        </section>

        <section className={featuredSectionClassName}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                style={featuredIconTone}
              >
                <FeaturedIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">{featuredStudentName}</div>
              </div>
            </div>

            {canJustify(featuredRecord?.status, featuredRecord?.justificationStatus) ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50 hover:text-violet-900"
                onClick={() => openJustification({
                  recordId: featuredRecord?.id,
                  status: featuredRecord?.status,
                  studentName: featuredStudentName,
                })}
              >
                <Gavel className="h-4 w-4" />
                {getJustificationButtonText(featuredRecord?.status)}
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={featuredInfoCardClassName}>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Hora registrada</div>
              <div className="mt-3 text-xl font-semibold text-gray-950">{featuredRecord?.arrivalTime || "--:--"}</div>
            </div>
            <div className={featuredInfoCardClassName}>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Salon</div>
              <div className="mt-3 text-xl font-semibold text-gray-950">{featuredScan?.classroom?.displayName || "Sin aula visible"}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={monthlyLateCardClassName}>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Tardanzas del mes</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">{featuredSummary?.lateCount ?? 0}</div>
            </div>
            <div className={monthlyAbsentCardClassName}>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Faltas del mes</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">{featuredSummary?.absentCount ?? 0}</div>
            </div>
          </div>
        </section>
      </section>

      <aside className="space-y-4 xl:pt-14">
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Ultimos tomados</h2>
            </div>
            {intakeViewQuery.isFetching ? <span className="text-xs text-gray-500">Actualizando...</span> : null}
          </div>

          <div className="mt-4">
            <Input
              label=""
              value={latestSearch}
              onChange={(event) => setLatestSearch(event.target.value)}
              placeholder="Busca por código o apellidos y nombres"
            />
          </div>

          <div className="mt-4 space-y-3">
            {effectiveLatestRecords.map((item) => (
              <article key={item.recordId} className={`rounded-2xl border p-4 ${getLatestCardTone(item?.attendance?.status, item?.attendance?.justificationStatus)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-900">{item?.person?.fullName || "Alumno"}</div>
                  {canJustify(item?.attendance?.status, item?.attendance?.justificationStatus) ? (
                    <button
                      type="button"
                      className="-mt-2 inline-flex items-center justify-center rounded-lg p-2 text-violet-700 transition-colors hover:bg-violet-100 hover:text-violet-900"
                      onClick={() => openJustification({
                        recordId: item?.recordId,
                        status: item?.attendance?.status,
                        studentName: item?.person?.fullName || "el alumno",
                      })}
                      aria-label={getJustificationButtonText(item?.attendance?.status)}
                      title={getJustificationButtonText(item?.attendance?.status)}
                    >
                      <Gavel className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">{item?.classroom?.displayName || "Sin salón visible"}</div>
                  {item?.attendance?.justificationStatus === "JUSTIFIED" ? (
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Justificado</span>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      {item?.attendance?.status === "ABSENT" ? "Falta" : item?.attendance?.status === "LATE" ? "Tardanza" : "Temprano"}
                    </span>
                  )}
                </div>
              </article>
            ))}

            {!effectiveLatestRecords.length ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                {String(latestSearch || "").trim()
                  ? "No hay coincidencias para esa búsqueda."
                  : "Cuando registres ingresos, aqui aparecera el historial reciente del dia."}
              </div>
            ) : null}
          </div>

        </section>
      </aside>

      <BaseModal
        open={Boolean(justificationTarget)}
        onClose={justifyMutation.isPending ? undefined : closeJustification}
        title={justificationTarget ? `${getJustificationButtonText(justificationTarget?.status)} para ${justificationTarget?.studentName}` : "Justificar"}
        maxWidthClass="max-w-xl"
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={closeJustification} disabled={justifyMutation.isPending}>
              Cancelar
            </SecondaryButton>
            <Button
              type="submit"
              form="attendance-justification-form"
              disabled={justifyMutation.isPending || String(justificationReason || "").trim().length < 3}
            >
              {justifyMutation.isPending ? "Guardando..." : "Guardar justificación"}
            </Button>
          </div>
        )}
      >
        <form id="attendance-justification-form" onSubmit={handleJustificationSubmit}>
          <div className="space-y-4 p-5">
            <p className="text-sm text-gray-600">
              Escribe una justificación breve para este registro.
            </p>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring focus:ring-violet-200"
              value={justificationReason}
              onChange={(event) => setJustificationReason(event.target.value)}
              placeholder="Escribe la justificación"
              disabled={justifyMutation.isPending}
            />
          </div>
        </form>
      </BaseModal>
    </div>
  );
}
