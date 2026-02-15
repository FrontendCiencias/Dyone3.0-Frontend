import React, { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useAdminEndpointsQuery } from "../hooks/useAdminEndpointsQuery";
import { useAdminModelsQuery } from "../hooks/useAdminModelsQuery";

function getErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string") return message;
  return fallback;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
      title={copied ? "Copiado" : "Copiar JSON"}
      aria-label={copied ? "Copiado" : "Copiar JSON"}
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

export default function DevelopmentSection({ canAccess }) {
  const endpointsQuery = useAdminEndpointsQuery(canAccess);
  const modelsQuery = useAdminModelsQuery(canAccess);

  const rawJsonText = useMemo(() => JSON.stringify(endpointsQuery.data || {}, null, 2), [endpointsQuery.data]);
  const rawModelsJson = useMemo(() => JSON.stringify(modelsQuery.data || {}, null, 2), [modelsQuery.data]);
  const models = useMemo(() => (Array.isArray(modelsQuery.data?.items) ? modelsQuery.data.items : []), [modelsQuery.data]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Desarrollo</h3>
            <p className="text-sm text-gray-600">Listado técnico de endpoints disponibles en backend.</p>
          </div>
          <CopyButton text={rawJsonText} />
        </div>

        {!canAccess && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">No tienes permisos para esta sección.</p>}

        {canAccess && endpointsQuery.isLoading && (
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">Cargando endpoints...</p>
        )}

        {canAccess && endpointsQuery.isError && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(endpointsQuery.error, "No se pudo cargar la lista de endpoints.")}</p>
        )}

        {canAccess && !endpointsQuery.isLoading && !endpointsQuery.isError && (
          <pre className="max-h-[420px] overflow-auto rounded-lg border border-gray-200 bg-gray-950 p-4 text-xs leading-5 text-emerald-200">
            {rawJsonText}
          </pre>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Modelos del backend</h3>
            <p className="text-sm text-gray-600">Referencia rápida de modelos y colecciones del backend.</p>
          </div>
          <CopyButton text={rawModelsJson} />
        </div>

        {canAccess && modelsQuery.isLoading && <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">Cargando modelos...</p>}

        {canAccess && modelsQuery.isError && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{getErrorMessage(modelsQuery.error, "No se pudo cargar modelos de backend.")}</p>
        )}

        {canAccess && !modelsQuery.isLoading && !modelsQuery.isError && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-700">
                <tr>
                  <th className="px-3 py-2">Modelo</th>
                  <th className="px-3 py-2">Colección</th>
                  <th className="px-3 py-2">Campos clave</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model, index) => (
                  <tr key={`${model?.name || model?.model || "model"}-${index}`} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">{model?.name || model?.model || "-"}</td>
                    <td className="px-3 py-2 text-gray-700">{model?.collection || model?.table || "-"}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {Array.isArray(model?.keyFields)
                        ? model.keyFields.join(", ")
                        : Array.isArray(model?.fields)
                          ? model.fields.slice(0, 8).map((f) => (typeof f === "string" ? f : f?.name)).filter(Boolean).join(", ")
                          : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!models.length ? <p className="p-3 text-sm text-gray-500">No hay modelos para mostrar.</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
