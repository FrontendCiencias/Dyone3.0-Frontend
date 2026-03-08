import React, { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import Code39Barcode from "../components/Code39Barcode";

function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.filter((item) => item?.internalCode);
}

function resolveStoragePayload(printCardsKey) {
  if (!printCardsKey) return null;

  try {
    const raw = localStorage.getItem(printCardsKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function StudentPrintCardsPreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const printCardsKey = params.get("printCardsKey") || "";

  const items = useMemo(() => {
    const payload = resolveStoragePayload(printCardsKey);
    return normalizeItems(payload?.items);
  }, [printCardsKey]);

  useEffect(() => {
    if (!items.length) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [items.length]);

  if (!items.length) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h1 className="text-lg font-semibold text-gray-900">Vista de impresión</h1>
          <p className="mt-2 text-sm text-gray-600">No hay alumnos seleccionados para imprimir.</p>
          <div className="mt-4">
            <SecondaryButton onClick={() => navigate(ROUTES.dashboardStudentsPrintCards)}>Volver a Imprimir cards</SecondaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          @media print {
            .no-print {
              display: none !important;
            }

            body {
              background: white !important;
            }
          }
        `}
      </style>

      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Preview de cards</h1>
            <p className="text-sm text-gray-600">Formato A4 · 3 columnas x 6 filas (18 por hoja)</p>
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => navigate(ROUTES.dashboardStudentsPrintCards)}>Volver</SecondaryButton>
            <Button onClick={() => window.print()}>Imprimir</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {items.map((item, index) => {
            const classroom = item.classroomLabel || [item.grade, item.section].filter(Boolean).join(" - ") || "-";
            return (
              <article key={`${item.studentId}-${index}`} className="flex h-[44mm] flex-col justify-between border border-gray-400 p-2 text-black">
                <div>
                  <p className="text-[11px] font-bold uppercase leading-tight">{item.lastNames || "-"}</p>
                  <p className="text-[10px] leading-tight">{item.names || "-"}</p>
                  <p className="text-[9px] leading-tight">{classroom}</p>
                </div>
                <div>
                  <Code39Barcode value={item.internalCode} className="h-[14mm] w-full" height={42} />
                  <p className="mt-1 text-center text-[10px] font-semibold tracking-wide">{item.internalCode}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
