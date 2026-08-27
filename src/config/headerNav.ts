export interface AreaOption {
  value: string;
  label: string;
  href: string;
  hidden?: boolean;
}

export interface LanguageOption {
  value: string;
  label: string;
  abbr: string;
  icon: string;
}

export const isEnabled = <T extends { enabled?: boolean | null; requiresAuth?: boolean | null }>(
  item: T,
  isAuthenticated: boolean
): boolean => item.enabled !== false && (!item.requiresAuth || isAuthenticated);


export const languages: LanguageOption[] = [
  { value: "pt", label: "Português", abbr: "PT", icon: "/Icons/languages/pt.svg" },
  { value: "en", label: "English", abbr: "EN", icon: "/Icons/languages/en.svg" },
];

export const areas: AreaOption[] = [
  { value: "1", label: "Portal", href: "/" },
  { value: "2", label: "Iniciar Sessão", href: "/login", hidden: true },
];
