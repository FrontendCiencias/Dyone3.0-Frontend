import React from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { getRoleTheme } from "../../dashboard/config/roleTheme";

function ActionCard({ icon: Icon, title, description, cta, onClick, accent }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className="flex h-11 w-11 items-center justify-center rounded-2xl border"
        style={{ backgroundColor: accent.softBg, borderColor: "rgba(17,24,39,0.08)" }}
      >
        <Icon className="h-5 w-5" style={{ color: accent.main }} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 text-sm font-semibold underline-offset-4 hover:underline"
        style={{ color: accent.main }}
      >
        {cta}
      </button>
    </article>
  );
}

function campusLabel(activeCampus) {
  if (!activeCampus || String(activeCampus).toUpperCase() === "ALL") return "Todos los campus";
  return activeCampus;
}

export default function AttendanceHomePage() {
  const navigate = useNavigate();
  const { activeCampus } = useAuth();
  const theme = getRoleTheme(activeCampus);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Auxiliar</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">¿Qué deseas hacer hoy?</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Elige la tarea operativa del día. La toma de asistencia se prepara aparte para mantener la jornada ordenada,
              mientras que las justificaciones y reportes quedan como flujos de consulta y seguimiento.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
            Campus activo: {campusLabel(activeCampus)}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActionCard
          icon={ClipboardCheck}
          title="Tomar asistencia"
          description="Configura la sesión de hoy o continúa con una ya preparada para registrar ingresos con lector o código manual."
          cta="Abrir flujo de asistencia"
          onClick={() => navigate(ROUTES.dashboardAttendanceIntake)}
          accent={theme}
        />
        <ActionCard
          icon={ShieldCheck}
          title="Realizar justificación"
          description="Accede a tardanzas o faltas para justificar observaciones posteriores sin mezclarlo con la toma operativa."
          cta="Ir a justificaciones"
          onClick={() => navigate(ROUTES.dashboardAttendanceJustifications)}
          accent={theme}
        />
        <ActionCard
          icon={FileSearch}
          title="Ver reportes"
          description="Consulta resúmenes mensuales por alumno o salón para el seguimiento cotidiano del campus."
          cta="Ver reportes"
          onClick={() => navigate(ROUTES.dashboardAttendanceReports)}
          accent={theme}
        />
      </section>
    </div>
  );
}
