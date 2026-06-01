export type EvolutionState = 'finished' | 'onProgress' | 'toDo';
 
export interface HeroSection {
  title: string;
  description: string;
}
 
export interface VisionAndPriorities {
  title: string;
  description: string;
}
 
export interface KeyEvolutionItem {
  functionality: string;
  description: string;
  state: EvolutionState;
}
 
export interface HowWePrioritize {
  title: string;
  description: string;
}
 
export interface FollowAlongAndJoinIn {
  title: string;
  description: string;
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
  visionAndPriorities: VisionAndPriorities;
  keyEvolution: string;
  keyEvolutionPlanned: KeyEvolutionItem[];
  howWePrioritize: HowWePrioritize;
  followAlongAndJoinIn: FollowAlongAndJoinIn;
  historyOfDevelopment: string;
  history: HistoryEntry[];
  actionTitle: string;
  actions: Action[];
}