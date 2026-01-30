import React from "react";
import { useLocation } from "react-router-dom";
import { useMeQuery } from "../modules/auth/hooks/useMeQuery";
import { getToken } from "../lib/authStorage";

const PUBLIC_PATHS = ["/", "/login"];

export default function AuthBootstrap({ children }) {
  const location = useLocation();
  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  const token = getToken();
  const { isLoading, isFetching } = useMeQuery();

  if (isPublic) return children;

  const shouldBlock = Boolean(token) && (isLoading || isFetching);

  if (shouldBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando sesión...</p>
      </div>
    );
  }

  return children;
}
