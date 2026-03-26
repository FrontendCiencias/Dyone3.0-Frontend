import React from "react";
import { ArrowRight } from "lucide-react";

const VARIANT_STYLES = {
  neutral: {
    card: "border-gray-200 bg-white",
    clickableCard: "border-gray-300 bg-white hover:bg-gray-50",
    label: "text-gray-500",
    value: "text-gray-900",
    sub: "text-gray-500",
    icon: "text-gray-600",
    iconBg: "bg-gray-100",
    action: "text-gray-700",
  },
  amber: {
    card: "border-amber-300 bg-amber-50/60",
    clickableCard: "border-amber-300 bg-white hover:bg-amber-50/70",
    label: "text-amber-700",
    value: "text-amber-900",
    sub: "text-amber-700",
    icon: "text-amber-600",
    iconBg: "bg-amber-100",
    action: "text-amber-700",
  },
  red: {
    card: "border-rose-300 bg-rose-50/70",
    clickableCard: "border-rose-300 bg-white hover:bg-rose-50/70",
    label: "text-rose-700",
    value: "text-rose-900",
    sub: "text-rose-700",
    icon: "text-rose-500",
    iconBg: "bg-rose-100",
    action: "text-rose-700",
  },
  green: {
    card: "border-emerald-300 bg-emerald-50/60",
    clickableCard: "border-emerald-300 bg-white hover:bg-emerald-50/70",
    label: "text-emerald-800",
    value: "text-emerald-950",
    sub: "text-emerald-700",
    icon: "text-emerald-500",
    iconBg: "bg-emerald-100",
    action: "text-emerald-700",
  },
  blue: {
    card: "border-sky-300 bg-sky-50/70",
    clickableCard: "border-sky-300 bg-white hover:bg-sky-50/70",
    label: "text-sky-700",
    value: "text-sky-950",
    sub: "text-sky-700",
    icon: "text-sky-500",
    iconBg: "bg-sky-100",
    action: "text-sky-700",
  },
};

export default function OperationalSummaryCard({
  label,
  value,
  sub,
  hint,
  icon: Icon,
  variant = "neutral",
  actionLabel,
  onAction,
  large = false,
  loading = false,
  className = "",
}) {
  const t = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  const clickable = typeof onAction === "function";
  const helperText = sub || hint;
  const Tag = clickable ? "button" : "div";

  return (
    <Tag
      type={clickable ? "button" : undefined}
      onClick={clickable ? onAction : undefined}
      className={[
        "group relative flex min-h-[92px] min-w-0 items-center gap-3 overflow-hidden rounded-[1.25rem] border px-4 py-3 text-left shadow-sm transition-colors duration-200",
        clickable ? t.clickableCard : t.card,
        className,
      ].join(" ")}
    >
      {Icon ? (
        <div className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl ${t.iconBg}`}>
          <Icon className={`h-6 w-6 ${t.icon}`} strokeWidth={2.1} />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        {loading ? (
          <div className="min-w-0">
            <div className="h-[11px] w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-[10px] h-[10px] w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-[6px] h-[10px] w-28 animate-pulse rounded bg-gray-100" />
          </div>
        ) : (
          <>
            <p className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] leading-none ${t.label}`}>{label}</p>
            <p
              className={[
                "mt-2 truncate font-mono font-bold leading-none tracking-tight",
                large ? "text-[1.35rem]" : "text-[1.14rem]",
                t.value,
              ].join(" ")}
            >
              {value}
            </p>
            {helperText ? <p className={`mt-1 truncate text-[10.5px] leading-none ${t.sub}`}>{helperText}</p> : null}
          </>
        )}
      </div>

      {clickable && !loading ? (
        <>
          <div className="h-7 w-px shrink-0 bg-current opacity-10" />
          <div className={`flex shrink-0 items-center gap-1 text-[11px] font-semibold ${t.action}`}>
            {actionLabel ? <span>{actionLabel}</span> : null}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
          </div>
        </>
      ) : null}
    </Tag>
  );
}
