import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import LoginCard from "../components/LoginCard";
import { useLoginMutation } from "../hooks/useLoginMutation";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useLoginMutation({
    onSuccessNavigate: () => {
      navigate("/dashboard", { replace: true });
    },
  });

  const errorMessage = useMemo(() => {
    const apiMsg = mutation.error?.response?.data?.message;
    if (Array.isArray(apiMsg)) return apiMsg.join(", ");
    return apiMsg || (mutation.isError ? "Error al iniciar sesión" : "");
  }, [mutation.error, mutation.isError]);

  const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ email: form.email.trim(), password: form.password });
  };

  return (
    <AuthShell>
      <LoginCard
        values={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isLoading={mutation.isPending}
        errorMessage={errorMessage}
      />
    </AuthShell>
  );
}
