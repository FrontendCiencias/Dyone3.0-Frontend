import { useState } from "react";

export function useClipboard(resetMs = 1200) {
  const [copied, setCopied] = useState(false);

  const copy = async (value) => {
    if (!value) return false;
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    window.setTimeout(() => setCopied(false), resetMs);
    return true;
  };

  return { copied, copy };
}
