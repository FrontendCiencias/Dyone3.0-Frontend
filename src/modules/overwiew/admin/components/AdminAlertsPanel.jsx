import React from "react";
import { ArrowRight, Building2, CreditCard, ShieldAlert, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../config/routes";
import WidgetShell from "../../secretary/components/WidgetShell";

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

function LinkRow({ title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
        <div className="mt-1 truncate text-xs text-gray-500">{subtitle}</div>
      </div>
      <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
    </button>
  );
}

export default function AdminAlertsPanel({ data = {} }) {
  const navigate = useNavigate();
  const alerts = data.alerts || {};
  const noTutor = Array.isArray(data.studentsWithoutTutors) ? data.studentsWithoutTutors.slice(0, 3) : [];
  const noBankCode = Array.isArray(data.studentsWithoutBankCode) ? data.studentsWithoutBankCode.slice(0, 3) : [];
  const overCapacity = Array.isArray(data.overCapacityClassrooms) ? data.overCapacityClassrooms.slice(0, 3) : [];

  return (
    <WidgetShell title="Alertas administrativas" subtitle="Lo primero que conviene revisar" className="h-full">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <SummaryTile icon={UsersRound} label="Sin tutor" value={alerts.studentsWithoutTutorsCount} />
          <SummaryTile icon={CreditCard} label="Sin cod. banco" value={alerts.studentsWithoutBankCodeCount} />
          <SummaryTile icon={Building2} label="Salones sobrecargados" value={alerts.overCapacityClassroomsCount} />
          <SummaryTile icon={ShieldAlert} label="Matriculas ausentes" value={alerts.absentEnrollmentsCount} />
        </div>

        <div className="space-y-2">
          {noTutor.map((item) => (
            <LinkRow
              key={`tutor-${item.studentId}`}
              title={item.fullName}
              subtitle={`Sin tutor relacionado · ${item.code || "Sin codigo"}`}
              onClick={() => navigate(ROUTES.dashboardStudentDetail(item.studentId))}
            />
          ))}
          {noBankCode.map((item) => (
            <LinkRow
              key={`bank-${item.studentId}`}
              title={item.fullName}
              subtitle={`Sin codigo Caja Arequipa · ${item.code || "Sin codigo"}`}
              onClick={() => navigate(ROUTES.dashboardStudentDetail(item.studentId))}
            />
          ))}
          {overCapacity.map((item) => (
            <LinkRow
              key={`classroom-${item.classroomId}`}
              title={item.displayName}
              subtitle={`${item.occupied}/${item.capacity} ocupados · Exceso ${item.overflow}`}
              onClick={() => navigate(ROUTES.dashboardClassrooms)}
            />
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}
