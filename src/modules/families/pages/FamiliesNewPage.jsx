import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import { ROUTES } from "../../../config/routes";
import { useCreateFamilyMutation } from "../hooks/useCreateFamilyMutation";
import { useAddTutorToFamilyMutation } from "../hooks/useAddTutorToFamilyMutation";
import { useCreateStudentWithPersonMutation } from "../hooks/useCreateStudentWithPersonMutation";
import { useLinkStudentToFamilyMutation } from "../hooks/useLinkStudentToFamilyMutation";
import { useUnassignedStudentsSearchQuery } from "../hooks/useUnassignedStudentsSearchQuery";

const RELATIONSHIP_OPTIONS = ["MADRE", "PADRE", "APODERADO", "ABUELO", "ABUELA", "TÍO", "TÍA", "OTRO"];

const baseTutor = {
  names: "",
  lastNames: "",
  dni: "",
  phone: "",
  email: "",
  address: "",
  gender: "F",
  relationship: "MADRE",
  livesWithStudent: true,
  isPrimary: true,
  notes: "",
};

const baseStudentDraft = {
  names: "",
  lastNames: "",
  dni: "",
  internalCode: "",
  gender: "F",
  activeStatus: "ACTIVE",
};

const getId = (x) => x?.id || x?._id || x?.studentId || x?.familyId || null;

function tutorErrors(t) {
  const e = {};
  if (!String(t.names || "").trim()) e.names = "Nombres requeridos";
  if (!String(t.lastNames || "").trim()) e.lastNames = "Apellidos requeridos";
  const dni = String(t.dni || "").trim();
  if (dni && !/^\d{8}$/.test(dni)) e.dni = "DNI inválido (8 dígitos)";
  return e;
}

function mapStudent(item) {
  const person = item?.person || item?.personId || {};
  const id = item?.studentId || item?.id || item?._id;
  const names = person?.names || item?.names || "";
  const lastNames = person?.lastNames || item?.lastNames || "";
  const dni = person?.dni || item?.dni || "";
  const internalCode = item?.internalCode || item?.code || "";
  const label = [lastNames, names].filter(Boolean).join(", ") || `Alumno ${id}`;
  return { studentId: id, label, dni, internalCode };
}

export default function FamiliesNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preloadStudentId = searchParams.get("preloadStudentId") || null;

  const [familyNotes, setFamilyNotes] = useState("");
  const [tutorsDraft, setTutorsDraft] = useState([{ ...baseTutor, tempId: crypto.randomUUID() }]);
  const [studentsToLink, setStudentsToLink] = useState([]);
  const [studentsToCreate, setStudentsToCreate] = useState([]);
  const [newStudentDraft, setNewStudentDraft] = useState(baseStudentDraft);
  const [studentSearchInput, setStudentSearchInput] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const createFamilyMutation = useCreateFamilyMutation();
  const addTutorMutation = useAddTutorToFamilyMutation();
  const createStudentMutation = useCreateStudentWithPersonMutation();
  const linkStudentMutation = useLinkStudentToFamilyMutation();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedStudentSearch(studentSearchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [studentSearchInput]);

  useEffect(() => {
    if (!preloadStudentId) return;
    setStudentsToLink((prev) => {
      if (prev.some((x) => String(x.studentId) === String(preloadStudentId))) return prev;
      return [...prev, { studentId: preloadStudentId, label: "Alumno seleccionado", fromPreload: true }];
    });
  }, [preloadStudentId]);

  const unassignedQuery = useUnassignedStudentsSearchQuery(debouncedStudentSearch, 20, true);
  const unassignedRows = useMemo(() => {
    const rows = Array.isArray(unassignedQuery.data?.items)
      ? unassignedQuery.data.items
      : Array.isArray(unassignedQuery.data) ? unassignedQuery.data : [];
    return rows.map(mapStudent).filter((x) => Boolean(x.studentId));
  }, [unassignedQuery.data]);

  const tutorValidation = useMemo(() => tutorsDraft.map(tutorErrors), [tutorsDraft]);
  const hasTutorErrors = useMemo(() => tutorValidation.some((x) => Object.keys(x).length > 0), [tutorValidation]);
  const primaryCount = tutorsDraft.filter((t) => t.isPrimary).length;
  const canCreate = tutorsDraft.length > 0 && primaryCount === 1 && !hasTutorErrors && status !== "submitting";

  const summaryWarnings = [];
  if (!tutorsDraft.length) summaryWarnings.push("Debes agregar al menos un tutor.");
  if (primaryCount !== 1) summaryWarnings.push("Debe existir exactamente un tutor principal.");
  if (!studentsToLink.length && !studentsToCreate.length) summaryWarnings.push("Crearás una familia sin alumnos.");

  const upsertTutor = (tempId, patch) => {
    setTutorsDraft((prev) => prev.map((t) => (t.tempId === tempId ? { ...t, ...patch } : t)));
  };

  const setPrimaryTutor = (tempId) => {
    setTutorsDraft((prev) => prev.map((t) => ({ ...t, isPrimary: t.tempId === tempId })));
  };

  const addStudentToLink = (student) => {
    setStudentsToLink((prev) => {
      if (prev.some((x) => String(x.studentId) === String(student.studentId))) return prev;
      return [...prev, student];
    });
  };

  const addStudentDraft = () => {
    if (!newStudentDraft.names.trim() || !newStudentDraft.lastNames.trim()) {
      setErrorMsg("Completa nombres y apellidos del alumno nuevo.");
      return;
    }
    if (newStudentDraft.dni && !/^\d{8}$/.test(newStudentDraft.dni.trim())) {
      setErrorMsg("DNI inválido para alumno nuevo.");
      return;
    }

    const draft = {
      ...newStudentDraft,
      tempId: crypto.randomUUID(),
      label: `${newStudentDraft.lastNames.trim()}, ${newStudentDraft.names.trim()}`,
    };
    setStudentsToCreate((prev) => [...prev, draft]);
    setNewStudentDraft(baseStudentDraft);
    setErrorMsg("");
  };

  const handleCreateFamilyFlow = async () => {
    if (!canCreate) return;

    setStatus("submitting");
    setErrorMsg("");
    setOkMsg("");

    try {
      console.info("[FamiliesNewPage] create family start");
      const familyRes = await createFamilyMutation.mutateAsync({ notes: familyNotes.trim() || undefined });
      const familyId = getId(familyRes?.family) || getId(familyRes);
      if (!familyId) throw new Error("No se pudo obtener familyId");

      for (const tutor of tutorsDraft) {
        console.info("[FamiliesNewPage] add tutor", { familyId, tutorTempId: tutor.tempId });
        await addTutorMutation.mutateAsync({
          familyId,
          relationship: tutor.relationship,
          isPrimary: Boolean(tutor.isPrimary),
          livesWithStudent: Boolean(tutor.livesWithStudent),
          notes: tutor.notes?.trim() || undefined,
          names: tutor.names.trim(),
          lastNames: tutor.lastNames.trim(),
          dni: tutor.dni.trim() || undefined,
          phone: tutor.phone.trim() || undefined,
          email: tutor.email.trim() || undefined,
          address: tutor.address.trim() || undefined,
          gender: tutor.gender,
        });
      }

      const createdStudentIds = [];
      for (const draft of studentsToCreate) {
        console.info("[FamiliesNewPage] create student", { draftId: draft.tempId });
        const created = await createStudentMutation.mutateAsync({
          internalCode: draft.internalCode.trim() || undefined,
          activeStatus: draft.activeStatus || "ACTIVE",
          person: {
            names: draft.names.trim(),
            lastNames: draft.lastNames.trim(),
            dni: draft.dni.trim() || undefined,
            gender: draft.gender,
          },
        });
        const studentId = getId(created?.student) || getId(created);
        if (studentId) createdStudentIds.push(studentId);
      }

      const allStudentIds = Array.from(new Set([
        ...studentsToLink.map((x) => x.studentId),
        ...createdStudentIds,
      ].filter(Boolean).map(String)));

      for (const studentId of allStudentIds) {
        console.info("[FamiliesNewPage] link student", { familyId, studentId });
        await linkStudentMutation.mutateAsync({ familyId, studentId });
      }

      setOkMsg("Familia creada correctamente.");
      navigate(ROUTES.dashboardFamilyDetail(familyId));
    } catch (error) {
      console.warn("[FamiliesNewPage] flow error", { status: error?.response?.status });
      setErrorMsg(error?.response?.data?.message || error?.message || "No se pudo completar la creación de la familia.");
      setStatus("error");
      return;
    }

    setStatus("success");
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_350px]">
      <div className="space-y-4">
        <Card className="border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Nueva familia</h2>
          <p className="mt-1 text-sm text-gray-600">Crea una familia con 1+ tutores y opcionalmente alumnos.</p>
        </Card>

        {errorMsg ? <Card className="border border-red-200 bg-red-50 text-sm text-red-700">{errorMsg}</Card> : null}
        {okMsg ? <Card className="border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">{okMsg}</Card> : null}

        <Card className="relative border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">1) Tutores</h3>
          <div className="mt-3 space-y-3">
            {tutorsDraft.map((tutor, idx) => {
              const errors = tutorValidation[idx] || {};
              return (
                <div key={tutor.tempId} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-gray-800">Tutor #{idx + 1}</p>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600">
                        <input type="radio" checked={tutor.isPrimary} onChange={() => setPrimaryTutor(tutor.tempId)} className="mr-1" />
                        Principal
                      </label>
                      {tutorsDraft.length > 1 ? (
                        <SecondaryButton className="px-2 py-1 text-xs" onClick={() => setTutorsDraft((prev) => prev.filter((x) => x.tempId !== tutor.tempId))}>Quitar</SecondaryButton>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <Input label="Nombres" value={tutor.names} onChange={(e) => upsertTutor(tutor.tempId, { names: e.target.value })} />
                    <Input label="Apellidos" value={tutor.lastNames} onChange={(e) => upsertTutor(tutor.tempId, { lastNames: e.target.value })} />
                    <Input label="DNI" value={tutor.dni} onChange={(e) => upsertTutor(tutor.tempId, { dni: e.target.value })} />
                    <Input label="Celular" value={tutor.phone} onChange={(e) => upsertTutor(tutor.tempId, { phone: e.target.value })} />
                    <Input label="Email" value={tutor.email} onChange={(e) => upsertTutor(tutor.tempId, { email: e.target.value })} />
                    <Input label="Dirección" value={tutor.address} onChange={(e) => upsertTutor(tutor.tempId, { address: e.target.value })} />
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Relación</label>
                      <select className="w-full rounded border px-3 py-2 text-sm" value={tutor.relationship} onChange={(e) => upsertTutor(tutor.tempId, { relationship: e.target.value })}>
                        {RELATIONSHIP_OPTIONS.map((op) => <option key={op} value={op}>{op}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Género</label>
                      <select className="w-full rounded border px-3 py-2 text-sm" value={tutor.gender} onChange={(e) => upsertTutor(tutor.tempId, { gender: e.target.value })}>
                        <option value="F">F</option><option value="M">M</option>
                      </select>
                    </div>
                  </div>

                  <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={tutor.livesWithStudent} onChange={(e) => upsertTutor(tutor.tempId, { livesWithStudent: e.target.checked })} />
                    Vive con el alumno
                  </label>

                  {Object.values(errors).map((msg) => <p key={msg} className="mt-1 text-xs text-red-600">{msg}</p>)}
                </div>
              );
            })}
            <SecondaryButton onClick={() => setTutorsDraft((prev) => [...prev, { ...baseTutor, isPrimary: false, tempId: crypto.randomUUID() }])}>+ Agregar tutor</SecondaryButton>
          </div>
        </Card>

        <Card className="relative border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">2) Alumnos</h3>

          {preloadStudentId ? (
            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <p className="font-semibold">Alumno precargado</p>
              <p>ID: {preloadStudentId}</p>
              <p className="text-xs">Pendiente de vincular a esta familia.</p>
            </div>
          ) : null}

          <div className="mt-3 rounded-lg border border-gray-200 p-3">
            <p className="font-medium text-gray-900">Agregar alumno existente</p>
            <Input
              className="mt-2"
              value={studentSearchInput}
              onChange={(e) => setStudentSearchInput(e.target.value)}
              placeholder="Buscar por DNI, nombre o código"
            />
            <div className="mt-2 max-h-48 space-y-2 overflow-auto">
              {unassignedRows.map((row) => (
                <div key={row.studentId} className="flex items-center justify-between rounded border border-gray-200 p-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-600">{row.dni ? `DNI: ${row.dni}` : "DNI: —"}{row.internalCode ? ` · Código: ${row.internalCode}` : ""}</p>
                  </div>
                  <SecondaryButton onClick={() => addStudentToLink(row)}>Vincular</SecondaryButton>
                </div>
              ))}
              {!unassignedRows.length && debouncedStudentSearch.length >= 2 && !unassignedQuery.isFetching ? (
                <p className="text-sm text-gray-500">No se encontraron alumnos sin familia.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-gray-200 p-3">
            <p className="font-medium text-gray-900">Crear alumno nuevo</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <Input label="Nombres" value={newStudentDraft.names} onChange={(e) => setNewStudentDraft((p) => ({ ...p, names: e.target.value }))} />
              <Input label="Apellidos" value={newStudentDraft.lastNames} onChange={(e) => setNewStudentDraft((p) => ({ ...p, lastNames: e.target.value }))} />
              <Input label="DNI" value={newStudentDraft.dni} onChange={(e) => setNewStudentDraft((p) => ({ ...p, dni: e.target.value }))} />
              <Input label="Código interno" value={newStudentDraft.internalCode} onChange={(e) => setNewStudentDraft((p) => ({ ...p, internalCode: e.target.value }))} />
            </div>
            <div className="mt-2 flex gap-2">
              <SecondaryButton onClick={addStudentDraft}>Agregar alumno</SecondaryButton>
            </div>
          </div>
        </Card>

        <Card className="relative border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">3) Acciones finales</h3>
          <Input className="mt-2" label="Notas de familia" value={familyNotes} onChange={(e) => setFamilyNotes(e.target.value)} />
          {!studentsToLink.length && !studentsToCreate.length ? (
            <p className="mt-2 text-sm text-amber-700">Vas a crear una familia sin alumnos. Puedes vincularlos después.</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={handleCreateFamilyFlow} disabled={!canCreate}>{status === "submitting" ? "Creando..." : "Crear familia"}</Button>
            <SecondaryButton onClick={() => navigate(-1)} disabled={status === "submitting"}>Cancelar</SecondaryButton>
            {status === "error" ? <SecondaryButton onClick={handleCreateFamilyFlow}>Reintentar</SecondaryButton> : null}
          </div>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-4 lg:h-fit">
        <Card className="border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Resumen</h3>

          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-700">Tutores ({tutorsDraft.length})</p>
            <ul className="mt-1 space-y-1 text-sm text-gray-700">
              {tutorsDraft.map((t) => <li key={t.tempId}>• {[t.lastNames, t.names].filter(Boolean).join(", ") || "Sin nombre"} · {t.relationship}{t.isPrimary ? " · Principal" : ""}</li>)}
            </ul>
          </div>

          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-700">Alumnos a vincular ({studentsToLink.length})</p>
            <ul className="mt-1 space-y-1 text-sm text-gray-700">
              {studentsToLink.map((s) => <li key={String(s.studentId)}>• {s.label || s.studentId}</li>)}
            </ul>
          </div>

          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-700">Alumnos nuevos ({studentsToCreate.length})</p>
            <ul className="mt-1 space-y-1 text-sm text-gray-700">
              {studentsToCreate.map((s) => <li key={s.tempId}>• {s.label}</li>)}
            </ul>
          </div>

          {summaryWarnings.length ? (
            <div className="mt-3 space-y-1">
              {summaryWarnings.map((w) => <p key={w} className="text-xs text-amber-700">• {w}</p>)}
            </div>
          ) : null}
        </Card>
      </aside>

      <LoadingOverlay open={status === "submitting" || unassignedQuery.isFetching}>
        <Spinner />
        <p className="mt-3 text-sm font-medium text-gray-700">{status === "submitting" ? "Creando familia..." : "Buscando alumnos..."}</p>
      </LoadingOverlay>
    </div>
  );
}
