import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { CircleAlert, ChevronRight } from "lucide-react";
import { getRoleTheme } from "../config/roleTheme";

const DEFAULT_LABELS = {
  dashboard: "Inicio",
  enrollments: "Matrículas",
  payments: "Pagos",
  students: "Alumnos",
  admin: "Administración",
  placeholder: "Módulo",
  new: "Nuevo",
};

const prettify = (seg, labels) => {
  const clean = decodeURIComponent(seg || "").trim();
  if (!clean) return "";
  if (labels?.[clean]) return labels[clean];
  const withSpaces = clean.replace(/[-_]/g, " ");
  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
};

export default function BreadcrumbHeader({
  activeCampus,
  title = "Inicio",
  description,
  breadcrumbLabels = DEFAULT_LABELS,
  hideIdsInBreadcrumbs = true,
  breadcrumbItems,
  studentObservations,
  showStudentObservations = false,
  studentObservationsLoading = false,
}) {
  const theme = getRoleTheme(activeCampus);
  const location = useLocation();

  const autoCrumbs = useMemo(() => {
    const path = location.pathname || "/";
    const parts = path.split("/").filter(Boolean);

    const isLikelyId = (s) =>
      /^[0-9a-fA-F]{24}$/.test(s) ||
      /^[0-9]+$/.test(s) ||
      /^[0-9a-fA-F-]{16,}$/.test(s);

    const filtered = hideIdsInBreadcrumbs ? parts.filter((p) => !isLikelyId(p)) : parts;

    let acc = "";
    return filtered.map((seg) => {
      acc += `/${seg}`;
      return { label: prettify(seg, breadcrumbLabels), to: acc };
    });
  }, [location.pathname, breadcrumbLabels, hideIdsInBreadcrumbs]);

  const crumbs = Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0 ? breadcrumbItems : autoCrumbs;
  const hasCrumbs = Array.isArray(crumbs) && crumbs.length > 0;

  return (
    <div
      className="rounded-2xl p-5 md:p-6 text-white shadow-sm"
      style={{
        backgroundImage: `linear-gradient(to right, ${theme.main}, ${theme.dark})`,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {hasCrumbs && (
            <nav className="mb-2 flex flex-wrap items-center gap-1 text-sm text-white/80" aria-label="Breadcrumb">
              {crumbs.map((item, idx) => {
                const isLast = idx === crumbs.length - 1;
                const isFirst = idx === 0;

                return (
                  <React.Fragment key={`${item.to || item.label}-${idx}`}>
                    {idx > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-70" />}
                    {isLast || !item.to ? (
                      <span
                        className={
                          isFirst
                            ? "truncate text-[11px] font-medium uppercase tracking-[0.18em] text-white/90"
                            : "truncate font-semibold text-white"
                        }
                      >
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        to={item.to}
                        className={
                          isFirst
                            ? "text-[11px] font-medium uppercase tracking-[0.18em] text-white/90 transition-colors hover:text-white"
                            : "underline-offset-2 transition-colors hover:text-white hover:underline"
                        }
                      >
                        {item.label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          <h1 className="text-2xl font-bold leading-tight md:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-xs text-white/70 md:text-sm">{description}</p> : null}
        </div>

        {showStudentObservations ? (
          <div className="group relative flex flex-shrink-0 self-stretch items-center justify-center pl-2 md:pl-5">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              aria-label="Ver observaciones del alumno"
              aria-describedby="student-observations-tooltip"
            >
              <CircleAlert className="h-7 w-7" aria-hidden="true" />
            </button>
            <span
              id="student-observations-tooltip"
              role="tooltip"
              className="pointer-events-none absolute right-0 top-1/2 z-50 mr-12 hidden w-max max-w-[min(22rem,calc(100vw-5rem))] -translate-y-1/2 whitespace-pre-wrap rounded-xl bg-white px-3 py-2 text-left text-xs font-normal leading-relaxed text-gray-800 shadow-lg ring-1 ring-black/10 group-hover:block group-focus-within:block"
            >
              <span className="mb-1 block font-semibold text-gray-950">Observaciones del alumno</span>
              {studentObservationsLoading
                ? "Cargando observaciones..."
                : String(studentObservations || "").trim() || "Sin observaciones registradas."}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
