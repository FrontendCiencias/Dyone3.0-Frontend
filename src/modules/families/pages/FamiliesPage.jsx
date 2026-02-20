import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { ROUTES } from "../../../config/routes";
import { normalizeSearchText } from "../../students/domain/searchText";
import FamilyCard from "../components/FamilyCard";
import FamilyCreateModal from "../components/FamilyCreateModal";
import { useFamiliesListQuery } from "../hooks/useFamiliesListQuery";
import { useFamiliesSearchInfiniteQuery } from "../hooks/useFamiliesSearchInfiniteQuery";

function getFamilyId(payload) {
  return payload?.id || payload?.family?.id || payload?.familyId || payload?._id;
}

function getErrorMessage(error) {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string") return msg;
  return "No se pudo cargar las familias";
}

function matchesFamilyQuery(family, query) {
  if (!query) return true;

  const tutor = family?.primaryTutor || family?.primaryTutor_send || {};
  const fields = [
    family?.id,
    family?._id,
    tutor?.names,
    tutor?.lastNames,
    tutor?.dni,
    tutor?.phone,
    family?.dni,
    family?.phone,
  ]
    .filter(Boolean)
    .map((value) => normalizeSearchText(value));

  return fields.some((field) => field.includes(query));
}

function FamilyCardSkeleton() {
  return <div className="h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />;
}

export default function FamiliesPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const normalizedSearch = debouncedSearch.trim();
  const useSearchResults = normalizedSearch.length >= 2;

  const familiesListQuery = useFamiliesListQuery({ enabled: !useSearchResults });
  const familiesSearchQuery = useFamiliesSearchInfiniteQuery({ q: normalizedSearch, enabled: useSearchResults });
  const familiesQuery = useSearchResults ? familiesSearchQuery : familiesListQuery;

  const normalizedQuery = normalizeSearchText(debouncedSearch);
  const families = useMemo(() => {
    const pages = Array.isArray(familiesQuery.data?.pages) ? familiesQuery.data.pages : [];
    const rows = pages.flatMap((page) => (Array.isArray(page?.items) ? page.items : []));
    return rows.filter((family) => matchesFamilyQuery(family, normalizedQuery));
  }, [familiesQuery.data, normalizedQuery]);

  const handleCreated = (familyPayload) => {
    const familyId = getFamilyId(familyPayload);
    setCreateOpen(false);
    if (familyId) navigate(ROUTES.dashboardFamilyDetail(familyId));
  };

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
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
            <Button className="w-full" onClick={() => setCreateOpen(true)}>+ Nueva familia</Button>
          </div>
        </div>
      </Card>

      {familiesQuery.isError && (
        <Card className="border border-red-100 text-sm text-red-700">{getErrorMessage(familiesQuery.error)}</Card>
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
            <div className="pt-1">
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

      <FamilyCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
    </div>
  );
}
