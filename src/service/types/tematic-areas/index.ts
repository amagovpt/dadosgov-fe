import { Anchor, Hero, Image } from "../shared";

export interface SectionTopic {
  sector?: string;
  heading: string;
  body: string;
  datasets: Anchor[];
}

export interface Topic {
  icon:string;
  title: string;
  description: string;
  slug: string;
  coverImage:Image[];
  intro: string;
  keywords: string;
  sections: SectionTopic[];
}

export interface TematicAreaPage {
  hero: Hero;
  topics: Topic[];
}

