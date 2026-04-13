import React from "react";

export default function OperationalSearchBar({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm ${className}`}>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}
