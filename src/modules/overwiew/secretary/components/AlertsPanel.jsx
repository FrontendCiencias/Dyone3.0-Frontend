import React from "react";
import { ArrowRight, BadgeAlert, FileWarning, ShieldAlert, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../config/routes";
import WidgetShell from "./WidgetShell";

function SummaryTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
        <Icon className="h-4 w-4 text-gray-400" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">{value || 0}</div>
    </div>
  );
}

function StudentRow({ item, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900">{item.fullName}</div>
        <div className="mt-1 truncate text-xs text-gray-500">{subtitle}</div>
      </div>

      <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
    </button>
  );
}

function SectionBlock({ title, emptyText, children }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{title}</div>
      {children || <div className="rounded-2xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500">{emptyText}</div>}
    </div>
  );
}

export default function AlertsPanel({ data = {} }) {
  const navigate = useNavigate();
  const critical = data?.critical || {};
  const studentsWithoutFamily = Array.isArray(data?.studentsWithoutFamily) ? data.studentsWithoutFamily.slice(0, 3) : [];
  const incompleteStudents = Array.isArray(data?.incompleteStudents) ? data.incompleteStudents.slice(0, 3) : [];

  return (
    <WidgetShell
      title="Pendientes críticos"
      subtitle="Lo primero que debería resolver secretaría"
      right={
        <button
          type="button"
          onClick={() => navigate(ROUTES.dashboardStudents)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 transition hover:text-gray-900"
        >
          Ver alumnos
          <ArrowRight className="h-4 w-4" />
        </button>
      }
      className="h-full"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile
            icon={UsersRound}
            label="Sin familia"
            value={critical.studentsWithoutFamilyCount}
          />
          <SummaryTile
            icon={FileWarning}
            label="Datos incompletos"
            value={critical.incompleteStudentsCount}
          />
          <SummaryTile
            icon={BadgeAlert}
            label="Con deuda vencida"
            value={critical.overdueStudentsCount}
          />
          <SummaryTile
            icon={ShieldAlert}
            label="Matrículas draft"
            value={critical.draftEnrollmentsCount}
          />
        </div>

        <SectionBlock
          title="Alumnos sin familia vinculada"
          emptyText="No hay alumnos pendientes de vincular a una familia."
        >
          {studentsWithoutFamily.length ? (
            <div className="space-y-2">
              {studentsWithoutFamily.map((item) => (
                <StudentRow
                  key={item.studentId}
                  item={item}
                  subtitle={[item.dni || "Sin DNI", item.code || "Sin código", item.campus || "Campus no definido"]
                    .filter(Boolean)
                    .join(" · ")}
                  onClick={() => navigate(ROUTES.dashboardStudentDetail(item.studentId))}
                />
              ))}
            </div>
          ) : null}
        </SectionBlock>

        <SectionBlock
          title="Datos obligatorios incompletos"
          emptyText="No hay alumnos con datos obligatorios incompletos."
        >
          {incompleteStudents.length ? (
            <div className="space-y-2">
              {incompleteStudents.map((item) => (
                <StudentRow
                  key={item.studentId}
                  item={item}
                  subtitle={(item.missingFields || []).join(", ")}
                  onClick={() => navigate(ROUTES.dashboardStudentDetail(item.studentId))}
                />
              ))}
            </div>
          ) : null}
        </SectionBlock>
      </div>
    </WidgetShell>
  );
}
