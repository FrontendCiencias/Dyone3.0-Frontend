import React, { useMemo, useState } from "react";
import Input from "../../../components/ui/Input";

function getItemKey(item, index) {
  if (item?.type === "FAMILY") return `family-${item.familyId || index}`;
  return `student-${item.studentId || index}`;
}

export default function IntakeSearchBar({ value, onChange, results = [], isLoading = false, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const familyRows = useMemo(() => results.filter((row) => row?.type === "FAMILY"), [results]);
  const studentRows = useMemo(() => results.filter((row) => row?.type === "STUDENT"), [results]);
  const allRows = useMemo(() => [...familyRows, ...studentRows], [familyRows, studentRows]);

  const onKeyDown = (event) => {
    if (!isOpen || !allRows.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % allRows.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? allRows.length - 1 : prev - 1));
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      onSelect?.(allRows[activeIndex]);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        label="Buscar familia o alumno (DNI, nombres, apellidos)"
        value={value}
        onChange={(event) => {
          onChange?.(event.target.value);
          setIsOpen(true);
        }}
        placeholder="Ej: Pérez, 77889966"
        className="w-full"
        onKeyDown={onKeyDown}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
      />

      {isOpen && String(value || "").trim().length >= 2 ? (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
          {isLoading ? <p className="px-2 py-2 text-sm text-gray-500">Buscando...</p> : null}

          {!isLoading && !allRows.length ? <p className="px-2 py-2 text-sm text-gray-500">Sin resultados.</p> : null}

          {!isLoading && familyRows.length ? <p className="px-2 pt-1 text-xs font-semibold uppercase text-gray-500">Familias</p> : null}
          {familyRows.map((item) => {
            const idx = allRows.findIndex((row) => row === item);
            const active = idx === activeIndex;
            return (
              <button
                key={getItemKey(item, idx)}
                type="button"
                className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect?.(item);
                  setIsOpen(false);
                }}
              >
                <p className="font-medium text-gray-900">{item?.primaryTutorName || "Familia"}</p>
                <p className="text-xs text-gray-500">DNI: {item?.primaryTutorDni || "-"} · ID: {String(item?.familyId || "").slice(0, 8)}</p>
              </button>
            );
          })}

          {!isLoading && studentRows.length ? <p className="px-2 pt-2 text-xs font-semibold uppercase text-gray-500">Alumnos</p> : null}
          {studentRows.map((item) => {
            const idx = allRows.findIndex((row) => row === item);
            const active = idx === activeIndex;
            const fullName = `${item?.person?.lastNames || ""}, ${item?.person?.names || ""}`.replace(/^,\s*/, "");
            const blocked = item?.cycleStatus === "ENROLLED" || item?.activeStatus === "GRADUATED";
            return (
              <button
                key={getItemKey(item, idx)}
                type="button"
                className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect?.(item);
                  setIsOpen(false);
                }}
              >
                <p className="font-medium text-gray-900">{fullName || "Alumno"}</p>
                <p className="text-xs text-gray-500">DNI: {item?.person?.dni || "-"} · {item?.familyId ? "Con familia" : "Sin familia"}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                  {item?.cycleStatus === "ENROLLED" ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">Ya matriculado</span> : null}
                  {item?.activeStatus === "GRADUATED" ? <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">Egresado</span> : null}
                  {item?.activeStatus === "INACTIVE" && item?.cycleStatus === "TRANSFERRED" ? <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">Retorna (Traslado)</span> : null}
                  {blocked ? <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">Bloqueado</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
