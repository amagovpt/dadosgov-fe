"use client";

import React from "react";
import {
  Accordion,
  Icon,
  ToggleGroup,
  Toggle,
  InputText,
  InputTextArea,
  Button,
  StatusCard,
  DropdownSection,
  DropdownOption,
} from "@ama-pt/agora-design-system";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import HeroGeneral from "@/components/HeroGeneral";
import { submitSupportContact, type SupportTopic } from "@/service/api/system";
import IsolatedSelect from "@/components/admin/IsolatedSelect";
import AppIcon from "../Primitives/AppIcon";

const FAQ_DATA = [
  {
    category: "Sobre dados específicos",
    items: [
      {
        question: "Dados sobre um tema concreto?",
        answer: "",
        richAnswer: true,
        defaultExpanded: true,
      },
    ],
  },
  {
    category: "Publicar dados no portal",
    items: [
      {
        question: "Quer publicar no portal dados.gov.pt?",
        answer: "",
        richAnswer: "publicar",
        defaultExpanded: true,
      },
    ],
  },
  {
    category: "Usar dados / reutilização",
    items: [
      {
        question: "Precisa de ajuda para encontrar ou usar dados?",
        answer: "",
        richAnswer: "usar-dados",
        defaultExpanded: true,
      },
    ],
  },
  {
    category: "APIs e Acesso Técnico",
    items: [
      {
        question: "Questões sobre API ou acesso de programação",
        answer: "",
        richAnswer: "apis",
        defaultExpanded: true,
      },
    ],
  },
  {
    category: "Questões legais e privacidade",
    items: [
      {
        question: "Dúvidas sobre legalidade ou dados pessoais",
        answer: "",
        richAnswer: "legais",
        defaultExpanded: true,
      },
    ],
  },
  {
    category: "Problemas técnicos no portal",
    items: [
      {
        question: "Encontrou um erro no sistema?",
        answer: "",
        richAnswer: "problemas-tecnicos",
        defaultExpanded: true,
      },
    ],
  },
  {
    category: "Pedidos de novos dados",
    items: [
      {
        question: "Não encontrou os dados que procura?",
        answer: "",
        richAnswer: "pedidos-dados",
        defaultExpanded: true,
      },
    ],
  },
  {
    category: "Outros assuntos",
    items: [
      {
        question: "Outras necessidades",
        answer: "",
        richAnswer: "outros",
        defaultExpanded: true,
      },
    ],
  },
];

const shouldPreselectFeedbackFromUrl = (): boolean => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("toggle") === "feedback";
};

const SupportPageContent = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [activeItem, setActiveItem] = React.useState(() =>
    shouldPreselectFeedbackFromUrl() ? "Ajuda" : "Nesta página"
  );
  const [expandedId, setExpandedId] = React.useState<string | null>("0-1");
  const [selectedToggle, setSelectedToggle] = React.useState<string | null>(() =>
    shouldPreselectFeedbackFromUrl() ? "feedback" : null
  );
  const [subjectBody, setSubjectBody] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [problemUrl, setProblemUrl] = React.useState("");
  const [problemDateTime, setProblemDateTime] = React.useState("");
  const [errors, setErrors] = React.useState({
    email: "",
    subject: "",
    description: "",
    category: "",
  });
  const [successMessage, setSuccessMessage] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetFormFields = () => {
    setSelectedToggle(null);
    setEmail("");
    setSubjectBody("");
    setDescription("");
    setCategory("");
    setProblemUrl("");
    setProblemDateTime("");
    setErrors({ email: "", subject: "", description: "", category: "" });
  };

  const TOGGLE_SUCCESS_MAP: Record<string, string> = {
    question: "Pergunta enviada com sucesso.",
    bug: "Problema reportado com sucesso.",
    feedback: "Feedback enviado com sucesso.",
  };

  // Compose the structured fields (category + operational data) into the
  // message body so the backend email carries them without needing new
  // server-side fields.
  const composeMessage = (toggle: string) => {
    const lines: string[] = [];
    if (category) lines.push(`Categoria: ${category}`);
    if (toggle === "bug") {
      if (problemUrl.trim()) lines.push(`Página/URL: ${problemUrl.trim()}`);
      if (problemDateTime.trim()) lines.push(`Data/hora aproximada: ${problemDateTime.trim()}`);
    }
    const header = lines.join("\n");
    return header ? `${header}\n\n${description.trim()}` : description.trim();
  };

  const handleSubmit = async () => {
    if (!selectedToggle || selectedToggle === "dataset") return;

    const newErrors = {
      email: email.trim() ? "" : "Campo obrigatório",
      subject: subjectBody.trim() ? "" : "Campo obrigatório",
      description: description.trim() ? "" : "Campo obrigatório",
      category: category ? "" : "Campo obrigatório",
    };
    setErrors(newErrors);
    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) return;

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      let recaptchaToken: string | null = null;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha("support_contact");
        } catch (err) {
          console.warn("reCAPTCHA execution failed:", err);
        }
      }

      await submitSupportContact({
        topic: selectedToggle as SupportTopic,
        email: email.trim(),
        subject: subjectBody.trim(),
        message: composeMessage(selectedToggle),
        recaptchaToken,
      });
      setSuccessMessage(TOGGLE_SUCCESS_MAP[selectedToggle]);
      resetFormFields();
    } catch (err) {
      console.error("Support form submission failed:", err);
      setErrorMessage("Não foi possível enviar o seu pedido. Tente novamente em alguns instantes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TOGGLE_PREFIX_MAP: Record<string, string> = {
    question: "Pergunta",
    bug: "Problema",
    feedback: "Feedback",
  };

  const TOGGLE_TITLE_MAP: Record<string, string> = {
    question: "Qual o problema que está a enfrentar?",
    bug: "Qual o problema que está a enfrentar?",
    feedback: "Envie o seu feedback",
  };

  const TOGGLE_SUBJECT_LABEL_MAP: Record<string, string> = {
    question: "O assunto da sua pergunta *",
    bug: "O assunto do seu problema *",
    feedback: "O assunto do seu feedback *",
  };

  const TOGGLE_CONTENT_LABEL_MAP: Record<string, string> = {
    question: "A sua pergunta *",
    bug: "Descreva o problema *",
    feedback: "Descreva a situação *",
  };

  // Category options per toggle type (text from the "Ajuda e Contactos" spec).
  const TOGGLE_CATEGORIES_MAP: Record<string, string[]> = {
    question: [
      "Questão sobre o funcionamento do portal",
      "Questão sobre publicação de dados",
      "Questão sobre reutilização de dados",
      "Questão sobre organizações ou fornecedores de dados",
      "Questão sobre metadados, formatos ou licenças",
      "Outra questão geral",
    ],
    bug: [
      "Erro técnico no portal",
      "Problema no acesso ou autenticação",
      "Problema ao publicar ou editar um dataset",
      "Problema com ficheiros, ligações ou APIs",
      "Problema com uma organização ou reutilização",
      "Conteúdo incorreto ou indisponível",
      "Outro problema",
    ],
    feedback: [
      "Sugestão de melhoria do portal",
      "Sugestão sobre conteúdos de literacia/conhecimento",
      "Sugestão sobre pesquisa e navegação",
      "Sugestão sobre datasets ou reutilizações",
      "Feedback geral sobre a experiência de utilização",
    ],
  };

  // Contextual routing / suggested message shown above the form per type.
  const TOGGLE_INFO_MESSAGE_MAP: Record<string, string> = {
    question:
      "Antes de submeter a sua questão, consulte as Perguntas Frequentes e a área de Conhecimento do dados.gov.pt, onde poderá encontrar informação sobre dados abertos, publicação, reutilização, metadados, licenças e funcionamento do portal.",
    feedback:
      "O seu feedback é importante para melhorar continuamente o dados.gov.pt. Partilhe connosco sugestões, comentários ou propostas de melhoria relacionadas com o portal e os seus conteúdos.",
  };

  // "Pedir um dataset" is informative only — no form is submitted.
  const DATASET_INFO = {
    description:
      "Para sugerir ou solicitar a publicação de um conjunto de dados que ainda não esteja disponível no dados.gov.pt, indicando, sempre que possível, a entidade responsável e a finalidade da reutilização.",
    message:
      "Para questões relacionadas com um conjunto de dados específico, tais como pedidos de atualização, esclarecimentos sobre conteúdo, formatos, periodicidade, qualidade dos dados ou disponibilização de informação adicional, utilize preferencialmente a área de discussão/comentários disponível na página do respetivo dataset. A resposta é da responsabilidade da entidade publicadora.",
  };

  return (
    <main id="nesta-pagina" className="flex-grow bg-white pb-64">
      <HeroGeneral
        title={
          <>
            <span className="mb-[10px] text-32 font-[500] text-white">
              Bem-vindo à página de suporte do{" "}
</span>
            <span className="text-32 font-[500] text-white">portal dados.gov.pt</span>
          </>
        }
        breadcrumbItems={[
          { label: "Home", url: "/" },
          { label: "Ajuda e contactos", url: "#" },
        ]}
        backgroundImageUrl="/Banner/hero-bg.png"
        subtitle={
          <>
            <label className="mt-48 block text-[20px] font-bold text-white">
              Antes de nos contactar, recomendamos a consulta das Perguntas Frequentes desta página
              ou da área de Recursos do{" "}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-white text-[20px]"
              >
                dados.gov.pt
              </a>
              , onde pode encontrar respostas e informação de apoio sobre dados abertos, publicação e
              reutilização de dados.
            </label>

            <div className="shadow-lg dropdown absolute mb-64 w-full bg-white text-neutral-900"></div>

            <div className="mt-16 flex flex-col gap-16">
              <a
                href="/faqs/about_dadosgov/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center gap-8 text-white hover:underline"
              >
                O que é o dados.gov.pt
                <AppIcon name="agora-line-arrow-right-circle" className="fill-white" />
              </a>

              <a
                href="/faqs/about_opendata/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center gap-8 text-white hover:underline"
              >
                Saber mais sobre dados abertos
                <AppIcon name="agora-line-arrow-right-circle" className="fill-white" />
              </a>
            </div>
          </>
        }
      />

      <div className="container mx-auto px-4 py-64">
        <div className="grid gap-32 md:grid-cols-3 xl:grid-cols-12">
          <div className="max-w-ch xl:col-span-8 xl:block">
            {/* FAQ Section */}
            <div id="faq" className="mx-auto max-w-4xl scroll-mt-[190px]">
              <p className="text-sm mb-32 text-neutral-700">Conteúdos atualizado a 23.2.2026</p>
              <h2 className="mb-32 text-xl-semibold text-primary-900">Perguntas frequentes</h2>

              <div className="space-y-48">
                {FAQ_DATA.map((category, idx) => (
                  <section
                    key={idx}
                    id={category.category
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/\s+/g, "-")
                      .replace(/[^\w-]/g, "")}
                    className={`${category.category !== "Sobre dados específicos" ? "mt-32" : ""} scroll-mt-[190px]`}
                  >
                    <h3 className="mb-16 text-[20px] font-bold text-[#021C51]">
                      {category.category}
                    </h3>
                    <div>
                      {category.items.map((item, itemIdx) => {
                        const currentId = `${idx}-${itemIdx}`;
                        return (
                          <Accordion
                            key={`${currentId}-${expandedId === currentId}`}
                            headingTitle={
                              <span className="mr-16 font-bold text-[#2B363C]">
                                {item.question}
                              </span>
                            }
                            headingLevel="h4"
                            defaultExpanded={expandedId === currentId}
                            onExpanded={() => setExpandedId(currentId)}
                            onCollapsed={() => {
                              if (expandedId === currentId) {
                                setExpandedId(null);
                              }
                            }}
                          >
                            <div className="mr-16 py-16 leading-relaxed text-neutral-900">
                              {"richAnswer" in item && item.richAnswer === "publicar" ? (
                                <div className="space-y-16">
                                  <div>
                                    <p className="font-bold">Informação oficial sobre publicação</p>
                                    <p>Página &ldquo;Publicar Dados&rdquo; no portal:</p>
                                    <p>
                                      Como publicar dados — explicação passo-a-passo no portal{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/faqs/publish",
                                            "_blank"
                                          )
                                        }
                                      >
                                        Como publicar dados
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Tópicos incluídos:</p>
                                    <p>Quem pode publicar (AP e outros participantes)</p>
                                    <p>Criar conta / associar organização</p>
                                    <p>Carregar conjunto de dados ou referenciar URL</p>
                                    <p>Usar API ou harvester</p>
                                    <p>Certificação de fornecedores oficiais</p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Tornar-me publicador</p>
                                    <p>1. Criar conta no portal</p>
                                    <p>2. Associar-se à organização</p>
                                    <p>3. Aguardar validação</p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Atualizar um conjunto de dados</p>
                                    <p>
                                      Pode editar o conjunto de dados e substituir ou acrescentar
                                      recursos a qualquer momento
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Dados pessoais ou sensíveis</p>
                                    <p>Apenas dados anonimizados podem ser publicados.</p>
                                    <p>Para questões sobre proteção de dados:</p>
                                    <p>
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() => window.open("https://www.cnpd.pt", "_blank")}
                                      >
                                        Comissão Nacional de Proteção de Dados
                                      </Button>
                                    </p>
                                  </div>
                                </div>
                              ) : "richAnswer" in item && item.richAnswer === "usar-dados" ? (
                                <div className="space-y-16">
                                  <div>
                                    <p className="font-bold">Pesquisa de dados aberta do portal</p>
                                    <p>
                                      Página principal do portal:{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open("/", "_blank")
                                        }
                                      >
                                        dados.gov.pt
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Como reutilizar dados</p>
                                    <p>
                                      Consultar secções de exemplos de reutilização e licenças no
                                      portal, ex:{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/faqs/reuse/",
                                            "_blank"
                                          )
                                        }
                                      >
                                        (Como reutilizar dados?)
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Licenças de dados abertos</p>
                                    <p>
                                      Licenças padrão (ex.: Creative Commons CC BY 4.0 utilizado no
                                      portal){" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/faqs/terms",
                                            "_blank"
                                          )
                                        }
                                      >
                                        Licenças
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Citar dados corretamente</p>
                                    <p>Ver informação de metadados em cada conjunto de dados</p>
                                    <p>
                                      Indicar: nome do conjunto de dados, entidade publicadora, link original,
                                      data de acesso
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Casos de reutilização</p>
                                    <p>
                                      Consultar exemplos de projetos baseados em dados abertos no
                                      portal
                                    </p>
                                  </div>
                                </div>
                              ) : "richAnswer" in item && item.richAnswer === "apis" ? (
                                <div className="space-y-16">
                                  <div>
                                    <p className="font-bold">Referência API</p>
                                    <p>
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open("/faqs/api-documentation", "_blank")
                                        }
                                      >
                                        Endpoint de API do portal
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Autenticação / chave API</p>
                                    <p>
                                      A API permite leitura aberta. Para escrita/autenticação é
                                      necessário gerar o token na área de administração do
                                      utilizador.
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">
                                      Limites de pedidos / uso responsável
                                    </p>
                                    <p>
                                      Política de uso do API nos termos do portal{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/api-tutorial/",
                                            "_blank"
                                          )
                                        }
                                      >
                                        API tutorial
                                      </Button>
                                    </p>
                                  </div>
                                </div>
                              ) : "richAnswer" in item && item.richAnswer === "legais" ? (
                                <div className="space-y-16">
                                  <div>
                                    <p className="font-bold">Proteção de Dados Pessoais / RGPD</p>
                                    <p>
                                      Contactar a{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() => window.open("https://www.cnpd.pt", "_blank")}
                                      >
                                        Comissão Nacional de Proteção de Dados
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Pedido de remoção de dados pessoais</p>
                                    <p>
                                      Contactar a equipa do dados.gov.pt na página de{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/support#ajuda",
                                            "_blank"
                                          )
                                        }
                                      >
                                        Suporte
                                      </Button>
                                    </p>
                                  </div>
                                </div>
                              ) : "richAnswer" in item &&
                                item.richAnswer === "problemas-tecnicos" ? (
                                <div className="space-y-16">
                                  <div>
                                    <p className="font-bold">
                                      Erros de login / publicação / upload / pesquisa / comentários
                                    </p>
                                    <p>
                                      Contactar a equipa do dados.gov.pt na página de{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/support",
                                            "_blank"
                                          )
                                        }
                                      >
                                        Suporte
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">
                                      Página ou funcionalidade indisponível
                                    </p>
                                    <p>
                                      Contactar a equipa do dados.gov.pt na página de{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/support",
                                            "_blank"
                                          )
                                        }
                                      >
                                        suporte
                                      </Button>{" "}
                                      escolhendo &ldquo;Reportar um problema&rdquo;.
                                    </p>
                                  </div>
                                </div>
                              ) : "richAnswer" in item && item.richAnswer === "pedidos-dados" ? (
                                <div className="space-y-16">
                                  <div>
                                    <p className="font-bold">Sugerir conjunto de dados</p>
                                    <p>Formulário de sugestão no portal</p>
                                  </div>
                                  <div>
                                    <p className="font-bold">
                                      Pedido formal de dados a uma entidade pública
                                    </p>
                                    <p>
                                      Pode dirigir pedidos à{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() => window.open("https://www.cada.pt", "_blank")}
                                      >
                                        Comissão de Acesso a Documentos Administrativos
                                      </Button>
                                    </p>
                                    <p>
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open("/support", "_blank")
                                        }
                                      >
                                        formulário e orientação disponíveis na página de contato
                                      </Button>
                                    </p>
                                    <p>
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/organizations/comissao-de-acesso-aos-documentos-administrativos/#/presentation",
                                            "_blank"
                                          )
                                        }
                                      >
                                        Comissão de Acesso a Documentos Administrativos
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">
                                      Ver pedidos existentes de abertura de dados
                                    </p>
                                    <p>
                                      Consultar lista pública de pedidos no portal{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/organizations/comissao-de-acesso-aos-documentos-administrativos/#/presentation",
                                            "_blank"
                                          )
                                        }
                                      >
                                        Comissão de Acesso aos Documentos Administrativos
                                      </Button>
                                    </p>
                                  </div>
                                </div>
                              ) : "richAnswer" in item && item.richAnswer === "outros" ? (
                                <div className="space-y-16">
                                  <div>
                                    <p className="font-bold">Dar feedback ao portal</p>
                                    <p>Formulário de feedback</p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Sugerir melhorias do sistema</p>
                                    <p>Formulário de sugestões</p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Reportar conteúdo impróprio</p>
                                    <p>Usar funcionalidades de sinalização do portal</p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Eventos, formação e comunidade</p>
                                    <p>Consultar secções de iniciativas e casos de reutilização</p>
                                  </div>
                                </div>
                              ) : "richAnswer" in item && item.richAnswer ? (
                                <div className="space-y-16">
                                  <div>
                                    <p className="font-bold">Estatísticas oficiais</p>
                                    <p>
                                      Visitar o Instituto Nacional de Estatística no{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/organizations/instituto-nacional-de-estatistica/",
                                            "_blank"
                                          )
                                        }
                                      >
                                        dados.gov.pt
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Dados geográficos / cartografia</p>
                                    <p>
                                      Direção-Geral do Território no{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/organizations/direcao-geral-do-territorio/",
                                            "_blank"
                                          )
                                        }
                                      >
                                        dados.gov.pt
                                      </Button>
                                    </p>
                                    <p>
                                      Sistema Nacional de Informação Geográfica{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open("https://snig.dgterritorio.gov.pt/", "_blank")
                                        }
                                      >
                                        SNIG
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Dados bibliográficos / culturais</p>
                                    <p>
                                      Biblioteca Nacional de Portugal -{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "https://opendata.bnportugal.gov.pt/eng_index.htm",
                                            "_blank"
                                          )
                                        }
                                      >
                                        OpenData BNP
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">
                                      Dados do Sistema de Informação Cadastral Simplificado e do
                                      Balcão Único do Prédio
                                    </p>
                                    <p>
                                      eBUPI no{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "/organizations/ebupi-estrutura-de-missao-para-a-expansao-do-sistema-de-informacao-cadastral-simplificado/#/presentation",
                                            "_blank"
                                          )
                                        }
                                      >
                                        dados.gov.pt
                                      </Button>
                                    </p>
                                    <p>
                                      Estrutura de Missão Para a Expansão do Sistema de Informação
                                      Cadastral Simplificado no{" "}
                                      <Button
                                        appearance="link"
                                        variant="neutral"
                                        className="inline !p-0 [text-decoration-color:var(--color-neutral-900)]"
                                        style={{
                                          minHeight: "auto",
                                          height: "auto",
                                          minWidth: "auto",
                                        }}
                                        onClick={() =>
                                          window.open(
                                            "https://www.gov.pt/entidades/estrutura-de-missao-para-a-expansao-do-sistema-de-informacao-cadastral-simplificado",
                                            "_blank"
                                          )
                                        }
                                      >
                                        gov.pt
                                      </Button>
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">
                                      Questões sobre um conjunto de dados no dados.gov.pt
                                    </p>
                                    <p>
                                      Abrir o separador <strong>&ldquo;Discussões&rdquo;</strong> na
                                      página do conjunto de dados
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                item.answer
                              )}
                            </div>
                          </Accordion>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {/* Bottom Support Options */}
          </div>

          <div className="sticky top-[190px] h-fit self-start xl:col-span-4 xl:block">
            <div className="sidebar-index border-l border-neutral-700 pr-64">
              <ul>
                <li className="mb-16 cursor-pointer" onClick={() => setActiveItem("Nesta página")}>
                  <a
                    href="#nesta-pagina"
                    className={`text-neutral-900 ${activeItem === "Nesta página" ? "text-m-bold font-bold" : "text-m-regular"}`}
                    style={activeItem === "Nesta página" ? { fontWeight: 700 } : {}}
                  >
                    Nesta página
                  </a>
                </li>
                {FAQ_DATA.map((category) => {
                  const slug = category.category
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/[^\w-]/g, "");
                  return (
                    <li
                      key={slug}
                      className="mb-8 cursor-pointer"
                      onClick={() => setActiveItem(category.category)}
                    >
                      <a
                        href={`#${slug}`}
                        className={`text-neutral-900 ${activeItem === category.category ? "text-m-bold font-bold" : "text-m-regular"}`}
                        style={activeItem === category.category ? { fontWeight: 700 } : {}}
                      >
                        {category.category}
                      </a>
                    </li>
                  );
                })}
                <li className="cursor-pointer" onClick={() => setActiveItem("Ajuda")}>
                  <a
                    href="#ajuda"
                    className={`text-neutral-900 ${activeItem === "Ajuda" ? "text-m-bold font-bold" : "text-m-regular"}`}
                    style={activeItem === "Ajuda" ? { fontWeight: 700 } : {}}
                  >
                    Ajuda
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div id="ajuda" className="mt-80 scroll-mt-[190px] border-neutral-200 pt-64">
          <h2 className="mb-24 text-24 font-bold text-[#021C51]">Ajuda</h2>
          <h3 className="mb-16 text-[20px] font-[500] text-[#021C51]">
            Não encontrou o que procurava?
          </h3>

          <p className="mb-8 text-[16px] text-neutral-800">
            Antes de nos contactar, consulte as Perguntas Frequentes e a área de Conhecimento do
            dados.gov.pt. A sua questão poderá já estar respondida nos conteúdos disponíveis sobre
            dados abertos, publicação de datasets, reutilização de dados, metadados, licenças e
            funcionamento do portal.
          </p>
          <p className="mb-24 text-[16px] text-neutral-800">
            Caso ainda necessite de apoio, selecione a opção mais adequada:
          </p>

          <ToggleGroup
            multiple={false}
            value={selectedToggle ?? ""}
            onChange={(val) => {
              const selected = val.length > 0 ? val[0] : null;
              resetFormFields();
              setSelectedToggle(selected);
              setSuccessMessage("");
              setErrorMessage("");
            }}
          >
            <Toggle
              value="question"
              leadingIcon="agora-line-question-mark"
              leadingIconHover="agora-solid-question-mark"
              hasIcon={true}
            >
              Tenho uma pergunta
            </Toggle>
            <Toggle
              value="bug"
              leadingIcon="agora-line-alert-triangle"
              leadingIconHover="agora-solid-alert-triangle"
              hasIcon={true}
            >
              Reportar um problema
            </Toggle>
            <Toggle
              value="feedback"
              leadingIcon="agora-line-chat"
              leadingIconHover="agora-solid-chat"
              hasIcon={true}
            >
              Envie o seu feedback
            </Toggle>
            <Toggle
              value="dataset"
              leadingIcon="agora-line-plus-circle"
              leadingIconHover="agora-solid-plus-circle"
              hasIcon={true}
            >
              Pedir um dataset
            </Toggle>
          </ToggleGroup>

          {selectedToggle && selectedToggle !== "dataset" && (
            <div className="mt-32 max-w-2xl">
              <h3 className="mb-24 text-[20px] font-bold text-[#021C51]">
                {TOGGLE_TITLE_MAP[selectedToggle]}
              </h3>

              {TOGGLE_INFO_MESSAGE_MAP[selectedToggle] && (
                <div className="mb-24">
                  <StatusCard
                    variant="informative"
                    showIcon
                    description={TOGGLE_INFO_MESSAGE_MAP[selectedToggle]}
                  />
                </div>
              )}

              <div>
                <div className="mt-[20px]">
                  <InputText
                    label="O seu e-mail *"
                    type="email"
                    required
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setEmail(e.target.value);
                      if (e.target.value.trim()) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    hasError={!!errors.email}
                    errorFeedbackText={errors.email}
                  />
                </div>

                <div className="mt-[20px]">
                  <IsolatedSelect
                    key={`category-${selectedToggle}`}
                    label="Categoria *"
                    placeholder="Selecione uma categoria..."
                    id="support-category"
                    defaultValue={category}
                    required
                    hasError={!!errors.category}
                    errorFeedbackText={errors.category}
                    onChangeCallback={(value) => {
                      setCategory(value);
                      if (value) setErrors((prev) => ({ ...prev, category: "" }));
                    }}
                  >
                    <DropdownSection name="categories">
                      {(TOGGLE_CATEGORIES_MAP[selectedToggle] ?? []).map((cat) => (
                        <DropdownOption key={cat} value={cat}>
                          {cat}
                        </DropdownOption>
                      ))}
                    </DropdownSection>
                  </IsolatedSelect>
                </div>

                <div className="mt-[20px]">
                  <InputText
                    label={TOGGLE_SUBJECT_LABEL_MAP[selectedToggle]}
                    value={`${TOGGLE_PREFIX_MAP[selectedToggle]} - ${subjectBody}`}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const prefix = `${TOGGLE_PREFIX_MAP[selectedToggle]} - `;
                      if (e.target.value.startsWith(prefix)) {
                        const body = e.target.value.slice(prefix.length);
                        setSubjectBody(body);
                        if (body.trim()) setErrors((prev) => ({ ...prev, subject: "" }));
                      }
                    }}
                    onSelect={(e: React.SyntheticEvent<HTMLInputElement>) => {
                      const prefix = `${TOGGLE_PREFIX_MAP[selectedToggle]} - `;
                      const input = e.currentTarget;
                      if (input.selectionStart !== null && input.selectionStart < prefix.length) {
                        input.setSelectionRange(
                          prefix.length,
                          Math.max(prefix.length, input.selectionEnd ?? prefix.length)
                        );
                      }
                    }}
                    hasError={!!errors.subject}
                    errorFeedbackText={errors.subject}
                    required
                  />
                </div>

                {selectedToggle === "bug" && (
                  <>
                    <div className="mt-[20px]">
                      <InputText
                        label="Página ou URL onde ocorreu o problema"
                        placeholder="https://dados.gov.pt/..."
                        value={problemUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProblemUrl(e.target.value)
                        }
                      />
                    </div>

                    <div className="mt-[20px]">
                      <InputText
                        label="Data/hora aproximada"
                        placeholder="Ex.: 05/06/2026 14:30"
                        value={problemDateTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProblemDateTime(e.target.value)
                        }
                      />
                    </div>
                  </>
                )}

                <div className="mt-[20px]">
                  <InputTextArea
                    label={TOGGLE_CONTENT_LABEL_MAP[selectedToggle]}
                    required
                    rows={5}
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      setDescription(e.target.value);
                      if (e.target.value.trim())
                        setErrors((prev) => ({ ...prev, description: "" }));
                    }}
                    hasError={!!errors.description}
                    errorFeedbackText={errors.description}
                  />
                </div>

                <div className="mt-[20px]">
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "A enviar..." : "Enviar"}
                  </Button>
                </div>

                {errorMessage && (
                  <div className="mt-[20px]">
                    <StatusCard variant="danger" description={errorMessage} />
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedToggle === "dataset" && (
            <div className="mt-32 max-w-2xl">
              <p className="mb-16 text-[16px] text-neutral-800">{DATASET_INFO.description}</p>
              <StatusCard variant="informative" showIcon description={DATASET_INFO.message} />
            </div>
          )}

          {successMessage && (
            <div className="mt-32 max-w-2xl">
              <StatusCard variant="success" description={successMessage} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const RECAPTCHA_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

const SupportPage = () => {
  if (RECAPTCHA_KEY) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_KEY} language="pt">
        <SupportPageContent />
      </GoogleReCaptchaProvider>
    );
  }
  return <SupportPageContent />;
};

export default SupportPage;
