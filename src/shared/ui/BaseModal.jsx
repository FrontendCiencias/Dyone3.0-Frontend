import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function BaseModal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  maxWidthClass = "max-w-2xl",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleEsc = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-black/55"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="absolute inset-0 z-[121] flex items-center justify-center p-4">
        <div className={`w-full overflow-hidden rounded-xl bg-white shadow-xl ${maxWidthClass}`} role="dialog" aria-modal="true">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="rounded px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {children}

          {footer ? <div className="border-t px-5 py-3">{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
