"use client";

import React, { useState } from "react";
import {
  Button,
  Breadcrumb,
  InputPassword,
  StatusCard,
  Icon,
} from "@ama-pt/agora-design-system";

const breadcrumbItems = [
  { label: "Início", url: "/" },
  { label: "Redefinir palavra-passe", url: "#" },
];

interface Props {
  token: string;
}

export function ResetPasswordClient({ token }: Props) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password && passwordConfirm && password === passwordConfirm;
  const canSubmit = passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, password_confirm: passwordConfirm }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Erro ao redefinir a palavra-passe. Tente novamente.");
      }
    } catch {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow bg-white min-h-screen relative">
      <div className="container mx-auto px-16 pt-32 pb-64 max-w-7xl">
        <div className="mb-32">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="grid xl:grid-cols-12 gap-32">
          <div className="xl:col-span-3" />
          <div className="xl:col-span-6 xl:col-start-4">
            {success ? (
              <div className="flex flex-col gap-32">
                <div className="flex items-center justify-center w-64 h-64 rounded-full bg-success-100">
                  <Icon name="agora-line-check-circle" className="w-32 h-32 text-success-600" />
                </div>
                <div>
                  <h1 className="text-2xl-bold text-brand-blue-dark mb-16">
                    Palavra-passe redefinida
                  </h1>
                  <p className="text-neutral-900">
                    A sua palavra-passe foi alterada com sucesso. Já pode iniciar sessão com a nova
                    palavra-passe.
                  </p>
                </div>
                <div>
                  <Button
                    variant="primary"
                    className="px-48 h-56 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                    onClick={() => (window.location.href = "/login")}
                  >
                    Iniciar sessão
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-32">
                <div>
                  <h1 className="text-2xl-bold text-brand-blue-dark mb-8">
                    Redefinir palavra-passe
                  </h1>
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
                  <div className="flex flex-col gap-8">
                    <InputPassword
                      label="Nova palavra-passe *"
                      placeholder="Introduza a nova palavra-passe"
                      id="password"
                      name="password"
                      className="w-full"
                      disabled={isLoading}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-sm text-neutral-600">
                      A palavra-passe tem de ter no mínimo 13 caracteres e incluir pelo menos um
                      símbolo (ex: !@#$%).
                    </p>
                  </div>

                  <InputPassword
                    label="Confirmar nova palavra-passe *"
                    placeholder="Repita a nova palavra-passe"
                    id="password-confirm"
                    name="password_confirm"
                    className="w-full"
                    disabled={isLoading}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />

                  {passwordConfirm && !passwordsMatch && (
                    <p className="text-sm text-danger-600">As palavras-passe não coincidem.</p>
                  )}

                  <div className="mt-8">
                    <Button
                      variant="primary"
                      type="submit"
                      className="px-48 h-56 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                      disabled={!canSubmit}
                    >
                      {isLoading ? "A guardar..." : "Redefinir palavra-passe"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
