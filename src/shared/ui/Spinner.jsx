import React from "react";

export default function Spinner({ className = "" }) {
  return <span className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${className}`} />;
}
