// ----------------------------------------------------------------------------------------------

/** SEARCH PAGES **/

import { Section } from "../../shared/common";
import { DatastoryHero, RelatedSection, SourceSection } from "../datastory";

export type Filter = {
  name: string;
  label: string;
};

export type SortParam = {
  name: string;
  label: string;
};

export type NoResults = {
  image: { url: string }[];
  title: string;
  description: string;
};

export type QueryFiltersPt2030 = {
  funds: string[];
  policyObjectives: string[];
  programmes: string[];
  thematicAreas: string[];
  regions: string[];
  municipalities: string[];
};

export type SourceInfo = {
  format: string;
  modificationDate: string;
  publicationDate: string;
  source: string;
  referenceDate: string;
  sourceLink: string;
  title: string;
  updateDate: string;
  url: string;
};

export type TypeOfBeneficiary = {
  name: string;
  title: string;
  description: string | null;
};

export type DatastorySearchPage = {
  hero: DatastoryHero;
  bigNumberTitle: string;
  bigNumbers: string[];
  block: {
    title: string;
    description: string;
  };
  inputSearch: {
    label: string;
    placeholder: string;
    searchActionAltText: string;
    voiceActionAltText: string;
  };
  typesOfBeneficiariesTitle: string;
  typesOfBeneficiaries: TypeOfBeneficiary[];
  filters: Filter[];
  sortBy: SortParam[];
  noResults: NoResults[];
  relatedDatasets: SourceSection;
  relatedDatastories: RelatedSection;
};

export enum EntityRole {
  BENEFICIARIO_PRINCIPAL = "BENEFICIARIO_PRINCIPAL",
  OUTROS_BENEFICIARIOS = "OUTROS_BENEFICIARIOS",
}

// ----------------------------------------------------------------------------------------------

/** PROJECT **/

export type Project = {
  hero: DatastoryHero;
  projectSheet: Section;
  beneficiaries: Section;
  applications: Section;
  publicContracting: Section;
  geographicDistribution: Section;
};

export type PT2030Project = {
  codigo_projeto: string;

  candidaturas: Application;

  nome: string;
  sumario: string;
  modalidade: string;

  valor_financiamento: string;
  valor_executado: string;
  valor_pago: string;

  dt_inicio_prevista: string | null;
  dt_inicio_efetiva: string | null;
  dt_conclusao_prevista: string | null;
  dt_conclusao_efetiva: string | null;

  objetivo_estrategico: string;
  objetivo_especifico: string;

  beneficiarios: FinancialEntity[];
  outos_ben: FinancialEntity[];
  fornecedores: FinancialEntity[];

  contratação_publica?: null;

  distribuicao_geografica: GeographicDistribution[];

  info_datasets: DatasetMetadata[];
};

export type Application = {
  tab_nome: string;
  codigo_aviso: string;
  criterios_selecao?: string;
  nota_final: string;
  designacao_aviso: string;
};

export type FinancialEntity = {
  nif_entidade: string;
  nome: string;
  valor_financiamento: number;
};

export type GeographicDistribution = TerritorialDistribution | TransversalDistribution;

export type TerritorialDistribution = {
  tipo: "concelho" | "distrito" | "subregiao" | "regiao";
  order: number;
  distribuicao: DistributionItem[];
  pc_valor_executado?: number | null;
};

export type DistributionItem = {
  descricao: string;
  valor_financiamento?: number;
  valor_pago?: number;
  pc_valor_executado?: number | null;
};

export type TransversalDistribution = {
  tipo: "transversal";
  pc_valor_executado: number;
  distribuicao_indefinida: number | null;
  valor_financiamento_total: string;
};

export type DatasetMetadata = {
  source: string;
  source_link: string;
  reference_date: string;
  info: DatasetResource[];
};

export type DatasetResource = {
  title: string;
  format: string;
  url: string;
  publication_date: string;
  modification_date: string;
};

/* ------------------------------------------------------------- */

export type PT2030ProjectSheetBeneficiary = {
  name: string;
  entityNif: string;
  financingAmount: number;
};

/* ------------------------------------------------------------- */

export type PT2030ProjectSheetBeneficiaryResponse = {
  limit: number;
  page: number;
  total: number;
  data: PT2030ProjectSheetBeneficiary[];
};

// ----------------------------------------------------------------------------------------------

/** BENEFICIARY **/

// ----------------------------------------------------------------------------------------------
