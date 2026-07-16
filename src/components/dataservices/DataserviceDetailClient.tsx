"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon, Breadcrumb, Pill } from "@ama-pt/agora-design-system";
import { Dataservice } from "@/service/types/dataservice";
import { fetchDataservice } from "@/service/api/dataservices";
import { followEntity, isFollowing, unfollowEntity } from "@/service/api/followers";
import { useAuth } from "@/context/AuthContext";
import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { formatMetricValue } from "@/utils/formatNumber";
import TextLink from "@/components/Primitives/TextLink";
import { DescriptionWithReadMore } from "@/components/Shared/DescriptionWithReadMore";
import { DataserviceTabs } from "@/components/dataservices/DataserviceTabs";
import {
  ACCESS_TYPE_PILL_LABELS,
  ACCESS_TYPE_PILL_VARIANTS,
  AUDIENCE_ROLE_LABELS,
  AUDIENCE_CONDITION_LABELS,
  RESTRICTION_REASON_LABELS,
} from "@/utils/dataserviceLabels";

interface DataserviceDetailClientProps {
  slug: string;
}

export default function DataserviceDetailClient({ slug }: DataserviceDetailClientProps) {
  const { user, isAdmin } = useAuth();
  const { organizations } = useActiveOrganization();
  const router = useRouter();
  const [dataservice, setDataservice] = useState<Dataservice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadDataservice() {
      try {
        const data = await fetchDataservice(slug);
        if (!cancelled) setDataservice(data);
      } catch (error) {
        console.error("Error loading dataservice:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadDataservice();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!user || !dataservice) return;
    let cancelled = false;
    isFollowing("dataservices", dataservice.id, user.id)
      .then((following) => { if (!cancelled) setIsFavorite(following); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, dataservice?.id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!dataservice || isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        await unfollowEntity("dataservices", dataservice.id);
        setIsFavorite(false);
      } else {
        await followEntity("dataservices", dataservice.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!dataservice) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-500">API não encontrada.</p>
      </div>
    );
  }

  const ownerFullName = dataservice.owner
    ? `${dataservice.owner.first_name} ${dataservice.owner.last_name}`.trim()
    : null;

  const canEdit =
    isAdmin ||
    (user && dataservice.owner?.id === user.id) ||
    (dataservice.organization &&
      organizations.some((org) => org.id === dataservice.organization?.id));

  const accessType = dataservice.access_type;
  const accessPillLabel = accessType
    ? ACCESS_TYPE_PILL_LABELS[accessType] ?? accessType.toUpperCase()
    : null;
  const accessPillVariant = accessType
    ? ACCESS_TYPE_PILL_VARIANTS[accessType] ?? "neutral"
    : "neutral";
  // Audience conditions only carry meaning for restricted access.
  const audiences =
    accessType === "restricted" ? dataservice.access_audiences ?? [] : [];
  const restrictionReason =
    accessType === "restricted"
      ? dataservice.access_type_reason_category
        ? RESTRICTION_REASON_LABELS[dataservice.access_type_reason_category] ??
          dataservice.access_type_reason_category
        : dataservice.access_type_reason ?? null
      : null;

  // Authentication method derived from the access type, so users immediately
  // know whether a key/account is needed before reading the technical details.
  const AUTH_LABELS: Record<string, string> = {
    open: "Nenhuma (acesso público)",
    open_with_account: "Conta de utilizador necessária",
    restricted: "Mediante autorização",
  };
  const authLabel = accessType ? AUTH_LABELS[accessType] ?? null : null;

  // Only render the technical box when at least one technical field exists.
  const hasTechnical = Boolean(
    dataservice.base_api_url ||
      dataservice.rate_limiting ||
      dataservice.availability != null ||
      dataservice.technical_documentation_url ||
      dataservice.business_documentation_url
  );

  const NOT_PROVIDED = "Não comunicado";

  // The list endpoint exposes the modification timestamp as metadata_modified_at;
  // last_modified can be absent (which rendered "Invalid Date").
  const formatLongDate = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime())
      ? null
      : d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
  };
  const lastUpdate =
    formatLongDate(dataservice.metadata_modified_at) ||
    formatLongDate(dataservice.last_modified);

  return (
    <main className="flex w-full flex-col items-center justify-center gap-64">
      {/* Breadcrumb */}
      <div className="container flex items-center justify-between py-64">
        <Breadcrumb
          items={[
            { label: "Home", url: "/" },
            { label: "APIs", url: "/dataservices" },
            { label: dataservice.title, url: `/dataservices/${dataservice.slug}` },
          ]}
        />
      </div>

      {/* Actions */}
      <div className="container flex items-center justify-end gap-16">
        {dataservice.private && <Pill variant="warning">Rascunho</Pill>}
        {dataservice.archived_at && <Pill variant="neutral">Arquivado</Pill>}
        <Button
          variant="neutral"
          appearance="link"
          hasIcon={true}
          leadingIcon={isFavorite ? "agora-solid-star" : "agora-line-star"}
          leadingIconHover="agora-solid-star"
          className="flex-shrink-0"
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
        >
          {isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        </Button>
        {canEdit && (
          <Link href={`/admin/dataservices/edit?id=${dataservice.id}`}>
            <Button
              variant="primary"
              hasIcon={true}
              leadingIcon="agora-line-edit"
              leadingIconHover="agora-solid-edit"
            >
              Editar
            </Button>
          </Link>
        )}
      </div>

      <div className="container grid gap-32 xl:grid-cols-12">
        {/* Main Content Column */}
        <div className="xl:col-span-6 xl:block">
          <div className="flex flex-col gap-4" ref={titleRef}>
            <h1 className="mb-24 text-xl-bold leading-tight text-primary-900">
              {dataservice.title}
            </h1>
          </div>

          <DescriptionWithReadMore
            text={dataservice.description}
            sidebarRef={sidebarRef}
            titleRef={titleRef}
          />
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-6">
          <div className="flex h-fit flex-col" ref={sidebarRef}>
            {/* Identity box */}
            <div className="mb-16 flex flex-col gap-16 rounded-4 bg-[#F2F6FF] p-32">
              {dataservice.organization?.logo ? (
                <div className="flex h-48 w-fit items-center justify-center rounded-8 border-2 border-primary-300 py-8">
                  <img
                    src={dataservice.organization.logo}
                    alt={dataservice.organization.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex w-fit items-center justify-center rounded-8 border border-neutral-200 bg-neutral-100 px-12 py-12 text-neutral-400">
                  <Icon
                    name={dataservice.owner ? "agora-line-user" : "agora-line-buildings"}
                    className="h-6 w-6"
                  />
                </div>
              )}

              <div className="space-y-16">
                <div className="text-m-light text-neutral-900">
                  {dataservice.organization ? (
                    <Link
                      href={`/organizations/${dataservice.organization.slug}`}
                      className="hover:underline"
                    >
                      {dataservice.organization.name}
                    </Link>
                  ) : dataservice.owner ? (
                    <Link href={`/users/${dataservice.owner.slug}`} className="hover:underline">
                      {ownerFullName}
                    </Link>
                  ) : (
                    "Sem autor"
                  )}
                </div>
                {lastUpdate && (
                  <div className="text-sm text-neutral-900">
                    <span className="text-m-semibold">Última atualização:</span> {lastUpdate}
                  </div>
                )}
              </div>
            </div>

            {/* Access conditions box */}
            <div className="mb-16 flex flex-col gap-16 rounded-4 bg-[#F2F6FF] p-32">
              <div className="text-m-semibold text-neutral-500">Condições de Acesso</div>

              <div className="text-sm text-neutral-900">
                <div className="mb-4">Acesso</div>
                {accessPillLabel ? (
                  <Pill variant={accessPillVariant}>{accessPillLabel}</Pill>
                ) : (
                  NOT_PROVIDED
                )}
              </div>

              <div className="text-sm text-neutral-900">
                <div className="mb-4">Autenticação</div>
                <div className="text-m-semibold">{authLabel ?? NOT_PROVIDED}</div>
              </div>

              {accessType === "restricted" && (
                <div className="text-sm text-neutral-900">
                  <div className="mb-4">Públicos elegíveis</div>
                  {audiences.length > 0 ? (
                    <ul className="list-disc pl-20">
                      {audiences.map((a) => (
                        <li key={a.role}>
                          {AUDIENCE_ROLE_LABELS[a.role] ?? a.role}:{" "}
                          {AUDIENCE_CONDITION_LABELS[a.condition] ?? a.condition}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "Não especificado"
                  )}
                </div>
              )}
              {restrictionReason && (
                <div className="text-sm text-neutral-900">
                  <span className="text-m-semibold">Motivo da restrição:</span>{" "}
                  {restrictionReason}
                </div>
              )}
              {dataservice.authorization_request_url && (
                <div>
                  <Button
                    variant="primary"
                    hasIcon={true}
                    trailingIcon="agora-line-external-link"
                    trailingIconHover="agora-solid-external-link"
                    onClick={() =>
                      window.open(
                        dataservice.authorization_request_url as string,
                        "_blank"
                      )
                    }
                  >
                    Pedir acesso
                  </Button>
                </div>
              )}
            </div>

            {/* Technical characteristics box */}
            {hasTechnical && (
            <div className="mb-16 flex flex-col gap-16 rounded-4 bg-[#F2F6FF] p-32">
              <div className="text-m-semibold text-neutral-500">Características técnicas</div>

              {dataservice.base_api_url && (
                <div className="text-sm text-neutral-900">
                  <div className="mb-4">URL base da API</div>
                  <div className="rounded-4 bg-neutral-200 px-12 py-8 font-mono text-sm break-all text-neutral-900">
                    {dataservice.base_api_url}
                  </div>
                </div>
              )}
              {dataservice.rate_limiting && (
                <div className="text-sm text-neutral-900">
                  <div className="mb-4">Limite de chamadas</div>
                  {dataservice.rate_limiting_url ? (
                    <TextLink href={dataservice.rate_limiting_url}>
                      {dataservice.rate_limiting}
                    </TextLink>
                  ) : (
                    <span className="text-m-semibold">{dataservice.rate_limiting}</span>
                  )}
                </div>
              )}
              {dataservice.availability != null && (
                <div className="text-sm text-neutral-900">
                  <div className="mb-4">Disponibilidade</div>
                  <span className="text-m-semibold">{`${dataservice.availability}%`}</span>
                </div>
              )}

              {(dataservice.technical_documentation_url ||
                dataservice.business_documentation_url) && (
                <div className="text-sm text-neutral-900">
                  <div className="mb-8">Documentação</div>
                  <div className="flex flex-col items-start gap-8">
                    {dataservice.technical_documentation_url && (
                      <Button
                        appearance="outline"
                        variant="neutral"
                        hasIcon={true}
                        trailingIcon="agora-line-external-link"
                        trailingIconHover="agora-solid-external-link"
                        onClick={() =>
                          window.open(
                            dataservice.technical_documentation_url as string,
                            "_blank"
                          )
                        }
                      >
                        Documentação técnica
                      </Button>
                    )}
                    {dataservice.business_documentation_url && (
                      <Button
                        appearance="outline"
                        variant="neutral"
                        hasIcon={true}
                        trailingIcon="agora-line-external-link"
                        trailingIconHover="agora-solid-external-link"
                        onClick={() =>
                          window.open(
                            dataservice.business_documentation_url as string,
                            "_blank"
                          )
                        }
                      >
                        Documentação funcional
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Metrics */}
            <div className="mb-16 grid grid-cols-2 gap-16">
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-sm mb-8">Visualizações</div>
                <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                  {formatMetricValue(dataservice.metrics?.views)}
                </div>
              </div>
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-sm mb-8">Favoritos</div>
                <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                  {formatMetricValue(dataservice.metrics?.followers)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tabs: Informações (inc. informações técnicas) + Discussões */}
      <section className="w-full">
        <DataserviceTabs dataservice={dataservice} />
      </section>
    </main>
  );
}
