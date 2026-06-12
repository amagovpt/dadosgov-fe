"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, InputText, InputPassword, Icon, Breadcrumb } from "@ama-pt/agora-design-system";
import { fetchMigrationPending, searchMigrationAccount, sendMigrationCode, confirmMigration, skipMigration } from "@/service/api/migration";
import AppIcon from "../Primitives/AppIcon";

type Step =
  | "loading"
  | "search"
  | "confirm-account"
  | "choose-method"
  | "verify-code"
  | "verify-password"
  | "success";

export default function MigrateAccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noEmail = searchParams.get("no_email") === "true";

  const [step, setStep] = useState<Step>("loading");
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [legacyFirstName, setLegacyFirstName] = useState<string | null>(null);
  const [legacyLastName, setLegacyLastName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search form
  const [searchEmail, setSearchEmail] = useState("");
  const [searchFirstName, setSearchFirstName] = useState("");
  const [searchLastName, setSearchLastName] = useState("");
  const [searchByName, setSearchByName] = useState(false);

  // Code verification
  const [code, setCode] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  // Password verification
  const [password, setPassword] = useState("");

  const breadcrumbItems = [
    { label: "Home", url: "/" },
    { label: "Migrar conta", url: "#" },
  ];

  // Check pending migration on mount
  useEffect(() => {
    async function check() {
      try {
        const data = await fetchMigrationPending();
        if (!data.pending) {
          router.push("/pages/login");
          return;
        }
        if (data.email) setMaskedEmail(data.email);
        if (data.first_name) setLegacyFirstName(data.first_name);
        if (data.last_name) setLegacyLastName(data.last_name);

        if (data.has_email && !noEmail) {
          setStep("confirm-account");
        } else {
          setStep("search");
        }
      } catch {
        router.push("/pages/login");
      }
    }
    check();
  }, [router, noEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = searchByName
        ? { first_name: searchFirstName, last_name: searchLastName }
        : { email: searchEmail };
      const data = await searchMigrationAccount(payload);
      if (data.found) {
        setMaskedEmail(data.email || null);
        // Re-fetch pending to get updated name from the found account
        const pending = await fetchMigrationPending();
        if (pending.first_name) setLegacyFirstName(pending.first_name);
        if (pending.last_name) setLegacyLastName(pending.last_name);
        setStep("confirm-account");
      } else {
        setError("Nenhuma conta encontrada com esses dados.");
      }
    } catch {
      setError("Erro ao procurar conta.");
    } finally {
      setIsLoading(false);
    }
  }, [searchByName, searchFirstName, searchLastName, searchEmail]);

  const handleSendCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sendMigrationCode();
      setResendCountdown(60);
      setStep("verify-code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar o codigo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleResendCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sendMigrationCode();
      setResendCountdown(60);
      setCode("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao reenviar o codigo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConfirmCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await confirmMigration({ method: "code", code });
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Codigo invalido.");
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  const handleConfirmPassword = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await confirmMigration({ method: "password", password });
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Palavra-passe incorreta.");
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  const handleSkip = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await skipMigration();
      window.location.href = "/";
    } catch {
      setError("Erro ao criar conta.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Redirect after success
  useEffect(() => {
    if (step !== "success") return;
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);
    return () => clearTimeout(timer);
  }, [step]);

  if (step === "loading") {
    return (
      <main className="min-h-screen flex-grow bg-white">
        <div className="container mx-auto max-w-7xl px-16 pb-64 pt-32">
          <p className="text-lg text-neutral-700">A carregar...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex-grow bg-white">
      <div className="container mx-auto max-w-7xl px-16 pb-64 pt-32">
        <div>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="mt-64 max-w-[560px]">
          <h1 className="mb-16 text-2xl-medium text-brand-blue-dark">
            Migrar conta para Chave Movel Digital
          </h1>

          {step !== "success" && (
            <p className="text-lg mb-32 text-neutral-700">
              Detetamos que ja possui uma conta no portal. Para continuar a utilizar os seus dados,
              precisa de verificar a propriedade da conta.
            </p>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm border-red-200 mb-24 rounded-8 border p-16 font-medium">
              {error}
            </div>
          )}

          {/* Step: Search for legacy account (when no email from SAML) */}
          {step === "search" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-search" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">Encontre a sua conta</h2>
              <p className="text-neutral-900">
                Introduza o email ou o nome associado a sua conta anterior.
              </p>

              <div className="mb-8 flex gap-16">
                <Button
                  variant={!searchByName ? "primary" : "neutral"}
                  onClick={() => setSearchByName(false)}
                  className="text-sm"
                >
                  Por email
                </Button>
                <Button
                  variant={searchByName ? "primary" : "neutral"}
                  onClick={() => setSearchByName(true)}
                  className="text-sm"
                >
                  Por nome
                </Button>
              </div>

              {!searchByName ? (
                <InputText
                  label="Email da conta anterior"
                  placeholder="exemplo@email.com"
                  id="search-email"
                  name="search-email"
                  type="email"
                  className="w-full"
                  value={searchEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchEmail(e.target.value)
                  }
                  disabled={isLoading}
                />
              ) : (
                <>
                  <InputText
                    label="Nome"
                    placeholder="Introduza o nome"
                    id="search-first-name"
                    name="search-first-name"
                    className="w-full"
                    value={searchFirstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchFirstName(e.target.value)
                    }
                    disabled={isLoading}
                  />
                  <InputText
                    label="Apelido"
                    placeholder="Introduza o apelido"
                    id="search-last-name"
                    name="search-last-name"
                    className="w-full"
                    value={searchLastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchLastName(e.target.value)
                    }
                    disabled={isLoading}
                  />
                </>
              )}

              <div className="mt-16 flex gap-16">
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  disabled={
                    isLoading ||
                    (!searchByName && !searchEmail) ||
                    (searchByName && (!searchFirstName || !searchLastName))
                  }
                  className="px-48"
                >
                  {isLoading ? "A procurar..." : "Procurar conta"}
                </Button>
                <Button variant="neutral" onClick={handleSkip} disabled={isLoading}>
                  Criar conta nova
                </Button>
              </div>
            </div>
          )}

          {/* Step: Confirm legacy account details */}
          {step === "confirm-account" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-user" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">Esta conta é sua?</h2>
              <p className="text-neutral-900">
                Encontramos uma conta existente no portal com os seguintes dados. Confirme se esta
                conta lhe pertence.
              </p>

              <div className="flex flex-col gap-16 rounded-8 border border-neutral-300 bg-neutral-50 p-24">
                {(legacyFirstName || legacyLastName) && (
                  <div className="flex items-center gap-12">
                    <AppIcon name="agora-line-user" className="shrink-0 text-neutral-600" />
                    <div>
                      <p className="text-xs text-neutral-600">Nome</p>
                      <p className="text-base-bold text-neutral-900">
                        {legacyFirstName} {legacyLastName}
                      </p>
                    </div>
                  </div>
                )}
                {maskedEmail && (
                  <div className="flex items-center gap-12">
                    <AppIcon name="agora-line-mail" className="shrink-0 text-neutral-600" />
                    <div>
                      <p className="text-xs text-neutral-600">Email</p>
                      <p className="text-base-bold text-neutral-900">{maskedEmail}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-16">
                <Button
                  variant="primary"
                  onClick={() => {
                    setError(null);
                    setStep("choose-method");
                  }}
                  className="px-48"
                >
                  Sim, esta conta e minha
                </Button>
                <Button variant="neutral" onClick={handleSkip} disabled={isLoading}>
                  Nao, criar conta nova
                </Button>
              </div>
            </div>
          )}

          {/* Step: Choose verification method */}
          {step === "choose-method" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-shield" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">Verifique a sua identidade</h2>
              <p className="text-neutral-900">
                Para confirmar que esta conta lhe pertence, escolha um dos metodos abaixo.
              </p>

              <div className="flex flex-col gap-16">
                <button
                  onClick={handleSendCode}
                  disabled={isLoading}
                  className="flex items-center gap-16 rounded-8 border-2 border-neutral-300 p-24 text-left transition-colors hover:border-brand-blue-primary"
                >
                  <div className="shrink-0 rounded-8 bg-[#E9EBFF] p-12">
                    <Icon name="agora-line-mail" className="h-24 w-24 text-brand-blue-primary" />
                  </div>
                  <div>
                    <p className="text-lg-bold text-brand-blue-dark">
                      Enviar codigo para o meu email
                    </p>
                    <p className="text-sm text-neutral-700">
                      Enviaremos um código de 6 dígitos para {maskedEmail || "o seu email"}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setStep("verify-password")}
                  disabled={isLoading}
                  className="flex items-center gap-16 rounded-8 border-2 border-neutral-300 p-24 text-left transition-colors hover:border-brand-blue-primary"
                >
                  <div className="shrink-0 rounded-8 bg-[#E9EBFF] p-12">
                    <Icon name="agora-line-lock" className="h-24 w-24 text-brand-blue-primary" />
                  </div>
                  <div>
                    <p className="text-lg-bold text-brand-blue-dark">
                      Sei a minha palavra-passe antiga
                    </p>
                    <p className="text-sm text-neutral-700">
                      Introduza a palavra-passe da sua conta anterior
                    </p>
                  </div>
                </button>
              </div>

              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("confirm-account");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                Voltar
              </Button>
            </div>
          )}

          {/* Step: Verify by code */}
          {step === "verify-code" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-mail" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">Introduza o codigo</h2>
              <p className="text-neutral-900">
                Enviamos um codigo de 6 digitos para <strong>{maskedEmail}</strong>. Verifique a sua
                caixa de entrada.
              </p>

              <InputText
                label="Codigo de verificacao"
                placeholder="000000"
                id="migration-code"
                name="migration-code"
                className="w-full"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                disabled={isLoading}
              />

              <div className="flex items-center gap-16">
                <Button
                  variant="primary"
                  onClick={handleConfirmCode}
                  disabled={isLoading || code.length !== 6}
                  className="px-48"
                >
                  {isLoading ? "A verificar..." : "Verificar"}
                </Button>
                <Button
                  variant="neutral"
                  onClick={handleResendCode}
                  disabled={isLoading || resendCountdown > 0}
                >
                  {resendCountdown > 0 ? `Reenviar (${resendCountdown}s)` : "Reenviar codigo"}
                </Button>
              </div>

              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("choose-method");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                Voltar
              </Button>
            </div>
          )}

          {/* Step: Verify by password */}
          {step === "verify-password" && (
            <div className="flex flex-col gap-24">
              <div className="w-fit rounded-8 bg-[#E9EBFF] p-16">
                <Icon name="agora-line-lock" className="h-24 w-24 text-brand-blue-primary" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">
                Introduza a sua palavra-passe antiga
              </h2>
              <p className="text-neutral-900">
                Introduza a palavra-passe que usava para entrar na sua conta anterior.
              </p>

              <InputPassword
                label="Palavra-passe"
                placeholder="Introduza a palavra-passe"
                id="migration-password"
                name="migration-password"
                className="w-full"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={isLoading}
              />

              <div className="flex gap-16">
                <Button
                  variant="primary"
                  onClick={handleConfirmPassword}
                  disabled={isLoading || !password}
                  className="px-48"
                >
                  {isLoading ? "A verificar..." : "Verificar"}
                </Button>
              </div>

              <Button
                variant="primary"
                appearance="link"
                onClick={() => {
                  setStep("choose-method");
                  setError(null);
                }}
                className="text-sm h-auto p-0"
              >
                Voltar
              </Button>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center gap-24 text-center">
              <div className="bg-green-100 w-fit rounded-full p-24">
                <Icon name="agora-line-check-circle" className="text-green-600 h-48 w-48" />
              </div>
              <h2 className="text-xl-bold text-brand-blue-dark">Conta migrada com sucesso!</h2>
              <p className="text-neutral-900">
                A sua conta foi migrada para a Chave Movel Digital com sucesso. Sera redirecionado
                em breve...
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
