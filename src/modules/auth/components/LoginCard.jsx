import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../../../config/theme";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import GoogleButton from "./GoogleButton";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function LoginCard({
  values,
  onChange,
  onSubmit,
  isLoading,
  errorMessage,
}) {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  return (
    <div className="relative">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute -top-14 left-0 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>

      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            }}
          >
            <Sparkles className="text-white" size={32} />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900">Dyone</h1>
          <p className="text-gray-600 mt-2">Accede con tu cuenta institucional</p>
        </div>

        {/* Info Box */}
        <div
          className="rounded-2xl p-5 mb-6 border"
          style={{
            backgroundColor: theme.accentSoft || "rgba(255, 122, 0, 0.12)",
            borderColor: theme.accentSoft || "rgba(255, 122, 0, 0.18)",
          }}
        >
          <p className="font-semibold text-gray-800 mb-2">Inicio de sesión seguro</p>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Solo usuarios registrados pueden acceder</li>
            <li>• Los roles determinan tu panel</li>
            <li>• Si no tienes acceso, contacta al administrador</li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Correo"
            type="email"
            value={values.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="admin@cienciasperu.edu.pe"
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            value={values.password}
            onChange={(e) => onChange("password", e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400">o</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <GoogleButton />

        <p className="text-center text-sm text-gray-500 mt-6">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </div>

      <div className="text-center mt-6 text-white/85 text-sm">
        <p>¿Problemas para iniciar sesión?</p>
        <p className="mt-1">Contacta al administrador del colegio</p>
      </div>
    </div>
  );
}
