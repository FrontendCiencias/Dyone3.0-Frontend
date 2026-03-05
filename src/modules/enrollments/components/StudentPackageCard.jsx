import React from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function StudentPackageCard({ item, classroomOptions = [], onChooseClassroom, onRemove, onChangeCosts }) {
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
        {item?.hasVacancy ? (
          <p className="text-sm text-gray-700">Aula asignada: <span className="font-medium">{item.assignedClassroomLabel || "(sin etiqueta)"}</span></p>
        ) : null}

        {!item?.hasVacancy && item?.requiresClassroomSelection ? (
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

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-gray-200 p-2">
          <p className="text-sm font-medium text-gray-800">Matrícula</p>
          <Input
            label="Monto"
            type="number"
            value={Number(item?.enrollmentFee?.amount || 0)}
            onChange={(e) => onChangeCosts?.({ enrollmentFee: { ...item?.enrollmentFee, amount: Number(e.target.value || 0) } })}
            disabled={Boolean(item?.enrollmentFee?.isExempt)}
          />
          <label className="text-xs text-gray-600"><input className="mr-1" type="checkbox" checked={Boolean(item?.enrollmentFee?.isExempt)} onChange={(e) => onChangeCosts?.({ enrollmentFee: { ...item?.enrollmentFee, isExempt: e.target.checked } })} />Exonerado</label>
        </div>

        <div className="rounded-md border border-gray-200 p-2">
          <p className="text-sm font-medium text-gray-800">Derecho de ingreso</p>
          <label className="mb-1 block text-xs text-gray-600"><input className="mr-1" type="checkbox" checked={Boolean(item?.admissionFee?.applies)} onChange={(e) => onChangeCosts?.({ admissionFee: { ...item?.admissionFee, applies: e.target.checked } })} />Aplica</label>
          {item?.admissionFee?.applies ? (
            <>
              <Input
                label="Monto"
                type="number"
                value={Number(item?.admissionFee?.amount || 0)}
                onChange={(e) => onChangeCosts?.({ admissionFee: { ...item?.admissionFee, amount: Number(e.target.value || 0) } })}
                disabled={Boolean(item?.admissionFee?.isExempt)}
              />
              <label className="text-xs text-gray-600"><input className="mr-1" type="checkbox" checked={Boolean(item?.admissionFee?.isExempt)} onChange={(e) => onChangeCosts?.({ admissionFee: { ...item?.admissionFee, isExempt: e.target.checked } })} />Exonerado</label>
            </>
          ) : null}
        </div>

        <div className="rounded-md border border-gray-200 p-2 md:col-span-2">
          <p className="text-sm font-medium text-gray-800">Pensiones (Mar-Dic)</p>
          <div className="grid gap-2 md:grid-cols-5">
            {(item?.pensionMonthlyAmounts || []).map((amount, index) => (
              <label key={`${item.id}-p-${index}`} className="text-xs text-gray-600">
                M{index + 1}
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
                  value={Number(amount || 0)}
                  onChange={(e) => {
                    const copy = [...(item?.pensionMonthlyAmounts || [])];
                    copy[index] = Number(e.target.value || 0);
                    onChangeCosts?.({ pensionMonthlyAmounts: copy });
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
