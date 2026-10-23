import { useEffect, useMemo, useRef } from "react";
import { resolvePrintPayload, startPrintPreviewLifecycle } from "../utils/printStorage.mjs";

export function usePrintPreview(printKey) {
  const payload = useMemo(() => resolvePrintPayload(printKey), [printKey]);
  const owner = useRef(Math.random().toString(36).slice(2) || "0");
  const lifecycle = useRef(null);

  useEffect(() => {
    if (!payload) return undefined;
    const current = startPrintPreviewLifecycle(printKey, { owner: owner.current });
    lifecycle.current = current;
    return () => {
      current.dispose();
      lifecycle.current = null;
    };
  }, [printKey, payload]);

  const closePreview = () => {
    lifecycle.current?.close();
    window.close();
  };

  return { payload, closePreview };
}
