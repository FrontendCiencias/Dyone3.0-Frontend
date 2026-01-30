import { useEffect, useMemo, useState } from "react";
import { BRAND_STORAGE_KEY, DEFAULT_BRAND_KEY } from "../data/brands";

export function useBrand(brands) {
  const [brandKey, setBrandKey] = useState(DEFAULT_BRAND_KEY);

  useEffect(() => {
    const saved = window.localStorage.getItem(BRAND_STORAGE_KEY);
    if (saved && brands[saved]) setBrandKey(saved);
  }, [brands]);

  useEffect(() => {
    window.localStorage.setItem(BRAND_STORAGE_KEY, brandKey);
  }, [brandKey]);

  const brand = useMemo(() => brands[brandKey] || brands[DEFAULT_BRAND_KEY], [brands, brandKey]);

  return { brandKey, setBrandKey, brand };
}
