import { Sitemap } from "@/services/types/common";

export type EvolutionState = "finished" | "onProgress" | "toDo";

export interface HeroSection {
  title: string;
  description: string;
}

export interface SectionRoadMap {
  id: string;
  title: string;
  description: string;
}

export interface KeyEvolutionItem {
  functionality: string;
  description: string;
  state: EvolutionState;
}

export interface HistoryEntry {
  title: string;
  description: string;
}

export interface Action {
  children: string;
  href: string;
}

export interface RoadmapPageData {
  hero: HeroSection;
  sitemap: Sitemap;
  visionAndPriorities: SectionRoadMap;
  keyEvolution: SectionRoadMap;
  keyEvolutionPlanned: KeyEvolutionItem[];
  howWePrioritize: SectionRoadMap;
  followAlongAndJoinIn: SectionRoadMap;
  historyOfDevelopment: SectionRoadMap;
  history: HistoryEntry[];
  actionTitle: string;
  actions: Action[];
}
