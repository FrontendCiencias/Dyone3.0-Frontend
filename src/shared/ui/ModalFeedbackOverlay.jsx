import React from "react";
import StatusFeedback from "./StatusFeedback";

export default function ModalFeedbackOverlay({ status, successText, errorText, errorDetail, onClose }) {
  if (status !== "success" && status !== "error") return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/85 px-6" onClick={onClose} role="presentation">
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-5 text-center shadow" onClick={(event) => event.stopPropagation()}>
        <StatusFeedback status={status} successText={successText} errorText={errorText} errorDetail={errorDetail} />
        <button
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
