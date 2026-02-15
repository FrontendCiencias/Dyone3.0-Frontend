import React from "react";

function SuccessIcon() {
  return <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</span>;
}

function ErrorIcon() {
  return <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">✕</span>;
}

export default function StatusFeedback({ status, successText, errorText, errorDetail }) {
  if (status === "success") {
    return (
      <>
        <SuccessIcon />
        <p className="mt-3 text-sm font-semibold text-emerald-700">{successText || "Operación completada"}</p>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <ErrorIcon />
        <p className="mt-3 text-sm font-semibold text-red-700">{errorText || "No se pudo completar"}</p>
        {errorDetail ? <p className="mt-1 max-w-xs text-xs text-red-600">{errorDetail}</p> : null}
      </>
    );
  }

  return null;
}
