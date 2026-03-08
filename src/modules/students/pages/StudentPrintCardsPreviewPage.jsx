import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { ROUTES } from "../../../config/routes";
import Code39Barcode from "../components/Code39Barcode";

const CARDS_PER_PAGE = 18;

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

function chunkItems(items, chunkSize) {
  if (!items.length) return [];
  const chunks = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return chunks;
}

export default function StudentPrintCardsPreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const printCardsKey = params.get("printCardsKey") || "";

  const items = useMemo(() => {
    const payload = resolveStoragePayload(printCardsKey);
    return normalizeItems(payload?.items);
  }, [printCardsKey]);

  const pages = useMemo(() => chunkItems(items, CARDS_PER_PAGE), [items]);

  const controls = (
    <div className="print-controls mx-auto mb-3 flex w-[210mm] max-w-full justify-end gap-2 px-2">
      <Button onClick={() => window.print()}>Imprimir</Button>
      <SecondaryButton onClick={() => window.close()}>Cerrar</SecondaryButton>
    </div>
  );

  return (
    <>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          @media print {
            html,
            body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
            }

            body {
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .print-controls {
              display: none !important;
            }

            .print-sheet {
              width: 190mm;
              height: 277mm;
              margin: 0;
              box-shadow: none !important;
              border: 0 !important;
              page-break-after: always;
              break-after: page;
            }

            .print-sheet:last-of-type {
              page-break-after: auto;
              break-after: auto;
            }

            .card-item {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
        {controls}

        {!items.length ? (
          <div className="mx-auto w-[210mm] max-w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">Vista de impresión</h1>
            <p className="mt-2 text-base text-gray-600">No hay alumnos seleccionados para imprimir.</p>
            <div className="mt-4">
              <SecondaryButton onClick={() => navigate(ROUTES.dashboardStudentsPrintCards)}>Volver a Imprimir cards</SecondaryButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4 print:space-y-0">
            {pages.map((pageItems, pageIndex) => (
              <section
                key={`page-${pageIndex}`}
                className="print-sheet mx-auto w-[190mm] max-w-full border border-gray-200 bg-white p-0.5 shadow-sm"
              >
                <div
                  className="grid h-full w-full grid-cols-3 grid-rows-6 gap-[1.8mm]"
                >
                  {pageItems.map((item, index) => {
                    const classroom = item.classroomLabel || [item.grade, item.section].filter(Boolean).join(" - ") || "-";
                    return (
                      <article
                        key={`${item.studentId}-${pageIndex}-${index}`}
                        className="card-item flex min-h-0 flex-col justify-between overflow-hidden border border-gray-400 px-[1.6mm] py-[1.4mm] text-black"
                      >
                        <div className="min-h-0">
                          <p className="truncate text-[12.6px] font-bold uppercase leading-tight">{item.lastNames || "-"}</p>
                          <p className="truncate text-[11.6px] leading-tight">{item.names || "-"}</p>
                          <p className="truncate text-[10.8px] leading-tight">{classroom}</p>
                        </div>
                        <div>
                          <Code39Barcode value={item.internalCode} className="h-[13.5mm] w-full" height={42} />
                          <p className="mt-[1mm] text-center text-[10.8px] font-semibold tracking-wide">{item.internalCode}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
