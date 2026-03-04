import React, { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import SearchSelect from "../../../shared/ui/SearchSelect";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import BaseModal from "../../../shared/ui/BaseModal";
import LoadingOverlay from "../../../shared/ui/LoadingOverlay";
import Spinner from "../../../shared/ui/Spinner";
import ModalFeedbackOverlay from "../../../shared/ui/ModalFeedbackOverlay";
import { getToken } from "../../../lib/authStorage";
import { ROUTES } from "../../../config/routes";
import FamilyCard from "../components/FamilyCard";
import { useFamiliesListQuery } from "../hooks/useFamiliesListQuery";
import { useFamiliesSearchInfiniteQuery } from "../hooks/useFamiliesSearchInfiniteQuery";
import { useFamiliesSearchQuery } from "../hooks/useFamiliesSearchQuery";
import { linkStudentToFamily, listOrphanStudents, searchOrphanStudents } from "../services/families.service";

function getErrorMessage(error, fallback = "No se pudo completar la acción") {
  const msg = error?.response?.data?.message || error?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return fallback;
}

function FamilyCardSkeleton() {
  return <div className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />;
}

function toTitleCase(value = "") {
  return String(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatStudentLabel(student) {
  const person = student?.personId || {};
  const lastNames = String(person?.lastNames || "").toUpperCase();
  const names = toTitleCase(person?.names || "");
  return [lastNames, names].filter(Boolean).join(", ") || "Sin nombre";
}

function getStudentMeta(student) {
  const person = student?.personId || {};
  const parts = [];
  if (student?.internalCode) parts.push(student.internalCode);
  if (person?.dni) parts.push(`DNI: ${person.dni}`);
  return parts.join(" · ") || "Sin código interno";
}

export default function FamiliesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orphanSearchInput, setOrphanSearchInput] = useState("");
  const [orphanSearchDebounced, setOrphanSearchDebounced] = useState("");

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedOrphanStudent, setSelectedOrphanStudent] = useState(null);
  const [familySearchInput, setFamilySearchInput] = useState("");
  const [familySearchDebounced, setFamilySearchDebounced] = useState("");
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [linkStatus, setLinkStatus] = useState("idle");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setOrphanSearchDebounced(orphanSearchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [orphanSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setFamilySearchDebounced(familySearchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [familySearchInput]);

  const normalizedSearch = debouncedSearch.trim();
  const useSearchResults = normalizedSearch.length >= 2;

  const familiesListQuery = useFamiliesListQuery({ enabled: !useSearchResults });
  const familiesSearchQuery = useFamiliesSearchInfiniteQuery({ q: normalizedSearch, enabled: useSearchResults });
  const familiesQuery = useSearchResults ? familiesSearchQuery : familiesListQuery;

  const families = useMemo(() => {
    const pages = Array.isArray(familiesQuery.data?.pages) ? familiesQuery.data.pages : [];
    return pages.flatMap((page) => (Array.isArray(page?.items) ? page.items : []));
  }, [familiesQuery.data]);

  const orphanSearchTerm = orphanSearchDebounced.trim();
  const isOrphanSearchMode = orphanSearchTerm.length >= 2;

  const orphanStudentsQuery = useInfiniteQuery({
    queryKey: ["students", "orphans", 20, orphanSearchTerm],
    queryFn: ({ pageParam = null }) => (
      isOrphanSearchMode
        ? searchOrphanStudents({ q: orphanSearchTerm, limit: 20, cursor: pageParam })
        : listOrphanStudents({ limit: 20, cursor: pageParam })
    ),
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    enabled: Boolean(getToken()),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const orphanStudents = useMemo(() => {
    const pages = Array.isArray(orphanStudentsQuery.data?.pages) ? orphanStudentsQuery.data.pages : [];
    return pages.flatMap((page) => (Array.isArray(page?.items) ? page.items : []));
  }, [orphanStudentsQuery.data]);

  const linkStudentMutation = useMutation({
    mutationFn: ({ familyId, studentId }) => linkStudentToFamily({ familyId, studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["families", "search"] });
      queryClient.invalidateQueries({ queryKey: ["families", "list"] });
      queryClient.invalidateQueries({ queryKey: ["students", "orphans"] });
      setLinkStatus("success");
    },
    onError: (error) => {
      setLinkError(getErrorMessage(error, "No se pudo vincular el alumno a la familia"));
      setLinkStatus("error");
    },
  });

  const familiesForLinkQuery = useFamiliesSearchQuery({
    q: familySearchDebounced,
    enabled: linkModalOpen && familySearchDebounced.length >= 2,
    limit: 10,
  });

  const familySearchRows = useMemo(() => {
    const rows = Array.isArray(familiesForLinkQuery.data?.items)
      ? familiesForLinkQuery.data.items
      : Array.isArray(familiesForLinkQuery.data)
        ? familiesForLinkQuery.data
        : [];

    return rows.map((family) => ({
      id: family?.id || family?._id || family?.familyId,
      label: family?.id || family?._id || family?.familyId,
      tutor: family?.primaryTutor?.lastNames || family?.primaryTutor_send?.lastNames || "-",
    })).filter((family) => Boolean(family.id));
  }, [familiesForLinkQuery.data]);

  const openLinkModal = (student) => {
    setSelectedOrphanStudent(student);
    setLinkModalOpen(true);
    setFamilySearchInput("");
    setFamilySearchDebounced("");
    setSelectedFamilyId("");
    setLinkStatus("idle");
    setLinkError("");
  };

  const handleLinkSubmit = async () => {
    const studentId = selectedOrphanStudent?._id || selectedOrphanStudent?.id;
    if (!studentId || !selectedFamilyId) return;

    setLinkStatus("submitting");
    setLinkError("");
    await linkStudentMutation.mutateAsync({ familyId: selectedFamilyId, studentId });
  };

  const handleLinkFeedbackClose = () => {
    if (linkStatus === "success") {
      setLinkModalOpen(false);
      setSelectedOrphanStudent(null);
      setLinkStatus("idle");
      setLinkError("");
      return;
    }

    setLinkStatus("idle");
    setLinkError("");
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[35%_65%]">
      
      <section className="order-1 flex h-full min-h-0 flex-col overflow-hidden">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border border-gray-200 shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-900">Alumnos sin familia</h3>
            <div className="mt-2">
              <Input
                value={orphanSearchInput}
                onChange={(event) => setOrphanSearchInput(event.target.value)}
                placeholder="Buscar por DNI, código o nombre del alumno"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {orphanStudentsQuery.isError ? (
              <Card className="border border-red-100 text-sm text-red-700">
                {getErrorMessage(orphanStudentsQuery.error, "No se pudo cargar alumnos sin familia")}
              </Card>
            ) : null}

            {orphanStudentsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {orphanStudents.map((student) => {
                  const studentId = student?._id || student?.id;
                  return (
                    <div key={studentId} className="rounded-lg border border-gray-200 p-3">
                      <p className="text-sm font-semibold text-gray-900">{formatStudentLabel(student)}</p>
                      <p className="mt-1 text-xs text-gray-600">{getStudentMeta(student)}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`${ROUTES.dashboardFamilyNew}?preloadStudentId=${studentId}`)}
                          disabled={!studentId}
                        >
                          Crear familia
                        </Button>
                        <SecondaryButton
                          size="sm"
                          onClick={() => openLinkModal(student)}
                          disabled={linkStudentMutation.isPending}
                        >
                          Agregar a familia existente
                        </SecondaryButton>
                      </div>
                    </div>
                  );
                })}

                {!orphanStudents.length ? (
                  <p className="text-sm text-gray-500">{isOrphanSearchMode ? "Sin resultados para esta búsqueda." : "No hay alumnos pendientes por vincular."}</p>
                ) : null}

                {orphanStudentsQuery.hasNextPage ? (
                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => orphanStudentsQuery.fetchNextPage()}
                      disabled={orphanStudentsQuery.isFetchingNextPage}
                    >
                      {orphanStudentsQuery.isFetchingNextPage ? "Cargando..." : "Cargar más"}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>
      </section>

      <section className="order-2 flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <Card className="max-h-[15vh] overflow-y-auto border border-gray-200 shadow-sm">
          <div className="grid gap-3 md:grid-cols-12 md:items-end">
            <div className="md:col-span-9">
              <Input
                label="Buscar familias"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="DNI, nombres, apellidos o teléfono"
              />
            </div>
            <div className="md:col-span-3">
              <Button className="w-full" onClick={() => navigate(ROUTES.dashboardFamilyNew)}>+ Nueva familia</Button>
            </div>
          </div>
        </Card>

        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border border-gray-200 shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {familiesQuery.isError && (
              <Card className="border border-red-100 text-sm text-red-700">{getErrorMessage(familiesQuery.error, "No se pudo cargar las familias")}</Card>
            )}

            {familiesQuery.isLoading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => <FamilyCardSkeleton key={index} />)}
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {families.map((family) => (
                    <FamilyCard key={family.familyId || family._id} family={family} onOpen={() => navigate(ROUTES.dashboardFamilyDetail(family.familyId || family._id))} />
                  ))}
                </div>

                {!families.length ? (
                  <Card className="border border-gray-200 text-sm text-gray-500">
                    {useSearchResults
                      ? "No se encontraron familias para esa búsqueda."
                      : "No se encontraron familias registradas. Crea una nueva familia para comenzar."}
                  </Card>
                ) : null}

                {familiesQuery.hasNextPage ? (
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="secondary"
                      onClick={() => familiesQuery.fetchNextPage()}
                      disabled={familiesQuery.isFetchingNextPage}
                    >
                      {familiesQuery.isFetchingNextPage ? "Cargando..." : "Cargar más"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </Card>
      </section>


      <BaseModal
        open={linkModalOpen}
        onClose={linkStatus === "submitting" ? undefined : () => setLinkModalOpen(false)}
        title="Selecciona familia"
        maxWidthClass="max-w-2xl"
        closeOnBackdrop={linkStatus !== "submitting"}
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setLinkModalOpen(false)} disabled={linkStatus === "submitting"}>Cancelar</SecondaryButton>
            <Button onClick={handleLinkSubmit} disabled={!selectedFamilyId || linkStatus !== "idle"}>Vincular</Button>
          </div>
        )}
      >
        <div className="relative space-y-3 p-5">
          <SearchSelect
            label="Buscar familia"
            value={familySearchInput}
            onChange={(e) => setFamilySearchInput(e.target.value)}
            placeholder="DNI, nombres o teléfono"
            options={familySearchRows}
            onSelect={(family) => setSelectedFamilyId(family.id)}
            isLoading={familiesForLinkQuery.isFetching}
            emptyText="Sin resultados."
            renderOption={(family) => (
              <div className={`rounded-md border p-2 ${selectedFamilyId === family.id ? "border-blue-500 bg-blue-50" : "border-transparent"}`}>
                <p className="font-medium text-gray-900">Family ID: {family.label}</p>
                <p className="text-xs text-gray-600">Tutor principal: {family.tutor || "-"}</p>
              </div>
            )}
            getOptionKey={(family) => family.id}
          />

          <LoadingOverlay open={linkStatus === "submitting"}>
            <Spinner />
            <p className="mt-3 text-sm font-medium text-gray-700">Vinculando alumno...</p>
          </LoadingOverlay>

          <ModalFeedbackOverlay
            status={linkStatus}
            successText="Alumno vinculado correctamente"
            errorText="No se pudo vincular el alumno"
            errorDetail={linkError}
            onClose={handleLinkFeedbackClose}
          />
        </div>
      </BaseModal>
    </div>
  );
}
