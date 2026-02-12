import React from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../config/routes";
import { useAuth } from "../../../lib/auth";
import { getRoleTheme } from "../config/roleTheme";

export default function DashboardNotFound() {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const theme = getRoleTheme(activeRole);

  const handleBack = () => {
    navigate(ROUTES.dashboard, { replace: true });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-8xl md:text-9xl font-bold text-gray-200 select-none">
        404
      </h1>

      <p className="mt-6 text-xl md:text-2xl font-semibold text-gray-700">
        Página no encontrada
      </p>

      <button
        type="button"
        onClick={handleBack}
        className="
          mt-8
          px-6 py-3
          rounded-xl
          text-sm font-semibold
          text-white
          shadow-sm
          hover:shadow-lg
          transition-all duration-200
        "
        style={{
          backgroundImage: `linear-gradient(to right, ${theme.main}, ${theme.dark})`,
        }}
      >
        Volver al Panel
      </button>
    </div>
  );
}
