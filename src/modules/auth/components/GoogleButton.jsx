import React from "react";
import { Chrome } from "lucide-react";

export default function GoogleButton() {
  return (
    <button
      type="button"
      disabled
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
      title="Próximamente"
    >
      <Chrome size={18} />
      Continuar con Google (próximamente)
    </button>
  );
}
