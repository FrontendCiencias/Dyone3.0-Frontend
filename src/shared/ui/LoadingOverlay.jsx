import React from "react";
import Spinner from "./Spinner";

export default function LoadingOverlay({ open, children, message = "Procesando..." }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 px-6 text-center">
      {children || (
        <>
          <Spinner />
          <p className="mt-3 text-sm font-medium text-gray-700">{message}</p>
        </>
      )}
    </div>
  );
}
