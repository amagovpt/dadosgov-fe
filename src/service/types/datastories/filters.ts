export interface DataStoriesToggleState {
  [key: string]: string;
  temas: string;
  atualizacao: string;
}

export interface DataStoriesFilterState {
  toggles: DataStoriesToggleState;
  tags: string[];
}
