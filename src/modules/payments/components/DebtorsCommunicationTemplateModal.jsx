import React, { useEffect, useState } from "react";
import BaseModal from "../../../shared/ui/BaseModal";
import Button from "../../../components/ui/Button";
import SecondaryButton from "../../../shared/ui/SecondaryButton";
import { DEFAULT_DEBTORS_COMMUNICATION_TEMPLATE } from "../utils/debtorsCommunicationTemplate";

const PLACEHOLDERS = [
  "{{alumno_nombre}}",
  "{{alumno_nombre_1}}",
  "{{alumno_nombre_2}}",
  "{{alumno_apellido_paterno}}",
  "{{alumno_apellido_materno}}",
  "{{alumno_codigo}}",
  "{{alumno_dni}}",
  "{{alumno_salon}}",
  "{{alumno_nivel}}",
  "{{alumno_grado}}",
  "{{alumno_seccion}}",
  "{{deuda_pendiente}}",
  "{{deuda_vencida}}",
  "{{deuda_total}}",
  "{{conceptos_deuda}}",
  "{{fecha_actual}}",
];

export default function DebtorsCommunicationTemplateModal({
  open,
  onClose,
  initialTemplate = DEFAULT_DEBTORS_COMMUNICATION_TEMPLATE,
  onSave,
}) {
  const [draft, setDraft] = useState(initialTemplate);

  useEffect(() => {
    if (open) {
      setDraft(initialTemplate || DEFAULT_DEBTORS_COMMUNICATION_TEMPLATE);
    }
  }, [open, initialTemplate]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Editar plantilla de comunicado"
      maxWidthClass="max-w-3xl"
      footer={(
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancelar</SecondaryButton>
          <Button onClick={() => onSave?.(draft)}>Guardar plantilla</Button>
        </div>
      )}
    >
      <div className="space-y-4 px-5 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Titulo</label>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={draft.title || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Asunto opcional</label>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              value={draft.subject || ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, subject: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Cuerpo</label>
          <textarea
            className="min-h-[260px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm leading-6"
            value={draft.body || ""}
            onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Placeholders permitidos</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLACEHOLDERS.map((item) => (
              <code key={item} className="rounded-lg bg-white px-2 py-1 text-xs text-gray-700">
                {item}
              </code>
            ))}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
