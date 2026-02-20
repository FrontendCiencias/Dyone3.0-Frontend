import React from "react";
import { getThemeByCampusCode } from "../../../../../config/theme";

function getClassroomStyleByCampus(campusCode) {
  const theme = getThemeByCampusCode(campusCode);
  if (!theme) return { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" };
  return { borderColor: theme.main, backgroundColor: theme.softBg };
}

export default function ClassroomOptionButton({ classroom, isCurrent, isSelected, onSelect }) {
  const noVacancies = Number(classroom?.available) <= 0;
  const unknownStatus = String(classroom?.status || "").toUpperCase() === "UNKNOWN";
  const disabled = Boolean(isCurrent || noVacancies || unknownStatus);
  const style = getClassroomStyleByCampus(classroom?.campusCode);
  const title = classroom?.label || `${classroom?.grade || ""}° - ${classroom?.section || ""}`.trim() || "Aula";

  return (
    <button
      type="button"
      className={`rounded-xl border p-3 text-left transition ${disabled ? "cursor-not-allowed bg-gray-100 text-gray-500" : "hover:opacity-90"}`}
      style={
        isSelected
          ? { ...style, boxShadow: `0 0 0 2px ${style.borderColor}` }
          : isCurrent
            ? { ...style, boxShadow: `0 0 0 1px ${style.borderColor}` }
            : style
      }
      onClick={() => !disabled && onSelect(classroom)}
      disabled={disabled}
      title={unknownStatus ? "No se pudo verificar cupos" : noVacancies ? "Sin vacantes" : undefined}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-semibold text-gray-900">{title}</p>
        <div className="flex items-center gap-1">
          {isSelected ? <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">Seleccionado</span> : null}
          {isCurrent ? <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">Actual</span> : null}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{classroom?.campusCode || "-"}</span>
        </div>
      </div>

      <p className="text-xs text-gray-600">Cap: {classroom?.capacity ?? "-"} · Disp: {classroom?.available ?? "-"}</p>
      {unknownStatus ? <p className="mt-1 text-xs text-amber-700">No se pudo verificar cupos</p> : null}
      {!unknownStatus && noVacancies ? <p className="mt-1 text-xs text-rose-700">Sin vacantes</p> : null}
    </button>
  );
}
