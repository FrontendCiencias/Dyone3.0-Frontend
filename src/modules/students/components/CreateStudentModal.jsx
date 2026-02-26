import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import BaseModal from "../../../shared/ui/BaseModal";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../shared/ui/ModalFeedbackOverlay";
import { useCreateStudentMutation } from "../hooks/useCreateStudentMutation";

function getErrorMessage(error) {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo crear el alumno";
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

  const overlayOpen = status === "submitting";
  const feedbackOpen = status === "success" || status === "error";

  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setErrors({});
    setStatus("idle");
    setServerError("");
    resetMutation();
  }, [open, resetMutation]);

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

  const handleFeedbackClose = () => {
    if (status === "success") {
      onClose?.();
      return;
    }
    setStatus("idle");
    setServerError("");
  };

  const handleModalClose = () => {
    if (feedbackOpen) {
      handleFeedbackClose();
      return;
    }
    onClose?.();
  };

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" ? undefined : handleModalClose}
      title="Nuevo alumno"
      maxWidthClass="max-w-xl"
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <SecondaryButton onClick={handleModalClose} disabled={status === "submitting"}>
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
          ) : null}
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Alumno creado correctamente"
          errorText="No se pudo crear el alumno"
          errorDetail={serverError}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
