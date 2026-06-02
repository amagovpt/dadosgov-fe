"use client";

import React, { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import NextImage from "next/image";
import ReCAPTCHA from "react-google-recaptcha";
import {
  Button,
  RadioButton,
  Checkbox,
  Icon,
  Breadcrumb,
  Tabs,
  Tab,
  TabHeader,
  TabBody,
  InputText,
  InputPassword,
  StatusCard,
} from "@ama-pt/agora-design-system";
import { fetchCsrfToken, login } from "@/services/api";
import TextLink from "@/components/Primitives/TextLink";

function LoginContent() {
  const searchParams = useSearchParams();
  const nextUrl = (() => {
    const raw = searchParams.get("next") || "/";
    return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  })();
  const prefilledEmail = searchParams.get("email") || "";

  const [cmdModalOpen, setCmdModalOpen] = useState(false);
  const [eidasModalOpen, setEidasModalOpen] = useState(false);
  const [isHoveredClose, setIsHoveredClose] = useState(false);
  const [isHoveredNacional, setIsHoveredNacional] = useState(false);
  const [isHoveredEstrangeiro, setIsHoveredEstrangeiro] = useState(false);
  const [isHoveredEidasCreate, setIsHoveredEidasCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState(prefilledEmail);
  const [loginPassword, setLoginPassword] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [citizenType, setCitizenType] = useState<string | null>(null);
  const [termsCmdAccepted, setTermsCmdAccepted] = useState(false);
  const [termsEidasAccepted, setTermsEidasAccepted] = useState(false);
  const [termsEmailAccepted, setTermsEmailAccepted] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError(null);

    const recaptchaToken = recaptchaRef.current?.getValue() || null;

    try {
      const res = await fetch("/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail, recaptcha_token: recaptchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecoverySuccess(true);
      } else {
        setRecoveryError(data.message || "Erro ao enviar pedido. Tente novamente.");
        recaptchaRef.current?.reset();
      }
    } catch {
      setRecoveryError("Erro de ligação. Tente novamente.");
      recaptchaRef.current?.reset();
    } finally {
      setRecoveryLoading(false);
    }
  };

  const samlEnabled = process.env.NEXT_PUBLIC_SAML_ENABLED === "true";

  const submitSamlForm = async (endpoint: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const text = await res.text();
        console.error("SAML login failed:", res.status, text);
        setError(`Erro ao iniciar autenticação (${res.status}). Tente novamente.`);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("SAML login: unexpected response type:", contentType, text.substring(0, 500));
        setError("Erro ao iniciar autenticação. O servidor não respondeu corretamente.");
        return;
      }

      const data = await res.json();
      if (!data.action || !data.SAMLRequest) {
        console.error("SAML login: missing fields in response:", data);
        setError("Erro ao iniciar autenticação. Resposta incompleta do servidor.");
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;

      const samlInput = document.createElement("input");
      samlInput.type = "hidden";
      samlInput.name = "SAMLRequest";
      samlInput.value = data.SAMLRequest;
      form.appendChild(samlInput);

      const relayInput = document.createElement("input");
      relayInput.type = "hidden";
      relayInput.name = "RelayState";
      relayInput.value = data.RelayState;
      form.appendChild(relayInput);

      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      console.error("SAML login error:", e);
      setError("Não foi possível contactar o servidor de autenticação. Verifique a sua ligação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSamlLogin = () => {
    const endpoint =
      nextUrl !== "/" ? `/saml/login?next=${encodeURIComponent(nextUrl)}` : "/saml/login";
    submitSamlForm(endpoint);
  };

  const handleEidasLogin = () => {
    const endpoint =
      nextUrl !== "/"
        ? `/saml/eidas/login?next=${encodeURIComponent(nextUrl)}`
        : "/saml/eidas/login";
    submitSamlForm(endpoint);
  };

  const breadcrumbItems = [
    { label: "Home", url: "/" },
    { label: "Autenticação", url: "#" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Get CSRF Token
      const csrfToken = await fetchCsrfToken();

      // 2. Prepare payload for backend
      const payload = new FormData();
      payload.append("email", email);
      payload.append("password", password);
      payload.append("csrf_token", csrfToken);
      payload.append("remember", "y");

      // 3. Login
      const response = await login(payload);

      // 4. Redirect on success (full reload to update auth state)
      window.location.href = nextUrl;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ocorreu um erro ao tentar iniciar sessão.";
      if (message === "migration_required") {
        setMigrationRequired(true);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex-grow bg-white">
      <div className="login-page container mx-auto max-w-7xl px-16 pb-64 pt-32">
        {/* Breadcrumb */}
        {!cmdModalOpen && !eidasModalOpen && (
          <div>
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}

        {/* Main Content */}
        {eidasModalOpen ? (
          <div className="mt-24 flex flex-col gap-24">
            <div className="flex justify-end">
              <button
                onClick={() => setEidasModalOpen(false)}
                onMouseEnter={() => setIsHoveredClose(true)}
                onMouseLeave={() => setIsHoveredClose(false)}
                className="text-sm flex items-center gap-8 text-neutral-900 hover:text-neutral-700"
              >
                Fechar
                <Icon
                  name={isHoveredClose ? "agora-solid-x" : "agora-line-x"}
                  className="h-20 w-20"
                />
              </button>
            </div>
            <h2 className="text-xl-bold text-brand-blue-dark">
              O que precisa para criar uma conta?
            </h2>
            <ul className="flex flex-col gap-16">
              <li className="flex items-start gap-16">
                <Icon
                  name="agora-line-check"
                  className="mt-2 h-20 w-20 shrink-0 text-primary-600"
                />
                <span>
                  Ter um mecanismo de identificação eletrónica emitida por outro Estado-Membro da
                  União Europeia que já tenha infraestruturas de autenticação (eIDAS) disponível.
                </span>
              </li>
            </ul>
            <div className="mt-32 flex flex-col items-start gap-24">
              <a
                href="https://www.autenticacao.gov.pt/eidas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-8 text-primary-600"
                onMouseEnter={() => setIsHoveredEidasCreate(true)}
                onMouseLeave={() => setIsHoveredEidasCreate(false)}
              >
                Criar conta com Autenticação Europeia
                <Icon
                  name={
                    isHoveredEidasCreate
                      ? "agora-solid-arrow-right-circle"
                      : "agora-line-arrow-right-circle"
                  }
                  className="h-20 w-20"
                />
              </a>
            </div>
          </div>
        ) : cmdModalOpen ? (
          <div className="mt-24 flex flex-col gap-24">
            <div className="flex justify-end">
              <button
                onClick={() => setCmdModalOpen(false)}
                onMouseEnter={() => setIsHoveredClose(true)}
                onMouseLeave={() => setIsHoveredClose(false)}
                className="text-sm flex items-center gap-8 text-neutral-900 hover:text-neutral-700"
              >
                Fechar
                <Icon
                  name={isHoveredClose ? "agora-solid-x" : "agora-line-x"}
                  className="h-20 w-20"
                />
              </button>
            </div>
            <h2 className="text-xl-bold text-brand-blue-dark">
              O que precisa para criar uma conta?
            </h2>
            <ul className="flex flex-col gap-16">
              <li className="flex items-start gap-16">
                <Icon
                  name="agora-line-check"
                  className="mt-2 h-20 w-20 shrink-0 text-primary-600"
                />
                <span>
                  Para cidadãs/ãos nacionais e estrangeiras/os com Chave Móvel Digital (CMD) ativa.
                </span>
              </li>
              <li className="flex items-start gap-16">
                <Icon
                  name="agora-line-check"
                  className="mt-2 h-20 w-20 shrink-0 text-primary-600"
                />
                <span>
                  Precisa do código PIN da sua CMD e do telemóvel que lhe está associado. Se ainda
                  não o fez, pode
                  <br />
                  <a
                    href="https://www.autenticacao.gov.pt/cmd-pedido-chave"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline"
                  >
                    ativar a Chave Móvel Digital em Autenticação.gov.
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-16">
                <Icon
                  name="agora-line-check"
                  className="mt-2 h-20 w-20 shrink-0 text-primary-600"
                />
                <span>
                  O registo com CMD permite a realização de todos os serviços online
                  disponibilizados neste portal.
                </span>
              </li>
            </ul>
            <div className="mt-32 flex flex-col items-start gap-24">
              <a
                href="https://www.autenticacao.gov.pt/cmd-pedido-chave?partnerEntityID=https://dados.gov.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-8 text-primary-600"
                onMouseEnter={() => setIsHoveredNacional(true)}
                onMouseLeave={() => setIsHoveredNacional(false)}
              >
                Criar conta como cidadão nacional
                <Icon
                  name={
                    isHoveredNacional
                      ? "agora-solid-arrow-right-circle"
                      : "agora-line-arrow-right-circle"
                  }
                  className="h-20 w-20"
                />
              </a>
              <a
                href="https://www.autenticacao.gov.pt/cmd-pedido-chave-estrangeiro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-8 text-primary-600"
                onMouseEnter={() => setIsHoveredEstrangeiro(true)}
                onMouseLeave={() => setIsHoveredEstrangeiro(false)}
              >
                Criar conta como cidadão estrangeiro
                <Icon
                  name={
                    isHoveredEstrangeiro
                      ? "agora-solid-arrow-right-circle"
                      : "agora-line-arrow-right-circle"
                  }
                  className="h-20 w-20"
                />
              </a>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h1 className="mb-16 mt-64 text-2xl-medium text-brand-blue-dark">Autenticação</h1>
              <p className="text-lg mb-32 max-w-2xl text-neutral-700">
                Escolha um meio de autenticação para se autenticar no portal e ter acesso aos vários{" "}
                <br />
                serviços e funcionalidades online.
              </p>
            </div>
            <Tabs vertically className="mt-24">
              <Tab>
                <TabHeader>Chave Móvel Digital (CMD)</TabHeader>
                <TabBody>
                  <div className="rounded-8">
                    <div className="flex flex-col gap-40">
                      <div className="flex items-center justify-between gap-32">
                        <div className="flex flex-col gap-8">
                          <h2 className="text-base font-bold text-brand-blue-dark">
                            Antes de começar...
                          </h2>
                          <p className="text-[#2B363C]">
                            Precisa do código PIN da sua Chave Móvel Digital - CMD e do telemóvel
                            que lhe está associado.
                          </p>
                        </div>
                        <div className="shrink-0">
                          <NextImage
                            src="/Logos/autenticacao_gov.svg"
                            alt="Autenticação.gov"
                            width={240}
                            height={48}
                          />
                        </div>
                      </div>
                      <div className="my-32 flex items-center gap-8">
                        <p className="text-sm text-neutral-900">
                          <strong>Não tem Chave Móvel Digital?</strong>
                        </p>
                        <button
                          className="text-sm cursor-pointer border-0 bg-transparent p-0 text-primary-600 underline active:decoration-dashed"
                          onClick={() => {
                            setCmdModalOpen(true);
                            window.scrollTo(0, 0);
                          }}
                        >
                          Descubra como criar conta
                        </button>
                      </div>
                      <div className="h-[2px] w-full bg-neutral-400"></div>
                      <div className="flex flex-col gap-24">
                        <div className="flex flex-col gap-8">
                          <h3 className="mt-32 text-l-bold text-brand-blue-dark">Entrar como</h3>
                          <div className="mt-8 flex flex-col gap-16">
                            <RadioButton
                              label="Pessoa com nacionalidade portuguesa"
                              id="nacional"
                              name="citizen-type"
                              className="text-lg text-neutral-900"
                              onChange={() => setCitizenType("nacional")}
                            />
                            <RadioButton
                              label="Pessoa com nacionalidade estrangeira"
                              id="estrangeiro"
                              name="citizen-type"
                              className="text-lg text-neutral-900"
                              onChange={() => setCitizenType("estrangeiro")}
                            />
                          </div>
                        </div>
                        <div className="mt-8 flex flex-col gap-8">
                          <h3 className="text-l-bold text-brand-blue-dark">Termos e condições</h3>
                          <p className="text-sm">
                            Deve ler atentamente os{" "}
                            <TextLink
                              href="/pages/faqs/terms"
                              className="hover:text-primary-800 active:decoration-dashed"
                            >
                              Termos e condições para o tratamento dos seus dados
                            </TextLink>
                          </p>
                          <Checkbox
                            id="terms-cmd"
                            className="text-sm leading-relaxed text-neutral-700"
                            onChange={(e) => setTermsCmdAccepted(e.target.checked)}
                          >
                            Declaro que li e aceito os termos e condições para o tratamento dos meus
                            dados pessoais no acesso e utilização da Área Reservada do dados.gov.pt.
                          </Checkbox>
                        </div>
                      </div>
                      <div className="mt-16">
                        <Button
                          variant="primary"
                          className="text-lg shadow-md hover:shadow-lg h-56 px-48 font-bold transition-all"
                          hasIcon={true}
                          trailingIcon={"agora-line-arrow-right-circle"}
                          trailingIconHover="agora-solid-arrow-right-circle"
                          onClick={handleSamlLogin}
                          disabled={!samlEnabled || !citizenType || !termsCmdAccepted}
                        >
                          Entrar com Chave Móvel Digital
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabBody>
              </Tab>
              <Tab>
                <TabHeader>Autenticação europeia (eIDAS)</TabHeader>
                <TabBody>
                  <div className="rounded-8">
                    <div className="flex flex-col gap-40">
                      <div className="flex items-center justify-between gap-32">
                        <div className="flex flex-col gap-8">
                          <h2 className="text-base font-bold text-brand-blue-dark">
                            Antes de começar...
                          </h2>
                          <p className="text-[#2B363C]">
                            Precisa de ter um meio de autenticação digital disponibilizado pelo seu
                            país de origem na União Europeia (UE). Este meio de autenticação está
                            disponível para a qualquer cidadã/o da UE.
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-32">
                          <NextImage src="/eidas.svg" alt="eIDAS" width={64} height={64} />
                          <NextImage
                            src="/Logos/your_europe.svg"
                            alt="Your Europe"
                            width={120}
                            height={48}
                          />
                        </div>
                      </div>
                      <div className="mt-32 flex items-center gap-8">
                        <p className="text-sm text-neutral-900">
                          <strong>Não tem Autenticação Europeia?</strong>
                        </p>
                        <button
                          className="text-sm cursor-pointer border-0 bg-transparent p-0 text-primary-600 underline active:decoration-dashed"
                          onClick={() => {
                            setEidasModalOpen(true);
                            window.scrollTo(0, 0);
                          }}
                        >
                          Descubra como criar conta
                        </button>
                      </div>
                      <div className="my-32 h-[2px] w-full bg-neutral-400"></div>
                      <p className="text-sm text-neutral-900">
                        Precisa <strong>fornecer documentos</strong> que foram emitidos por uma
                        entidade pública de <strong>outro Estado-Membro</strong> da UE? Agora já é
                        possível recupera-los diretamente do portal emissor entrando com a sua
                        autenticação Europeia.
                      </p>
                      <div className="mt-8 flex flex-col gap-8">
                        <h3 className="text-l-bold text-brand-blue-dark">Termos e condições</h3>
                        <p className="text-sm">
                          Deve ler atentamente os{" "}
                          <TextLink
                            href="/pages/faqs/terms"
                            className="hover:text-primary-800 active:decoration-dashed"
                          >
                            Termos e condições para o tratamento dos seus dados
                          </TextLink>
                        </p>
                        <Checkbox
                          id="terms-eidas"
                          className="text-sm leading-relaxed text-neutral-700"
                          onChange={(e) => setTermsEidasAccepted(e.target.checked)}
                        >
                          Declaro que li e aceito os termos e condições para o tratamento dos meus
                          dados pessoais no acesso e utilização da Área Reservada do dados.gov.pt.
                        </Checkbox>
                      </div>
                      <div className="mt-16">
                        <Button
                          variant="primary"
                          className="text-lg shadow-md hover:shadow-lg h-56 px-48 font-bold transition-all"
                          hasIcon={true}
                          trailingIcon={"agora-line-arrow-right-circle"}
                          trailingIconHover="agora-solid-arrow-right-circle"
                          onClick={handleEidasLogin}
                          disabled={!samlEnabled || !termsEidasAccepted}
                        >
                          Autenticar com eIDAS
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabBody>
              </Tab>
              <Tab>
                <TabHeader>E-mail e palavra-passe</TabHeader>
                <TabBody>
                  <div className="rounded-8">
                    <div className="flex flex-col gap-40">
                      <div className="flex items-center justify-between gap-32">
                        <div className="flex flex-col gap-8">
                          <h2 className="text-base font-bold text-brand-blue-dark">
                            Antes de começar...
                          </h2>
                          <p className="text-[#2B363C]">
                            Apenas utilizadores antigos, que tenham criado conta com email e
                            palavra-passe, conseguem autenticar-se desta forma.
                          </p>
                        </div>
                        <div className="icon-white shrink-0 rounded-8 bg-primary-600 p-16">
                          <Icon name="agora-solid-social-security" className="h-24 w-24" />
                        </div>
                      </div>
                      <div className="my-32 h-[2px] w-full bg-neutral-400"></div>
                      <div className="flex flex-col gap-32">
                        {migrationRequired ? (
                          <>
                            <div>
                              <h2 className="mb-8 text-xl-bold text-brand-blue-dark">
                                Migração obrigatória
                              </h2>
                              <p className="text-neutral-900">
                                O login por email e palavra-passe vai ser descontinuado. Para
                                continuar a aceder ao portal, é necessário migrar a sua conta para a
                                Chave Móvel Digital (CMD) ou autenticação europeia (eIDAS).
                              </p>
                            </div>
                            <div className="bg-amber-50 border-amber-200 rounded-8 border p-24">
                              <div className="flex items-start gap-12">
                                <Icon
                                  name="agora-line-info-mark"
                                  className="text-amber-600 mt-2 h-24 w-24 shrink-0"
                                />
                                <div>
                                  <p className="text-sm-bold text-amber-800 mb-4">Como migrar?</p>
                                  <p className="text-sm text-amber-700">
                                    Autentique-se com a Chave Móvel Digital (separador
                                    &quot;CMD&quot;) ou com a autenticação europeia (separador
                                    &quot;eIDAS&quot;). O sistema detetará a sua conta existente e
                                    guiá-lo-á pelo processo de migração. Os seus dados (conjuntos de
                                    dados, organizações, reutilizações) serão mantidos.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-16">
                              <Button
                                variant="primary"
                                className="text-lg shadow-md hover:shadow-lg h-56 px-48 font-bold transition-all"
                                onClick={handleSamlLogin}
                              >
                                Migrar com CMD
                              </Button>
                              <Button
                                variant="neutral"
                                className="text-lg shadow-md hover:shadow-lg h-56 px-48 font-bold transition-all"
                                onClick={handleEidasLogin}
                              >
                                Migrar com eIDAS
                              </Button>
                            </div>
                          </>
                        ) : showRecovery ? (
                          <>
                            {recoverySuccess ? (
                              <StatusCard
                                variant="success"
                                showIcon
                                description="Se o endereço de e-mail estiver associado a uma conta, receberá um e-mail com instruções para redefinir a sua palavra-passe."
                              />
                            ) : (
                              <>
                                <div>
                                  <h2 className="mb-8 text-xl-bold text-brand-blue-dark">
                                    Recuperar palavra-passe
                                  </h2>
                                  <p className="text-neutral-900">
                                    Introduza o seu endereço de e-mail e enviaremos instruções para
                                    redefinir a sua palavra-passe.
                                  </p>
                                </div>

                                {recoveryError && (
                                  <StatusCard
                                    variant="danger"
                                    showIcon
                                    description={recoveryError}
                                  />
                                )}

                                <form
                                  className="flex flex-col gap-24"
                                  onSubmit={handleRecoverySubmit}
                                >
                                  <InputText
                                    label="Endereço de e-mail *"
                                    placeholder="Introduza aqui o texto"
                                    id="recovery-email"
                                    name="email"
                                    type="email"
                                    className="w-full max-w-[560px]"
                                    disabled={recoveryLoading}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                  />

                                  {recaptchaSiteKey && (
                                    <div className="mt-8">
                                      <ReCAPTCHA
                                        ref={recaptchaRef}
                                        sitekey={recaptchaSiteKey}
                                        hl="pt"
                                      />
                                    </div>
                                  )}

                                  <div className="mt-8 flex items-center gap-16">
                                    <Button
                                      variant="primary"
                                      type="submit"
                                      className="text-lg shadow-md hover:shadow-lg h-56 px-48 font-bold transition-all"
                                      disabled={recoveryLoading || !recoveryEmail}
                                    >
                                      {recoveryLoading ? "A enviar..." : "Redefinir palavra-passe"}
                                    </Button>
                                    <button
                                      type="button"
                                      className="text-sm cursor-pointer border-0 bg-transparent p-0 text-primary-600 underline active:decoration-dashed"
                                      onClick={() => {
                                        setShowRecovery(false);
                                        setRecoveryError(null);
                                        setRecoveryEmail("");
                                        recaptchaRef.current?.reset();
                                      }}
                                    >
                                      Voltar ao início de sessão
                                    </button>
                                  </div>
                                </form>
                              </>
                            )}

                            {recoverySuccess && (
                              <div className="mt-16">
                                <button
                                  type="button"
                                  className="text-sm cursor-pointer border-0 bg-transparent p-0 text-primary-600 underline active:decoration-dashed"
                                  onClick={() => {
                                    setShowRecovery(false);
                                    setRecoverySuccess(false);
                                    setRecoveryEmail("");
                                  }}
                                >
                                  Voltar ao início de sessão
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
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
                                <Checkbox
                                  label="Lembrar palavra-passe"
                                  id="remember-me"
                                  name="remember-me"
                                />
                              </div>

                              <div className="mt-24 flex items-center gap-8">
                                <span className="text-sm text-neutral-900">
                                  Esqueceu-se da palavra-passe?
                                </span>
                                <button
                                  type="button"
                                  className="text-sm cursor-pointer border-0 bg-transparent p-0 text-primary-600 underline active:decoration-dashed"
                                  onClick={() => setShowRecovery(true)}
                                >
                                  Recuperar palavra-passe
                                </button>
                              </div>
                              <div className="mt-8 flex flex-col gap-8">
                                <h3 className="text-l-bold text-brand-blue-dark">
                                  Termos e condições
                                </h3>
                                <p className="text-sm">
                                  Deve ler atentamente os{" "}
                                  <TextLink
                                    href="/pages/faqs/terms"
                                    className="hover:text-primary-800 active:decoration-dashed"
                                  >
                                    Termos e condições para o tratamento dos seus dados
                                  </TextLink>
                                </p>
                                <Checkbox
                                  id="terms-email"
                                  className="text-sm leading-relaxed text-neutral-700"
                                  onChange={(e) => setTermsEmailAccepted(e.target.checked)}
                                >
                                  Declaro que li e aceito os termos e condições para o tratamento
                                  dos meus dados pessoais no acesso e utilização da Área Reservada
                                  do dados.gov.pt.
                                </Checkbox>
                              </div>
                              <div className="mt-8">
                                <Button
                                  variant="primary"
                                  type="submit"
                                  className="text-lg shadow-md hover:shadow-lg h-56 px-48 font-bold transition-all"
                                  disabled={
                                    isLoading ||
                                    !loginEmail ||
                                    !loginPassword ||
                                    !termsEmailAccepted
                                  }
                                >
                                  {isLoading ? "A autenticar..." : "Autenticar"}
                                </Button>
                              </div>
                            </form>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TabBody>
              </Tab>
            </Tabs>

            {/* Status card aligned with tab content */}
            <div className="mt-32 grid gap-32 xl:grid-cols-12">
              <div className="xl:col-span-3" />
              <div className="xl:col-span-9 xl:col-start-4">
                <StatusCard
                  variant="informative"
                  showIcon
                  description={
                    <div className="flex flex-col gap-8">
                      <p className="text-sm font-bold">Tem dúvidas?</p>
                      <p className="text-sm">
                        Se precisar de ajuda, fale connosco através do nosso formulário.
                      </p>
                      <a
                        href="/pages/support"
                        className="text-sm flex items-center gap-8 text-informative-600"
                      >
                        Formulário de contacto
                        <Icon
                          name="agora-line-arrow-right-circle"
                          className="h-16 w-16 text-informative-600"
                        />
                      </a>
                    </div>
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
