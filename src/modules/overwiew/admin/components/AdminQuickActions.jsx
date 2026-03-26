import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WidgetShell from "../../secretary/components/WidgetShell";

export default function AdminQuickActions({ data = {} }) {
  const navigate = useNavigate();
  const actions = Array.isArray(data.quickAccess) ? data.quickAccess : [];

  return (
    <WidgetShell title="Accesos rapidos" subtitle="Entradas directas a trabajo administrativo" className="h-full">
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={() => action.to && navigate(action.to)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition hover:border-gray-200 hover:bg-gray-50"
          >
            <span className="text-sm font-semibold text-gray-900">{action.label}</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </button>
        ))}
      </div>
    </WidgetShell>
  );
}
