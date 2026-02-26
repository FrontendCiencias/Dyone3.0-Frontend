// src/modules/dashboard/components/RoleSwitcher.jsx
import React from "react";
import { ChevronDown } from "lucide-react";
import Button from "../../../components/ui/Button";
import { formatAccountLabel } from "../utils/accounts";
import { getThemeByCampusCode } from "../../../config/theme";

function accountKey(option) {
  return `${option.role}:${option.campus}`;
}

export default function RoleSwitcher({ accountOptions = [], activeAccount, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  const safeOptions = Array.isArray(accountOptions) ? accountOptions : [];
  const current = activeAccount || safeOptions[0] || { role: "", campus: "CIENCIAS" };

  React.useEffect(() => {
    const onClickOutside = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const currentTheme = getThemeByCampusCode(current.campus);

  const canSwitch = safeOptions.length > 1;

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        onClick={() => canSwitch && setOpen((v) => !v)}
        variant="secondary"
        size="sm"
        className={`border border-gray-200 !bg-white !text-gray-800 ${canSwitch ? "hover:bg-gray-50" : "cursor-default opacity-90"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={formatAccountLabel(current)}
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: currentTheme.main }}
        />
        <span className="hidden sm:block max-w-[220px] truncate text-gray-800">
          {formatAccountLabel(current)}
        </span>
        {canSwitch && <ChevronDown className="w-4 h-4 text-gray-400" />}
      </Button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-80
            rounded-2xl overflow-hidden
            bg-white shadow-xl
            border border-gray-100
          "
          role="menu"
        >
          <div
            className="h-1 w-full"
            style={{
              backgroundImage: `linear-gradient(to right, ${currentTheme.main}, ${currentTheme.dark})`,
            }}
          />

          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 mb-2">
              Cambiar subcuenta
            </div>

            <div className="space-y-1">
              {safeOptions.map((opt) => {
                const isActive = opt.role === current.role && opt.campus === current.campus;
                const theme = getThemeByCampusCode(opt.campus);

                return (
                  <Button
                    key={accountKey(opt)}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (!isActive) onChange?.(opt);
                    }}
                    className={`
                      w-full flex items-center justify-between
                      border
                      ${isActive ? "!bg-gray-50 border-gray-200" : "!bg-white border-transparent hover:bg-gray-50"}
                    `}
                    variant="ghost"
                    size="sm"
                    role="menuitem"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: theme.main }}
                      />
                      <span className="truncate text-gray-800">{formatAccountLabel(opt)}</span>
                    </span>

                    {isActive && (
                      <span className="text-xs font-semibold text-gray-500">
                        Activo
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
