import React from "react";
import Button from "../../../components/ui/Button";

export default function CreateModal({ title, isOpen, onClose, children, onSubmit, isSubmitting }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.();
          }}
          className="space-y-4"
        >
          {children}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" onClick={onClose} className="!bg-gray-500">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
