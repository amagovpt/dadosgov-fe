import { Hero, Image } from "../shared";
import { FileDocument } from "../shared/common";

export interface MetaDetails {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
}

export interface Publication {
  metaDetails: MetaDetails;
  cover: Image[];
  document?: FileDocument[];
}

export interface PublicationPage {
  hero: Hero;
  publications: Publication[];
}
