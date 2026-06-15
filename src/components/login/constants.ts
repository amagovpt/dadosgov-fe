export const RECAPTCHA_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

export const BREADCRUMB_ITEMS = [
  { label: "Home", url: "/" },
  { label: "Autenticação", url: "#" },
];

export const PRIMARY_BUTTON_CLASS =
  "text-lg shadow-md hover:shadow-lg h-56 px-48 font-bold transition-all";

export const TEXT_LINK_BUTTON_CLASS =
  "text-sm cursor-pointer border-0 bg-transparent p-0 text-primary-600 underline active:decoration-dashed";

export const TERMS_CHECKBOX_TEXT =
  "Declaro que li e aceito os termos e condições para o tratamento dos meus dados pessoais no acesso e utilização da Área Reservada do dados.gov.pt.";
