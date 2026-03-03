import React from "react";
import Button from "../../../components/ui/Button";

export default function StudentPackageCard({ item, classroomOptions = [], onChooseClassroom, onRemove }) {
  const blocked = Boolean(item?.blockedReason);

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{item.fullName}</p>
          <p className="text-xs text-gray-500">DNI: {item.dni || "-"}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
            {item?.isReturnTransfer ? <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">Retorna (Traslado)</span> : null}
            {item?.isNew ? <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-700">Nuevo</span> : null}
            {blocked ? <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">{item.blockedReason}</span> : <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">Elegible</span>}
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={onRemove}>Quitar</Button>
      </div>

      <div className="mt-2">
        {item?.assignedClassroomLabel && !item?.requiresClassroomSelection ? (
          <p className="text-sm text-gray-700">Aula asignada: <span className="font-medium">{item.assignedClassroomLabel}</span></p>
        ) : null}

        {item?.requiresClassroomSelection ? (
          <div>
            <p className="mb-1 text-sm font-medium text-gray-800">Elegir aula</p>
            <div className="flex flex-wrap gap-2">
              {classroomOptions.map((opt) => {
                const id = opt?.classroomId || opt?.id || opt?._id;
                const disabled = Number(opt?.available ?? 0) <= 0 || String(opt?.status || "").toUpperCase() === "FULL";
                const selected = String(item?.selectedClassroomId || "") === String(id || "");
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChooseClassroom?.(id, opt)}
                    className={`rounded-md border px-3 py-2 text-xs ${selected ? "border-blue-500 bg-blue-50" : "border-gray-300"} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {opt?.label || opt?.name} · Cupos: {opt?.available ?? "--"}
                  </button>
                );
              })}
              {!classroomOptions.length ? <p className="text-xs text-amber-700">Sin aulas disponibles para este nivel/grado.</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
