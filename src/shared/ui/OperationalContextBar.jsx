import React, { useContext } from "react";
import { ChevronLeft } from "lucide-react";
import { ThemeContext } from "../../config/theme";

function ContextToken({ item, showDot = false }) {
  const Icon = item?.icon;

  return (
    <div className={`flex min-w-0 items-center ${item?.grow ? "flex-1" : "flex-none"}`}>
      {showDot ? <span className="shrink-0 text-[14px] leading-none text-gray-300">·</span> : null}
      <div className={`flex min-w-0 items-center gap-1.5 px-3 ${item?.grow ? "flex-1" : ""}`}>
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2.2} /> : null}
        {item?.key ? <span className="shrink-0 text-[12px] font-normal text-gray-400">{item.key}:&nbsp;</span> : null}
        <span className="truncate text-[13px] font-medium tracking-[-0.01em] text-slate-900">{item?.value || "-"}</span>
      </div>
    </div>
  );
}

function ActionButton({ label, icon: Icon, primary = false, onClick, theme }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[28px] items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition"
      style={
        primary
          ? {
              backgroundColor: theme.main,
              borderColor: theme.main,
              color: "#FFFFFF",
            }
          : {
              backgroundColor: "#FFFFFF",
              borderColor: "#E4E7ED",
              color: "#374151",
            }
      }
    >
      {Icon ? <Icon className="h-3 w-3" strokeWidth={2.5} /> : null}
      <span>{label}</span>
    </button>
  );
}

export default function OperationalContextBar({
  items = [],
  actions = [],
  onBack,
  backLabel = "Volver",
  className = "",
}) {
  const { theme } = useContext(ThemeContext);
  const hasActions = Boolean(onBack) || actions.length > 0;

  return (
    <div className={`rounded-[1.25rem] border border-[#E4E7ED] bg-white px-1.5 py-1 shadow-sm ${className}`}>
      <div className="flex min-h-[36px] flex-wrap items-center gap-y-1 md:flex-nowrap">
        <div className="flex min-w-0 flex-1 flex-wrap items-center md:flex-nowrap">
          {items.map((item, index) => (
            <ContextToken key={`${item.key || "item"}-${index}`} item={item} showDot={index > 0} />
          ))}
        </div>

        {hasActions ? (
          <div className="ml-auto flex shrink-0 items-center gap-1.5 px-1">
            {actions.map((action, index) => (
              <ActionButton
                key={`${action.label}-${index}`}
                label={action.label}
                icon={action.icon}
                primary={action.primary}
                onClick={action.onClick}
                theme={theme}
              />
            ))}
            {onBack ? (
              <ActionButton
                label={backLabel}
                icon={ChevronLeft}
                onClick={onBack}
                theme={theme}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
