import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { useUpdateFamilyMutation } from "../hooks/useUpdateFamilyMutation";

function getErrorMessage(error) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(". ");
  if (typeof message === "string" && message.trim()) return message;
  return "No se pudo actualizar la dirección.";
}

export default function FamilyAddressEditor({
  familyId,
  address,
  autoEditIfEmpty = false,
  onSaved,
}) {
  const mutation = useUpdateFamilyMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftAddress, setDraftAddress] = useState(address || "");
  const [successVisible, setSuccessVisible] = useState(false);

  const normalizedAddress = useMemo(() => String(address || "").trim(), [address]);

  useEffect(() => {
    setDraftAddress(address || "");
  }, [address, familyId]);

  useEffect(() => {
    if (autoEditIfEmpty && familyId && !normalizedAddress) {
      setIsEditing(true);
    }
  }, [autoEditIfEmpty, familyId, normalizedAddress]);

  useEffect(() => {
    if (!successVisible) return undefined;
    const timer = window.setTimeout(() => setSuccessVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, [successVisible]);

  const handleCancel = () => {
    setIsEditing(false);
    setDraftAddress(address || "");
  };

  const handleSave = async () => {
    if (!familyId) return;

    await mutation.mutateAsync({
      familyId,
      address: String(draftAddress || "").trim(),
    });

    setSuccessVisible(true);
    setIsEditing(false);
    onSaved?.();
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">Dirección</p>

      {!isEditing ? (
        <>
          <p className={`text-sm ${normalizedAddress ? "text-gray-700" : "text-gray-500"}`}>
            {normalizedAddress || "Sin dirección registrada"}
          </p>
          <button
            type="button"
            className="text-xs font-semibold text-blue-700 underline underline-offset-2"
            onClick={() => setIsEditing(true)}
          >
            Editar dirección
          </button>
          {successVisible ? <p className="text-xs text-emerald-700">Guardado.</p> : null}
        </>
      ) : (
        <div className="space-y-2">
          <Input
            label=""
            value={draftAddress}
            onChange={(e) => setDraftAddress(e.target.value)}
            placeholder="Ingresa la dirección de la familia"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={mutation.isPending || !familyId}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
            <SecondaryButton onClick={handleCancel} disabled={mutation.isPending}>Cancelar</SecondaryButton>
          </div>
          {mutation.isError ? <p className="text-xs text-red-700">{getErrorMessage(mutation.error)}</p> : null}
        </div>
      )}
    </div>
  );
}
