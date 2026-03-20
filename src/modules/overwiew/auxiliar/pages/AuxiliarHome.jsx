import React from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import { ROUTES } from "../../../../config/routes";
import { useAuth } from "../../../../lib/auth";
import { getRoleTheme } from "../../../dashboard/config/roleTheme";

function QuickCard({ icon: Icon, title, description, cta, onClick, accent }) {
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

export default function AuxiliarHome() {
  const navigate = useNavigate();
  const { activeCampus } = useAuth();
  const theme = getRoleTheme(activeCampus);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Auxiliar</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">Inicio operativo</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Empieza desde aquí según la tarea del día. La asistencia tiene su propio flujo, mientras que justificaciones
            y reportes quedan disponibles como espacios separados de seguimiento.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QuickCard
          icon={ClipboardCheck}
          title="Abrir flujo de asistencia"
          description="Entra al módulo de asistencia para preparar la sesión del día o continuar con la toma operativa."
          cta="Ir a asistencia"
          onClick={() => navigate(ROUTES.dashboardAttendance)}
          accent={theme}
        />
        <QuickCard
          icon={ShieldCheck}
          title="Justificaciones"
          description="Accede al espacio donde luego registraremos tardanzas y faltas justificadas."
          cta="Ir a justificaciones"
          onClick={() => navigate(ROUTES.dashboardAttendanceJustifications)}
          accent={theme}
        />
        <QuickCard
          icon={FileSearch}
          title="Reportes"
          description="Consulta el espacio destinado a reportes mensuales por alumno y por salón."
          cta="Ir a reportes"
          onClick={() => navigate(ROUTES.dashboardAttendanceReports)}
          accent={theme}
        />
      </section>
    </div>
  );
}
