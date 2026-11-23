export interface GlossaryEntry {
  word: string;
  description: string;
}

export interface GlossaryGroup {
  letter: string;
  items: GlossaryEntry[];
}

export interface GlossaryPageData {
  hero: {
    title: string;
    subtitle: string;
  };
  glossary: GlossaryEntry[];
}
