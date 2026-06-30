"use client";

import React, { useState } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Button, InputText, StatusCard } from "@ama-pt/agora-design-system";
import { PRIMARY_BUTTON_CLASS, TEXT_LINK_BUTTON_CLASS } from "./constants";

export function PasswordRecoveryView({ onBack }: { onBack: () => void }) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let recaptchaToken: string | null = null;
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("password_reset");
      } catch (err) {
        console.warn("reCAPTCHA execution failed:", err);
      }
    }

    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recaptcha_token: recaptchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Erro ao enviar pedido. Tente novamente.");
      }
    } catch {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setEmail("");
    setError(null);
    setSuccess(false);
    onBack();
  };

  if (success) {
    return (
      <>
        <StatusCard
          variant="success"
          showIcon
          description="Se o endereço de e-mail estiver associado a uma conta, receberá um e-mail com instruções para redefinir a sua palavra-passe."
        />
        <div className="mt-16">
          <button type="button" className={TEXT_LINK_BUTTON_CLASS} onClick={handleBack}>
            Voltar ao início de sessão
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <h2 className="mb-8 text-xl-bold text-brand-blue-dark">Recuperar palavra-passe</h2>
        <p className="text-neutral-900">
          Introduza o seu endereço de e-mail e enviaremos instruções para redefinir a sua
          palavra-passe.
        </p>
      </div>

      {error && <StatusCard variant="danger" showIcon description={error} />}

      <form className="flex flex-col gap-24" onSubmit={handleSubmit}>
        <InputText
          label="Endereço de e-mail *"
          placeholder="Introduza aqui o texto"
          id="recovery-email"
          name="email"
          type="email"
          className="w-full max-w-[560px]"
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="mt-8 flex items-center gap-16">
          <Button
            variant="primary"
            type="submit"
            className={PRIMARY_BUTTON_CLASS}
            disabled={loading || !email}
          >
            {loading ? "A enviar..." : "Redefinir palavra-passe"}
          </Button>
          <button type="button" className={TEXT_LINK_BUTTON_CLASS} onClick={handleBack}>
            Voltar ao início de sessão
          </button>
        </div>
      </form>
    </>
  );
}
