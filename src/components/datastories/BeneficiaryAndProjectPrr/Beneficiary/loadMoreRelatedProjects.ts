import type { TFunction } from "i18next";
import {
  PRRBeneficiaryRelatedProjectsResponse,
  PRRBeneficiaryRelatedProjectsType,
} from "@/service/types/datastories/prr/prr";

export const PRR_BENEFICIARY_PROJECTS_LIMIT = 5;

export async function loadMoreRelatedProjects(
  nif: string,
  type: PRRBeneficiaryRelatedProjectsType,
  page: number,
  t: TFunction
): Promise<PRRBeneficiaryRelatedProjectsResponse> {
  const res = await fetch(
    "/internal-api/fundos-europeus/plano-de-recuperacao-e-resiliencia/beneficiarios-e-projetos/ficha-de-beneficiario",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nif, type, page, limit: PRR_BENEFICIARY_PROJECTS_LIMIT }),
    }
  );

  if (!res.ok) {
    throw new Error(t("sheetBenProj.loadMoreProjectsError", { status: res.status }));
  }

  return (await res.json()) as PRRBeneficiaryRelatedProjectsResponse;
}
