export enum EntityRole {
  BENEFICIARIO_PRINCIPAL = 'BENEFICIARIO_PRINCIPAL',
  OUTROS_BENEFICIARIOS = 'OUTROS_BENEFICIARIOS',
}

export type SortParam = {
    name: string;
    label: string;
};

export type NoResults = {
    image: { url: string }[];
    title: string;
    description: string;
};

export type QueryBeneficiaryFiltersPt2030 = {
    funds: string[];
    policyObjectives: string[];
    programmes: string[];
    thematicAreas: string[];
    regions: string[];
    municipalities: string[];
}
