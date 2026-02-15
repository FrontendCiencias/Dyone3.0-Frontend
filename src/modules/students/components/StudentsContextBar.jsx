import React from "react";

function BarItem({ children }) {
  return <span className="font-medium text-gray-700">{children}</span>;
}

export default function StudentsContextBar({
  campus,
  salonSeleccionado,
  q,
  totals,
  capacity,
  occupied,
  available,
  status,
  loadingCapacity,
  capacityError,
}) {
  const hasSalon = Boolean(salonSeleccionado);
  const hasSearch = Boolean(String(q || "").trim());

  return (
    <div className="mb-2 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <BarItem>Campus: {campus || "No detectado"}</BarItem>

        {hasSalon ? (
          <>
            <span>·</span>
            <BarItem>Salón: {salonSeleccionado}</BarItem>
            {loadingCapacity ? (
              <>
                <span>·</span>
                <BarItem>Cargando cupo real...</BarItem>
              </>
            ) : typeof capacity === "number" && typeof occupied === "number" && typeof available === "number" ? (
              <>
                <span>·</span>
                <BarItem>Capacidad: {capacity}</BarItem>
                <span>·</span>
                <BarItem>Matriculados/Ocupados: {occupied}</BarItem>
                <span>·</span>
                <BarItem>Disponibles: {available}</BarItem>
                {status ? (
                  <>
                    <span>·</span>
                    <BarItem>
                      Estado: {status.color} {status.label}
                    </BarItem>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <span>·</span>
                <BarItem>{capacityError ? "No se pudo obtener cupo real" : "Cupo no disponible"}</BarItem>
              </>
            )}
          </>
        ) : (
          <>
            <span>·</span>
            <BarItem>Vista: {hasSearch ? "Búsqueda personalizada" : "Todos los salones"}</BarItem>
            <span>·</span>
            <BarItem>Resultados: {totals?.results ?? 0}</BarItem>
          </>
        )}
      </div>
    </div>
  );
}
