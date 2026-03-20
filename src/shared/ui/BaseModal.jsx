import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Spinner from "./Spinner";

export default function BaseModal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  maxWidthClass = "max-w-2xl",
  statusOverlay = null,
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

  const overlayState = statusOverlay?.state || "idle";
  const showOverlay = overlayState === "loading" || overlayState === "success" || overlayState === "error";
  const overlayTitle =
    statusOverlay?.title ||
    (
      overlayState === "loading"
        ? "Procesando..."
        : overlayState === "success"
          ? "Acción completada"
          : overlayState === "error"
            ? "No se pudo completar la acción"
            : ""
    );
  const overlayMessage = statusOverlay?.message || "";

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-black/55"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="absolute inset-0 z-[121] flex items-center justify-center p-4">
        <div className={`relative w-full overflow-hidden rounded-xl bg-white shadow-xl ${maxWidthClass}`} role="dialog" aria-modal="true">
          <div className="relative z-20 flex items-center justify-between border-b px-5 py-4">
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

          {showOverlay ? (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 px-6 text-center backdrop-blur-[2px]"
              onClick={closeOnBackdrop ? onClose : undefined}
              aria-hidden="true"
            >
              <div className="flex max-w-xs flex-col items-center">
                {overlayState === "loading" ? (
                  <Spinner className="h-10 w-10 border-4 border-gray-200 border-t-blue-600" />
                ) : overlayState === "error" ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
                    !
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">
                    ✓
                  </div>
                )}
                <p className="mt-4 text-sm font-semibold text-gray-900">{overlayTitle}</p>
                {overlayMessage ? <p className="mt-1 text-xs text-gray-600">{overlayMessage}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
