import React from "react";

export default function WidgetShell({
  title,
  subtitle,
  right,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {title}
          </div>
          {subtitle ? (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {subtitle}
            </div>
          ) : null}
        </div>

        {right ? <div className="flex-shrink-0">{right}</div> : null}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}
