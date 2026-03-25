import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "../../../../../shared/ui/BaseModal";
import Button from "../../../../../components/ui/Button";
import SecondaryButton from "../../../../../shared/ui/SecondaryButton";
import Input from "../../../../../components/ui/Input";
import { useTutorSearchQuery } from "../../../hooks/useTutorSearchQuery";

const RELATIONSHIP_OPTIONS = [
  "Padre",
  "Madre",
  "Abuelo",
  "Abuela",
  "Hermano",
  "Hermana",
  "Tio",
  "Tia",
  "Apoderado",
  "Otro",
];

const EMPTY_FORM = {
  names: "",
  lastNames: "",
  dni: "",
  phone: "",
  gender: "",
  relationship: "",
  notes: "",
  isPrimary: true,
  livesWithStudent: true,
};

function tutorFullName(tutor = {}) {
  const names = String(tutor.names || "").trim();
  const lastNames = String(tutor.lastNames || "").trim();
  return [lastNames, names].filter(Boolean).join(", ") || "-";
}

function buildFormFromTutor(tutor = {}) {
  return {
    names: tutor.names || "",
    lastNames: tutor.lastNames || "",
    dni: tutor.dni || "",
    phone: tutor.phone || "",
    gender: tutor.gender || "",
    relationship: tutor.relationship || "",
    notes: tutor.notes || "",
    isPrimary: tutor.isPrimary !== false,
    livesWithStudent: tutor.livesWithStudent !== false,
  };
}

function TutorCommonFields({ form, setForm, includeGender = false }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          label="Nombres"
          value={form.names}
          onChange={(e) => setForm((prev) => ({ ...prev, names: e.target.value }))}
        />
        <Input
          label="Apellidos"
          value={form.lastNames}
          onChange={(e) => setForm((prev) => ({ ...prev, lastNames: e.target.value }))}
        />
      </div>

      <div className={`grid grid-cols-1 gap-3 ${includeGender ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <Input
          label="DNI"
          value={form.dni}
          onChange={(e) => setForm((prev) => ({ ...prev, dni: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
        />
        <Input
          label="Telefono"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />
        {includeGender ? (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Genero</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Seleccionar...</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Relacion</label>
          <select
            value={form.relationship}
            onChange={(e) => setForm((prev) => ({ ...prev, relationship: e.target.value }))}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Seleccionar...</option>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
            />
            Tutor principal
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.livesWithStudent}
              onChange={(e) => setForm((prev) => ({ ...prev, livesWithStudent: e.target.checked }))}
            />
            Vive con el alumno
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Notas</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          className="min-h-[110px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
    </div>
  );
}

export default function TutorsManageModal({
  open,
  onClose,
  tutors,
  canDelete = false,
  canCreate = false,
  onSaveTutor,
  onDeleteTutor,
  onCreateTutor,
  saving = false,
  deleting = false,
  creating = false,
  success = false,
  errorMessage = "",
}) {
  const list = Array.isArray(tutors) ? tutors : [];
  const [mode, setMode] = useState("edit");
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [linkForm, setLinkForm] = useState(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExistingTutorId, setSelectedExistingTutorId] = useState("");

  useEffect(() => {
    if (!open) return;
    const firstTutorId = list[0]?.id || list[0]?._id || "";
    setSelectedTutorId(String(firstTutorId));
    setMode("edit");
    setCreateForm(EMPTY_FORM);
    setLinkForm(EMPTY_FORM);
    setSearchTerm("");
    setSelectedExistingTutorId("");
  }, [open, list]);

  const selectedTutor = useMemo(
    () => list.find((item) => String(item.id || item._id || "") === String(selectedTutorId || "")) || null,
    [list, selectedTutorId]
  );

  useEffect(() => {
    if (!selectedTutor) {
      setEditForm(EMPTY_FORM);
      return;
    }
    setEditForm(buildFormFromTutor(selectedTutor));
  }, [selectedTutor]);

  const tutorSearchQuery = useTutorSearchQuery(searchTerm, open && canCreate && mode === "link");
  const existingTutorItems = Array.isArray(tutorSearchQuery.data?.items) ? tutorSearchQuery.data.items : [];

  const selectedExistingTutor = useMemo(
    () => existingTutorItems.find((item) => String(item.id || item.personId || "") === String(selectedExistingTutorId || "")) || null,
    [existingTutorItems, selectedExistingTutorId]
  );

  useEffect(() => {
    if (!selectedExistingTutor) return;
    setLinkForm((prev) => ({
      ...prev,
      names: selectedExistingTutor.names || "",
      lastNames: selectedExistingTutor.lastNames || "",
      dni: selectedExistingTutor.dni || "",
      phone: selectedExistingTutor.phone || "",
      relationship: prev.relationship || selectedExistingTutor.relationshipHints?.[0] || "",
    }));
  }, [selectedExistingTutor]);

  const isBusy = saving || deleting || creating;
  const overlayState = isBusy ? "loading" : success ? "success" : errorMessage ? "error" : "idle";
  const overlayTitle = saving
    ? "Guardando tutor"
    : deleting
      ? "Eliminando tutor"
      : creating
        ? "Vinculando tutor"
        : success
          ? "Operacion completada"
          : "No se pudo completar la accion";

  const handleSaveEdit = () => {
    if (!selectedTutor) return;
    onSaveTutor?.(selectedTutor, editForm);
  };

  const handleDelete = () => {
    if (!selectedTutor || !canDelete) return;
    onDeleteTutor?.(selectedTutor);
  };

  const handleCreate = () => {
    onCreateTutor?.(createForm);
  };

  const handleLink = () => {
    if (!selectedExistingTutor) return;
    onCreateTutor?.(linkForm);
  };

  const primaryButtonLabel =
    mode === "create"
      ? (creating ? "Creando..." : "Crear tutor")
      : mode === "link"
        ? (creating ? "Vinculando..." : "Vincular tutor")
        : (saving ? "Guardando..." : "Guardar cambios");

  const handlePrimaryAction = () => {
    if (mode === "create") {
      handleCreate();
      return;
    }
    if (mode === "link") {
      handleLink();
      return;
    }
    handleSaveEdit();
  };

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Gestionar tutores"
      maxWidthClass="max-w-6xl"
      statusOverlay={overlayState !== "idle" ? {
        state: overlayState,
        title: overlayTitle,
        message: errorMessage || "",
      } : null}
      footer={
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cerrar</SecondaryButton>
          {mode === "edit" && canDelete && selectedTutor ? (
            <SecondaryButton
              onClick={handleDelete}
              className="border-red-200 text-red-700 hover:bg-red-50"
              disabled={isBusy || success}
            >
              Eliminar tutor
            </SecondaryButton>
          ) : null}
          <Button
            onClick={handlePrimaryAction}
            disabled={
              isBusy ||
              success ||
              (mode === "edit" && !selectedTutor) ||
              (mode === "link" && !selectedExistingTutor)
            }
          >
            {primaryButtonLabel}
          </Button>
        </div>
      }
    >
      <div className="grid gap-0 md:grid-cols-[300px,1fr]">
        <div className="border-b border-gray-200 p-4 md:border-b-0 md:border-r">
          <p className="mb-3 text-sm font-semibold text-gray-900">Tutores vinculados</p>
          {!list.length ? (
            <p className="mb-3 text-sm text-gray-600">No hay tutores registrados.</p>
          ) : (
            <div className="space-y-2">
              {list.map((tutor, index) => {
                const tutorId = tutor.id || tutor._id || `${index}`;
                const selected = mode === "edit" && String(tutorId) === String(selectedTutorId || "");

                return (
                  <button
                    key={tutorId}
                    type="button"
                    onClick={() => {
                      setMode("edit");
                      setSelectedTutorId(String(tutorId));
                    }}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                      selected
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{tutorFullName(tutor)}</p>
                    <p className="mt-1 text-gray-600">{tutor.relationship || "-"}</p>
                    <p className="text-gray-500">{tutor.phone || "-"}</p>
                    {tutor.isPrimary ? (
                      <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        Principal
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {canCreate ? (
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
              <Button
                onClick={() => {
                  setMode("create");
                  setCreateForm(EMPTY_FORM);
                }}
                className="w-full"
              >
                + Crear tutor
              </Button>
              <SecondaryButton
                onClick={() => {
                  setMode("link");
                  setSearchTerm("");
                  setSelectedExistingTutorId("");
                  setLinkForm(EMPTY_FORM);
                }}
                className="w-full"
              >
                Vincular existente
              </SecondaryButton>
            </div>
          ) : null}
        </div>

        <div className="p-5">
          {mode === "edit" ? (
            !selectedTutor ? (
              <p className="text-sm text-gray-600">Selecciona un tutor para editarlo.</p>
            ) : (
              <TutorCommonFields form={editForm} setForm={setEditForm} includeGender />
            )
          ) : null}

          {mode === "create" ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-900">Crear tutor nuevo</p>
              <TutorCommonFields form={createForm} setForm={setCreateForm} />
            </div>
          ) : null}

          {mode === "link" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Vincular tutor existente</p>
                <Input
                  label="Buscar tutor existente"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedExistingTutorId("");
                  }}
                  placeholder="Busca por nombre, apellidos, DNI o telefono"
                />
              </div>

              {searchTerm.trim().length >= 2 ? (
                <div className="rounded-xl border border-gray-200">
                  <div className="max-h-56 overflow-y-auto">
                    {tutorSearchQuery.isLoading ? (
                      <p className="p-3 text-sm text-gray-600">Buscando tutores...</p>
                    ) : existingTutorItems.length ? (
                      existingTutorItems.map((item) => {
                        const itemId = String(item.id || item.personId || "");
                        const selected = itemId === String(selectedExistingTutorId || "");

                        return (
                          <button
                            key={itemId}
                            type="button"
                            onClick={() => setSelectedExistingTutorId(itemId)}
                            className={`flex w-full flex-col border-b border-gray-100 px-3 py-3 text-left text-sm last:border-b-0 ${
                              selected ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <span className="font-semibold text-gray-900">{item.fullName || tutorFullName(item)}</span>
                            <span className="text-gray-600">{item.dni || "-"} · {item.phone || "-"}</span>
                            {Array.isArray(item.linkedStudents) && item.linkedStudents.length ? (
                              <span className="text-xs text-gray-500">
                                Vinculado a: {item.linkedStudents.map((row) => row.fullName).filter(Boolean).join(" | ")}
                              </span>
                            ) : null}
                          </button>
                        );
                      })
                    ) : (
                      <p className="p-3 text-sm text-gray-600">No se encontraron tutores.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Escribe al menos 2 caracteres para buscar.</p>
              )}

              <TutorCommonFields form={linkForm} setForm={setLinkForm} />
            </div>
          ) : null}

          {errorMessage ? <p className="mt-3 text-xs text-red-600">{errorMessage}</p> : null}
        </div>
      </div>
    </BaseModal>
  );
}
