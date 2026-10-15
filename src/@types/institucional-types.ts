import { Section } from './component-types';

type ContentTopic = {
  title: string;
  description: string;
  link?: string;
};

type EvaluationItem = {
  date: string;
  report: string;
  link: string;
  content: ContentTopic[];
};

type EvaluationComponent = {
  title: string;
  items: EvaluationItem[];
};

type AccessibilityAndUsabilityPreparationItem = Section | EvaluationComponent;

export {
  ContentTopic,
  EvaluationItem,
  EvaluationComponent,
  AccessibilityAndUsabilityPreparationItem,
};
