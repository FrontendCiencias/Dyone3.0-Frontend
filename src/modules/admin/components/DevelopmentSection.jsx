import React, { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useAdminEndpointsQuery } from "../hooks/useAdminEndpointsQuery";

function getErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return "No se pudo cargar la lista de endpoints.";
}

export default function DevelopmentSection({ canAccess }) {
  const endpointsQuery = useAdminEndpointsQuery(canAccess);
  const [copied, setCopied] = useState(false);

  const rawJsonText = useMemo(() => JSON.stringify(endpointsQuery.data || {}, null, 2), [endpointsQuery.data]);

  const handleCopy = async () => {
    if (!rawJsonText) return;

    await navigator.clipboard.writeText(rawJsonText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Desarrollo</h3>
          <p className="text-sm text-gray-600">Listado técnico de endpoints disponibles en backend.</p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!canAccess || endpointsQuery.isLoading || endpointsQuery.isError}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          title={copied ? "Copiado" : "Copiar JSON"}
          aria-label={copied ? "Copiado" : "Copiar JSON"}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {!canAccess && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p>}

      {canAccess && endpointsQuery.isLoading && (
        <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">Cargando endpoints...</p>
      )}

      {canAccess && endpointsQuery.isError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(endpointsQuery.error)}</p>
      )}

      {canAccess && !endpointsQuery.isLoading && !endpointsQuery.isError && (
        <pre className="max-h-[520px] overflow-auto rounded-lg border border-gray-200 bg-gray-950 p-4 text-xs leading-5 text-emerald-200">
          {rawJsonText}
        </pre>
      )}
    </div>
  );
}
