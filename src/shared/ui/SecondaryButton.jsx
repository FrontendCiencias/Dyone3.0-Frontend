import React from "react";

export default function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800",
        "transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60",
        "focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
