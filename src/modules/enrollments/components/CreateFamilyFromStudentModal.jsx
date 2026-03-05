import React from "react";
import CreateTutorModal from "../../families/components/CreateTutorModal";

export default function CreateFamilyFromStudentModal({ open, onClose, student, onSubmit, isSubmitting = false }) {
  return (
    <CreateTutorModal
      open={open}
      onClose={onClose}
      endpointReady={!isSubmitting}
      forcePrimary
      disablePrimary
      onCreate={async (payload) => {
        await onSubmit?.({
          tutorNames: payload?.names,
          tutorLastNames: payload?.lastNames,
          tutorDni: payload?.dni,
          tutorPhone: payload?.phone,
          isPrimary: true,
        });
      }}
      initialValues={{
        isPrimary: true,
      }}
    />
  );
}
