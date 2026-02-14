import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import BaseModal from "../../../shared/ui/BaseModal";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import { useCreateStudentMutation } from "../hooks/useCreateStudentMutation";

const AUTO_CLOSE_MS = 2000;

function getErrorMessage(error) {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo crear el alumno";
}

function SuccessIcon() {
  return (
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
      ✓
    </span>
  );
}

function ErrorIcon() {
  return (
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
      ✕
    </span>
  );
}

const initialValues = {
  names: "",
  lastNames: "",
  dni: "",
};

export default function CreateStudentModal({ open, onClose }) {
  const createStudentMutation = useCreateStudentMutation();
  const { reset: resetMutation } = createStudentMutation;
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  const overlayOpen = status === "submitting" || status === "success" || status === "error";

  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setErrors({});
    setStatus("idle");
    setServerError("");
    resetMutation();
  }, [open, resetMutation]);

  useEffect(() => {
    if (!open || (status !== "success" && status !== "error")) return undefined;

    const timer = window.setTimeout(() => {
      onClose?.();
    }, AUTO_CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [status, open, onClose]);

  const canSubmit = useMemo(
    () => values.names.trim() && values.lastNames.trim() && status === "idle",
    [values.names, values.lastNames, status]
  );

  const handleChange = (key) => (event) => {
    const nextValue = event.target.value;
    setValues((prev) => ({ ...prev, [key]: nextValue }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setServerError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!values.names.trim()) nextErrors.names = "Ingresa los nombres";
    if (!values.lastNames.trim()) nextErrors.lastNames = "Ingresa los apellidos";

    if (values.dni && !/^\d{8}$/.test(values.dni.trim())) {
      nextErrors.dni = "El DNI debe tener 8 dígitos";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus("submitting");

    try {
      await createStudentMutation.mutateAsync({
        person: {
          names: values.names.trim(),
          lastNames: values.lastNames.trim(),
          dni: values.dni.trim() || undefined,
        },
        student: {},
      });
      setStatus("success");
    } catch (error) {
      setServerError(getErrorMessage(error));
      setStatus("error");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" ? undefined : onClose}
      title="Nuevo alumno"
      maxWidthClass="max-w-xl"
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <SecondaryButton onClick={onClose} disabled={status === "submitting"}>
            Cancelar
          </SecondaryButton>
          <Button type="submit" form="create-student-form" disabled={!canSubmit}>
            Crear nuevo alumno
          </Button>
        </div>
      }
    >
      <div className="relative p-5">
        <form id="create-student-form" className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600">Ventanilla rápida: crea el alumno en menos de 30 segundos.</p>

          <Input label="Nombres" value={values.names} onChange={handleChange("names")} placeholder="Ej: María Fernanda" />
          {errors.names ? <p className="-mt-2 text-xs text-red-600">{errors.names}</p> : null}

          <Input label="Apellidos" value={values.lastNames} onChange={handleChange("lastNames")} placeholder="Ej: Gómez Paredes" />
          {errors.lastNames ? <p className="-mt-2 text-xs text-red-600">{errors.lastNames}</p> : null}

          <Input label="DNI (opcional)" value={values.dni} onChange={handleChange("dni")} placeholder="8 dígitos" />
          {errors.dni ? <p className="-mt-2 text-xs text-red-600">{errors.dni}</p> : null}
        </form>

        <LoadingOverlay open={overlayOpen}>
          {status === "submitting" ? (
            <>
              <Spinner />
              <p className="mt-3 text-sm font-medium text-gray-700">Procesando...</p>
            </>
          ) : status === "success" ? (
            <>
              <SuccessIcon />
              <p className="mt-3 text-sm font-semibold text-emerald-700">Alumno creado correctamente</p>
            </>
          ) : (
            <>
              <ErrorIcon />
              <p className="mt-3 text-sm font-semibold text-red-700">No se pudo crear el alumno</p>
              {serverError ? <p className="mt-1 max-w-xs text-xs text-red-600">{serverError}</p> : null}
            </>
          )}
        </LoadingOverlay>
      </div>
    </BaseModal>
  );
}
