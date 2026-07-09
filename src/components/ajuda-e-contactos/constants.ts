import type { FaqCategory } from "./types";

export const FAQ_UPDATED_DATE = "Conteúdos atualizado a 23.2.2026";

export const FAQ_DATA: FaqCategory[] = [
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
      {
        question: "Solicitar a atribuição ou alteração de um emblema",
        answer: "",
        richAnswer: "emblema",
        defaultExpanded: true,
      },
    ],
  },
];

export const TOGGLE_SUCCESS_MAP: Record<string, string> = {
  question: "Pergunta enviada com sucesso.",
  bug: "Problema reportado com sucesso.",
  feedback: "Feedback enviado com sucesso.",
};

export const TOGGLE_PREFIX_MAP: Record<string, string> = {
  question: "Pergunta",
  bug: "Problema",
  feedback: "Feedback",
};

export const TOGGLE_TITLE_MAP: Record<string, string> = {
  question: "Qual o problema que está a enfrentar?",
  bug: "Qual o problema que está a enfrentar?",
  feedback: "Envie o seu feedback",
};

export const TOGGLE_SUBJECT_LABEL_MAP: Record<string, string> = {
  question: "O assunto da sua pergunta *",
  bug: "O assunto do seu problema *",
  feedback: "O assunto do seu feedback *",
};

export const TOGGLE_CONTENT_LABEL_MAP: Record<string, string> = {
  question: "A sua pergunta *",
  bug: "Descreva o problema *",
  feedback: "Descreva a situação *",
};

export const TOGGLE_CATEGORIES_MAP: Record<string, string[]> = {
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

export const TOGGLE_INFO_MESSAGE_MAP: Record<string, string> = {
  question:
    "Antes de submeter a sua questão, consulte as Perguntas Frequentes e a área de Conhecimento do dados.gov.pt, onde poderá encontrar informação sobre dados abertos, publicação, reutilização, metadados, licenças e funcionamento do portal.",
  feedback:
    "O seu feedback é importante para melhorar continuamente o dados.gov.pt. Partilhe connosco sugestões, comentários ou propostas de melhoria relacionadas com o portal e os seus conteúdos.",
};
