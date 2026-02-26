import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import Input from "../../../components/ui/Input";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../shared/ui/ModalFeedbackOverlay";
import { normalizeSearchText } from "../../students/domain/searchText";
import { useStudentsSearchQuery } from "../../students/hooks/useStudentsSearchQuery";
import { useCreatePaymentMutation } from "../hooks/useCreatePaymentMutation";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo registrar el pago.";
}

export default function RegisterPaymentModal({ open, onClose, fixedStudent = null, title = "Registrar pago" }) {
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayDate());
  const [method, setMethod] = useState("CASH");
  const [observation, setObservation] = useState("");
  const [formError, setFormError] = useState({});

  const normalizedSearch = normalizeSearchText(studentSearch.trim());
  const canSearchStudents = !fixedStudent && normalizedSearch.length >= 2;

  const studentsQuery = useStudentsSearchQuery({
    q: studentSearch,
    enabled: canSearchStudents,
    mode: "global",
    limit: 10,
  });

  const createPaymentMutation = useCreatePaymentMutation(fixedStudent?.id || selectedStudentId);

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setServerError("");
    setStudentSearch("");
    setSelectedStudentId(fixedStudent?.id || "");
    setAmount("");
    setPaymentDate(todayDate());
    setMethod("CASH");
    setObservation("");
    setFormError({});
  }, [open, fixedStudent]);

  const students = useMemo(
    () => (Array.isArray(studentsQuery.data?.items) ? studentsQuery.data.items : []),
    [studentsQuery.data]
  );

  const targetStudent = fixedStudent || students.find((row) => String(row.id || row._id) === String(selectedStudentId));
  const parsedAmount = Number(amount);

  const validateForm = () => {
    const errors = {};
    if (!(fixedStudent?.id || selectedStudentId)) errors.student = "Selecciona un alumno.";
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) errors.amount = "Ingresa un monto mayor a 0.";
    if (!method) errors.method = "Selecciona un método.";
    if (!paymentDate || Number.isNaN(new Date(paymentDate).getTime())) errors.paymentDate = "Ingresa una fecha válida.";
    return errors;
  };

  const isSubmitDisabled = status === "submitting" || Object.keys(validateForm()).length > 0;

  const overlayOpen = status === "submitting";
  const feedbackOpen = status === "success" || status === "error";

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

  const handleSubmit = async () => {
    const errors = validateForm();
    setFormError(errors);
    if (Object.keys(errors).length > 0) return;

    const studentId = fixedStudent?.id || selectedStudentId;

    setStatus("submitting");
    setServerError("");

    try {
      await createPaymentMutation.mutateAsync({
        studentId,
        amount: parsedAmount,
        paymentDate,
        method,
        observation: observation.trim() || undefined,
      });

      if (!fixedStudent) {
        setStudentSearch("");
        setSelectedStudentId("");
        setAmount("");
        setPaymentDate(todayDate());
        setMethod("CASH");
        setObservation("");
      }

      setStatus("success");
    } catch (error) {
      setServerError(getErrorMessage(error));
      setStatus("error");
    }
  };

  return (
    <BaseModal
      open={open}
      onClose={status === "submitting" ? undefined : handleModalClose}
      title={title}
      closeOnBackdrop={status !== "submitting"}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={handleModalClose} disabled={status === "submitting"}>Cancelar</SecondaryButton>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>Registrar pago</Button>
        </div>
      }
    >
      <div className="relative space-y-3 p-5 text-sm text-gray-700">
        {!fixedStudent && (
          <>
            <Input
              label="Buscar alumno"
              placeholder="DNI, código o nombre"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />
            <label className="block text-sm font-medium text-gray-700">Alumno</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              <option value="">Selecciona alumno</option>
              {students.map((student) => (
                <option key={student.id || student._id} value={student.id || student._id}>
                  {[student.lastNames, student.names].filter(Boolean).join(", ")} · DNI {student.dni || "-"}
                </option>
              ))}
            </select>
            {formError.student && <p className="text-sm text-red-600">{formError.student}</p>}
          </>
        )}

        {targetStudent && (
          <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
            Alumno: {[targetStudent.lastNames, targetStudent.names].filter(Boolean).join(", ")} · DNI {targetStudent.dni || "-"}
          </p>
        )}

        <Input label="Monto" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        {formError.amount && <p className="text-sm text-red-600">{formError.amount}</p>}

        <Input label="Fecha" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        {formError.paymentDate && <p className="text-sm text-red-600">{formError.paymentDate}</p>}

        <label className="block text-sm font-medium text-gray-700">Método</label>
        <select className="w-full rounded-lg border border-gray-300 px-3 py-2" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="CASH">Efectivo</option>
          <option value="YAPE">Yape</option>
          <option value="TRANSFER">Transferencia</option>
          <option value="OTHER">Otro</option>
        </select>
        {formError.method && <p className="text-sm text-red-600">{formError.method}</p>}

        <label className="block text-sm font-medium text-gray-700">Observación</label>
        <textarea className="min-h-[90px] w-full rounded-lg border border-gray-300 px-3 py-2" value={observation} onChange={(e) => setObservation(e.target.value)} />

        <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
          Asignación automática a cargos pendiente de backend (allocations).
        </p>

        <LoadingOverlay open={overlayOpen}>
          {status === "submitting" ? (
            <>
              <Spinner />
              <p className="mt-2 text-sm text-gray-700">Registrando pago...</p>
            </>
          ) : null}
        </LoadingOverlay>

        <ModalFeedbackOverlay
          status={status}
          successText="Pago registrado correctamente"
          errorText="No se pudo registrar el pago"
          errorDetail={serverError}
          onClose={handleFeedbackClose}
        />
      </div>
    </BaseModal>
  );
}
