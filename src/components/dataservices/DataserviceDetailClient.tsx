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

interface DataserviceDetailClientProps {
  slug: string;
}

const ACCESS_TYPE_LABELS: Record<string, string> = {
  open: "Download gratuito",
  open_with_account: "Aberto sob certas condições",
  restricted: "Acesso mediante autorização",
};

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
    async function loadDataservice() {
      try {
        const data = await fetchDataservice(slug);
        setDataservice(data);
        if (user && data) {
          const following = await isFollowing("dataservices", data.id, user.id);
          setIsFavorite(following);
        }
      } catch (error) {
        console.error("Error loading dataservice:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDataservice();
  }, [slug, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/pages/login");
      return;
    }
    if (!dataservice || isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        const success = await unfollowEntity("dataservices", dataservice.id);
        if (success) setIsFavorite(false);
      } else {
        const result = await followEntity("dataservices", dataservice.id);
        if (result) setIsFavorite(true);
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

  const accessTypeLabel = dataservice.access_type
    ? ACCESS_TYPE_LABELS[dataservice.access_type] ?? dataservice.access_type
    : null;

  return (
    <main className="flex w-full flex-col items-center justify-center gap-64">
      {/* Breadcrumb */}
      <div className="container flex items-center justify-between py-64">
        <Breadcrumb
          items={[
            { label: "Home", url: "/" },
            { label: "APIs", url: "/pages/dataservices" },
            { label: dataservice.title, url: `/pages/dataservices/${dataservice.slug}` },
          ]}
        />
      </div>

      {/* Actions */}
      <div className="container flex items-center justify-end gap-16">
        {dataservice.private && <Pill variant="warning">Rascunho</Pill>}
        {dataservice.archived && <Pill variant="neutral">Arquivado</Pill>}
        <Button
          variant="primary"
          appearance={isFavorite ? "solid" : "outline"}
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
          <Link href={`/pages/admin/dataservices/edit?id=${dataservice.id}`}>
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

          {dataservice.base_api_url && (
            <div className="mt-24">
              <Button
                variant="primary"
                hasIcon={true}
                trailingIcon="agora-line-external-link"
                trailingIconHover="agora-solid-external-link"
                onClick={() => window.open(dataservice.base_api_url as string, "_blank")}
              >
                Aceder à API
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-6">
          <div className="flex h-fit flex-col" ref={sidebarRef}>
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
                <div className="mb-8 text-m-light text-neutral-900">
                  {dataservice.organization ? (
                    <Link
                      href={`/pages/organizations/${dataservice.organization.slug}`}
                      className="hover:underline"
                    >
                      {dataservice.organization.name}
                    </Link>
                  ) : dataservice.owner ? (
                    <Link href={`/pages/users/${dataservice.owner.slug}`} className="hover:underline">
                      {ownerFullName}
                    </Link>
                  ) : (
                    "Sem autor"
                  )}
                </div>
                <div className="text-sm mb-16 text-neutral-900">
                  <span className="text-m-semibold">Última atualização:</span>{" "}
                  {new Date(dataservice.last_modified).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                {accessTypeLabel && (
                  <div className="text-sm text-neutral-900">
                    <span className="text-m-semibold">Método de acesso:</span> {accessTypeLabel}
                  </div>
                )}
                {dataservice.machine_documentation_url && (
                  <div className="text-sm">
                    <TextLink href={dataservice.machine_documentation_url}>
                      <span className="text-m-semibold">Documentação técnica</span>
                    </TextLink>
                  </div>
                )}
                {dataservice.rate_limiting && (
                  <div className="text-sm text-neutral-900">
                    <span className="text-m-semibold">Limites de uso:</span>{" "}
                    {dataservice.rate_limiting_url ? (
                      <TextLink href={dataservice.rate_limiting_url}>
                        {dataservice.rate_limiting}
                      </TextLink>
                    ) : (
                      dataservice.rate_limiting
                    )}
                  </div>
                )}
                {dataservice.availability != null && (
                  <div className="text-sm text-neutral-900">
                    <span className="text-m-semibold">Disponibilidade:</span>{" "}
                    {dataservice.availability}%
                  </div>
                )}
              </div>
            </div>

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

            {/* Linked datasets */}
            {dataservice.datasets && dataservice.datasets.length > 0 && (
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="mb-16 text-m-semibold text-neutral-900">
                  Conjuntos de dados associados
                </div>
                <ul className="flex flex-col gap-8">
                  {dataservice.datasets.map((ds) => (
                    <li key={ds.id}>
                      <TextLink href={ds.page}>{ds.title}</TextLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
