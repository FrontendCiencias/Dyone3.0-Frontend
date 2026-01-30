// src/modules/dashboard/components/BreadcrumbHeader.jsx
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getRoleTheme } from "../config/roleTheme";

const DEFAULT_LABELS = {
  dashboard: "Inicio",
  enrollments: "Matrículas",
  payments: "Pagos",
  families: "Familias",
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
  activeRole,
  title = "Inicio",
  description,
  breadcrumbLabels = DEFAULT_LABELS,
  hideIdsInBreadcrumbs = true,
}) {
  const theme = getRoleTheme(activeRole);
  const location = useLocation();

  const crumbs = useMemo(() => {
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

  const hasCrumbs = Array.isArray(crumbs) && crumbs.length > 0;

  return (
    <div
      className="rounded-2xl p-5 md:p-6 text-white shadow-sm"
      style={{
        backgroundImage: `linear-gradient(to right, ${theme.main}, ${theme.dark})`,
      }}
    >
      {hasCrumbs && (
        <nav className="flex items-center flex-wrap gap-1 text-sm text-white/85 mb-2" aria-label="Breadcrumb">
          {crumbs.map((item, idx) => {
            const isLast = idx === crumbs.length - 1;

            return (
              <React.Fragment key={`${item.to}-${idx}`}>
                {idx > 0 && <ChevronRight className="w-4 h-4 opacity-70 flex-shrink-0" />}
                {isLast ? (
                  <span className="font-semibold text-white truncate">{item.label}</span>
                ) : (
                  <Link
                    to={item.to}
                    className="hover:text-white hover:underline underline-offset-2 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <h1 className="text-2xl md:text-3xl font-bold leading-tight">{title}</h1>
      {description && <p className="text-white/85 text-sm md:text-base mt-1">{description}</p>}
    </div>
  );
}
