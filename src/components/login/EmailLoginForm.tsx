"use client";

import React, { useState } from "react";
import {
  Button,
  Checkbox,
  InputPassword,
  InputText,
  StatusCard,
} from "@ama-pt/agora-design-system";
import { PRIMARY_BUTTON_CLASS, TEXT_LINK_BUTTON_CLASS } from "./constants";
import { TermsSection } from "./LoginShared";

export function EmailLoginForm({
  prefilledEmail,
  isLoading,
  error,
  onSubmit,
  onForgotPassword,
}: {
  prefilledEmail: string;
  isLoading: boolean;
  error: string | null;
  onSubmit: (email: string, password: string) => void;
  onForgotPassword: () => void;
}) {
  const [loginEmail, setLoginEmail] = useState(prefilledEmail);
  const [loginPassword, setLoginPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(loginEmail, loginPassword);
  };

  return (
    <>
      <div>
        <p className="text-neutral-900">
          Os campos marcados com um asterisco ( * ) são obrigatórios.
        </p>
      </div>

      {error && <StatusCard variant="danger" showIcon description={error} />}

      <form
        className="flex flex-col gap-24"
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.requestSubmit();
          }
        }}
      >
        <InputText
          label="Endereço de e-mail *"
          placeholder="Introduza aqui o texto"
          id="login-email"
          name="email"
          type="email"
          className="w-full max-w-[560px]"
          disabled={isLoading}
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
        />

        <div className="flex max-w-[560px] flex-col gap-8">
          <InputPassword
            label="Palavra-passe *"
            placeholder="Introduza aqui a palavra-passe"
            id="login-password"
            name="password"
            className="w-full"
            disabled={isLoading}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center text-neutral-900">
          <Checkbox label="Lembrar palavra-passe" id="remember-me" name="remember-me" />
        </div>

        <div className="mt-24 flex items-center gap-8">
          <span className="text-sm text-neutral-900">Esqueceu-se da palavra-passe?</span>
          <button type="button" className={TEXT_LINK_BUTTON_CLASS} onClick={onForgotPassword}>
            Recuperar palavra-passe
          </button>
        </div>

        <TermsSection
          id="terms-email"
          checked={termsAccepted}
          onChange={setTermsAccepted}
        />

        <div className="mt-8">
          <Button
            variant="primary"
            type="submit"
            className={PRIMARY_BUTTON_CLASS}
            disabled={isLoading || !loginEmail || !loginPassword || !termsAccepted}
          >
            {isLoading ? "A autenticar..." : "Autenticar"}
          </Button>
        </div>
      </form>
    </>
  );
}
