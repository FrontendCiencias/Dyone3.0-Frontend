import React from "react";

function BarItem({ children }) {
  return <span className="font-medium text-gray-700">{children}</span>;
}

export default function StudentsContextBar({
  items,
  campus,
  salonSeleccionado,
  q,
  totals,
  capacity,
  occupied,
  available,
  reserved,
  status,
  loadingCapacity,
  capacityError,
}) {
  const customItems = Array.isArray(items) ? items.filter((item) => String(item || "").trim()) : null;
  if (customItems?.length) {
    return (
      <div className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {customItems.map((item, index) => (
            <React.Fragment key={`${item}-${index}`}>
              {index > 0 ? <span>·</span> : null}
              <BarItem>{item}</BarItem>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  const hasSalon = Boolean(salonSeleccionado);
  const hasSearch = Boolean(String(q || "").trim());
  const hasAnyCapacityData = [capacity, occupied, available, reserved].some((value) => typeof value === "number");

  return (
    <div className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
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
            ) : hasAnyCapacityData ? (
              <>
                {typeof capacity === "number" ? (
                  <>
                    <span>·</span>
                    <BarItem>Capacidad: {capacity}</BarItem>
                  </>
                ) : null}
                {typeof occupied === "number" ? (
                  <>
                    <span>·</span>
                    <BarItem>Matriculados/Ocupados: {occupied}</BarItem>
                  </>
                ) : null}
                {typeof reserved === "number" ? (
                  <>
                    <span>·</span>
                    <BarItem>Reservadas: {reserved}</BarItem>
                  </>
                ) : null}
                {typeof available === "number" ? (
                  <>
                    <span>·</span>
                    <BarItem>Disponibles: {available}</BarItem>
                  </>
                ) : null}
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
