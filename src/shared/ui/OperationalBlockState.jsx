import React from "react";

function Spinner() {
  return <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />;
}

export default function OperationalBlockState({
  mode = "loading",
  message,
  minHeight = "180px",
  className = "",
}) {
  const isError = mode === "error";
  const isEmpty = mode === "empty";

  return (
    <div
      className={[
        "flex items-center justify-center rounded-2xl border bg-white px-4 py-6 text-sm shadow-sm",
        isError ? "border-red-100 text-red-700" : "border-gray-200 text-gray-500",
        className,
      ].join(" ")}
      style={{ minHeight }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {!isError && !isEmpty ? <Spinner /> : null}
        <p>{message}</p>
      </div>
    </div>
  );
}
