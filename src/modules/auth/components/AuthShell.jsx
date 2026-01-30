import React, { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../../config/theme";
import { getToken } from "../../../lib/authStorage";

export default function AuthShell({ children }) {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const gradient = useMemo(() => {
    const from = theme?.gradientFrom || "#FF7A00";
    const via = theme?.gradientVia || "#FF3D3D";
    const to = theme?.gradientTo || "#FFB300";
    return `linear-gradient(135deg, ${from}, ${via}, ${to})`;
  }, [theme]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: gradient }}>
      {/* Shapes decorativas */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.4}px)` }}
        />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          style={{ transform: `translateY(${scrollY * -0.25}px)` }}
        />
      </div>

      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
