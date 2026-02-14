// src/modules/dashboard/components/RoleSwitcher.jsx
import React from "react";
import { ChevronDown } from "lucide-react";
import { getRoleTheme } from "../config/roleTheme";
import Button from "../../../components/ui/Button";

const roleLabel = (role) => {
  const r = String(role || "").toUpperCase();
  if (r.startsWith("SECRETARY_CIMAS")) return "Secretaría - Cimas";
  if (r.startsWith("SECRETARY_CIENCIAS_APLICADAS")) return "Secretaría - Ciencias Aplicadas";
  if (r.startsWith("SECRETARY_CIENCIAS")) return "Secretaría - Ciencias";
  if (r.startsWith("DIRECTOR")) return "Director";
  if (r.startsWith("PROMOTER")) return "Promotor";
  if (r.startsWith("ADMIN")) return "Admin";
  return "Usuario";
};

export default function RoleSwitcher({ roles = [], activeRole, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  const safeRoles = Array.isArray(roles) ? roles : [];
  const current = activeRole || safeRoles[0] || "";

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

  const theme = getRoleTheme(current);

  const canSwitch = safeRoles.length > 1;

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
        title={roleLabel(current)}
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: theme.main }}
        />
        <span className="hidden sm:block max-w-[180px] truncate text-gray-800">
          {roleLabel(current)}
        </span>
        {canSwitch && <ChevronDown className="w-4 h-4 text-gray-400" />}
      </Button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-72
            rounded-2xl overflow-hidden
            bg-white shadow-xl
            border border-gray-100
          "
          role="menu"
        >
          <div
            className="h-1 w-full"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.main}, ${theme.dark})`,
            }}
          />

          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 mb-2">
              Cambiar rol
            </div>

            <div className="space-y-1">
              {safeRoles.map((r) => {
                const isActive = r === current;
                const t = getRoleTheme(r);

                return (
                  <Button
                    key={r}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (!isActive) onChange?.(r);
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
                        style={{ backgroundColor: t.main }}
                      />
                      <span className="truncate text-gray-800">{roleLabel(r)}</span>
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
