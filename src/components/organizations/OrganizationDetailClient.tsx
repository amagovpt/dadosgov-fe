"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Button,
  Icon,
  Breadcrumb,
  Pill,
  CardArticle,
  InputTextArea,
  StatusCard,
} from "@ama-pt/agora-design-system";
import { Organization } from "@/types/api";
import { OrganizationTabs } from "./OrganizationTabs";
import { useAuth } from "@/context/AuthContext";
import { requestMembership } from "@/api/organizations";
import { followEntity, unfollowEntity, isFollowing } from "@/api/followers";
import { formatMetricValue } from "@/utils/formatNumber";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface OrganizationDetailClientProps {
  organization: Organization;
}

export default function OrganizationDetailClient({ organization }: OrganizationDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestComment, setRequestComment] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const isMember = user?.organizations?.some((org) => org.id === organization.id) ?? false;

  useEffect(() => {
    let cancelled = false;
    async function loadFavoriteState() {
      if (!user) {
        setIsFavorite(false);
        return;
      }
      try {
        const following = await isFollowing("organizations", organization.id, user.id);
        if (!cancelled) setIsFavorite(following);
      } catch (error) {
        console.error("Error loading favorite state:", error);
      }
    }
    loadFavoriteState();
    return () => {
      cancelled = true;
    };
  }, [user, organization.id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push("/pages/login");
      return;
    }
    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      if (isFavorite) {
        await unfollowEntity("organizations", organization.id);
        setIsFavorite(false);
      } else {
        await followEntity("organizations", organization.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleRequestMembership = async () => {
    setIsRequesting(true);
    setRequestError(null);
    try {
      await requestMembership(organization.id, requestComment);
      setRequestSuccess(true);
      setShowRequestForm(false);
      setRequestComment("");
    } catch (error) {
      console.error("Error requesting membership:", error);
      setRequestError("Erro ao enviar o pedido de adesão.");
    } finally {
      setIsRequesting(false);
    }
  };
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [availableHeight, setAvailableHeight] = useState<number | undefined>(undefined);
  const measureRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const READMORE_BUTTON_HEIGHT = 48;

  const checkOverflow = useCallback(() => {
    if (measureRef.current && sidebarRef.current && titleRef.current) {
      const sidebarHeight = sidebarRef.current.offsetHeight;
      const titleHeight = titleRef.current.offsetHeight;
      const fullHeight = measureRef.current.offsetHeight;
      const maxDescHeight = sidebarHeight - titleHeight;
      const overflows = fullHeight > maxDescHeight;
      if (overflows) {
        const lineHeight = parseFloat(getComputedStyle(measureRef.current).lineHeight) || 24;
        const usable = maxDescHeight - READMORE_BUTTON_HEIGHT;
        const snapped = Math.floor(usable / lineHeight) * lineHeight;
        setAvailableHeight(snapped);
      } else {
        setAvailableHeight(maxDescHeight);
      }
      setIsOverflowing(overflows);
    }
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    const observer = new ResizeObserver(checkOverflow);
    if (sidebarRef.current) observer.observe(sidebarRef.current);
    if (measureRef.current) observer.observe(measureRef.current);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      observer.disconnect();
    };
  }, [checkOverflow]);

  return (
    <main className="flex w-full flex-col items-center justify-center gap-24">
      {/* Breadcrumb & Action Section */}
      <div className="container flex items-center justify-between">
        <Breadcrumb
          items={[
            { label: "Home", url: "/" },
            { label: "Organizações", url: "/pages/organizations" },
            { label: organization.name, url: `/pages/organizations/${organization.slug}` },
          ]}
        />
      </div>

      <div className="container flex justify-end gap-12">
        {user && !isMember && !requestSuccess && (
          <Button
            variant="primary"
            appearance="outline"
            hasIcon={true}
            leadingIcon="agora-line-plus-circle"
            leadingIconHover="agora-solid-plus-circle"
            onClick={() => setShowRequestForm(!showRequestForm)}
          >
            Pedir adesão
          </Button>
        )}
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
      </div>

      {requestSuccess && (
        <StatusCard
          variant="success"
          showIcon
          description="Pedido de adesão enviado com sucesso. O administrador da organização irá analisar o seu pedido."
        />
      )}
      {requestError && <StatusCard variant="danger" showIcon description={requestError} />}

      {showRequestForm && (
        <div className="rounded-lg container flex flex-col gap-16 bg-neutral-50 p-24">
          <h3 className="text-base font-semibold text-primary-900">
            Pedir adesão a {organization.name}
          </h3>
          <InputTextArea
            label="Comentário (opcional)"
            placeholder="Explique por que pretende aderir a esta organização..."
            id="membership-comment"
            rows={3}
            value={requestComment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setRequestComment(e.target.value)
            }
          />
          <div className="flex gap-16">
            <Button
              appearance="outline"
              variant="neutral"
              onClick={() => {
                setShowRequestForm(false);
                setRequestComment("");
                setRequestError(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleRequestMembership} disabled={isRequesting}>
              {isRequesting ? "A enviar..." : "Enviar pedido"}
            </Button>
          </div>
        </div>
      )}

      <div className="container flex flex-col gap-32 xl:flex-row">
        {/* Main Content Column */}
        <div className="w-full">
          {/* Title & Header */}
          <div className="flex flex-col gap-4" ref={titleRef}>
            <div className="flex items-start justify-between">
              <h1 className="mb-24 max-w-[592px] text-xl-bold leading-tight text-primary-900">
                {organization.name}
              </h1>
            </div>
          </div>

          {/* Description Section */}
          <div className="text-lg relative mb-12 leading-relaxed text-neutral-700">
            {/* Hidden measure element to get full content height */}
            <div
              ref={measureRef}
              className="pointer-events-none invisible absolute"
              style={{ top: 0, left: 0, right: 0 }}
              aria-hidden="true"
            >
              <div className="markdown-container max-w-[592px] text-m-light text-neutral-900">
                {organization.description ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {organization.description}
                  </ReactMarkdown>
                ) : (
                  <p>Esta organização não possui descrição.</p>
                )}
              </div>
              <div className="mt-8">
                <h3 className="text-xl mb-16 font-bold text-primary-900">
                  Observações preliminares
                </h3>
                <p className="mb-16 max-w-[592px] text-neutral-900">
                  Informações adicionais sobre o papel desta organização na gestão e publicação de
                  dados abertos.
                </p>
              </div>
              <div className="mt-8">
                <h3 className="text-xl mb-16 font-bold text-primary-900">
                  Sobre a organização
                </h3>
                <p className="max-w-[592px] text-neutral-900">
                  {organization.name} é um publicador ativo no Portal de Dados Abertos, contribuindo
                  para a transparência e reutilização de informação pública em Portugal.
                </p>
              </div>
            </div>
            <div
              className="overflow-hidden"
              style={
                !expanded && isOverflowing && availableHeight
                  ? { maxHeight: availableHeight }
                  : undefined
              }
            >
              <div className="markdown-container max-w-[592px] text-m-light text-neutral-900">
                {organization.description ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {organization.description}
                  </ReactMarkdown>
                ) : (
                  <p>Esta organização não possui descrição.</p>
                )}
              </div>

              {/* Static sections to mirror dataset page as requested (copy) */}
              <div className="mt-8">
                <h3 className="text-xl mb-16 font-bold text-primary-900">
                  Observações preliminares
                </h3>
                <p className="mb-16 max-w-[592px] text-neutral-900">
                  Informações adicionais sobre o papel desta organização na gestão e publicação de
                  dados abertos.
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-xl mb-16 font-bold text-primary-900">
                  Sobre a organização
                </h3>
                <p className="max-w-[592px] text-neutral-900">
                  {organization.name} é um publicador ativo no Portal de Dados Abertos, contribuindo
                  para a transparência e reutilização de informação pública em Portugal.
                </p>
              </div>
            </div>
            {isOverflowing && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-8 flex cursor-pointer items-center gap-8 text-primary-600 hover:underline"
              >
                {expanded ? "Ler menos" : "Ler mais"}
                {expanded ? (
                  <Icon name="agora-line-arrow-up-circle" className="h-24 w-24" />
                ) : (
                  <Icon name="agora-line-arrow-down-circle" className="h-24 w-24" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="w-full">
          <div
            className="card-article-3_2 organization_detail flex h-fit flex-col"
            ref={sidebarRef}
          >
            <CardArticle
              className="card-detail-info mb-16 rounded-4 border-none bg-[#F2F6FF] p-32 shadow-none"
              subtitle={
                <div className="flex flex-col gap-16">
                  {organization.logo ? (
                    <div className="card-article-3_2-img flex h-48 w-fit items-center justify-center rounded-8 border-2 border-primary-300 py-8">
                      <img
                        src={organization.logo}
                        alt={organization.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex w-fit items-center justify-center rounded-8 border border-neutral-200 bg-neutral-100 px-12 py-6 text-neutral-400">
                      <Icon name="agora-line-building" className="h-6 w-6" />
                    </div>
                  )}
                  <div className="mb-8 text-m-light text-neutral-900">Organização</div>
                </div>
              }
            >
              <div className="space-y-16">
                <div className="text-sm mb-16 text-neutral-900">
                  <span className="text-m-semibold">Última atualização:</span>{" "}
                  {new Date(organization.last_modified).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                {/* <div className="pt-8">
                    <div className="text-neutral-900 text-sm font-medium">
                      <span className="text-m-semibold">Tipo:</span> Publicador Oficial
                    </div>
                  </div> */}
              </div>
            </CardArticle>

            {/* Metrics Box */}
            <div className="mb-16 grid grid-cols-2 gap-16">
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-sm mb-8">Visualizações</div>
                <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                  {formatMetricValue(organization.metrics?.views)}
                </div>
                <div className="gap-1 mb-8 flex items-center">
                  <Pill appearance="outline" variant="success" className="h-auto">
                    +{formatMetricValue(organization.metrics?.views, 2)} total
                  </Pill>
                </div>
                <div className="text-xs mt-1 text-neutral-900">
                  desde{" "}
                  {organization.created_at
                    ? format(new Date(organization.created_at), "MMMM 'de' yyyy", {
                        locale: pt,
                      })
                    : "—"}
                </div>
              </div>
              <div className="rounded-4 bg-[#F2F6FF] p-32">
                <div className="text-sm mb-8">Seguidores</div>
                <div className="mb-8 text-l-semibold font-bold text-neutral-900">
                  {formatMetricValue(organization.metrics?.followers)}
                </div>
                <div className="gap-1 mb-8 flex items-center">
                  <Pill appearance="outline" variant="success" className="h-auto">
                    +{formatMetricValue(organization.metrics?.followers, 2)} total
                  </Pill>
                </div>
                <div className="text-xs mt-1 text-neutral-900">
                  desde{" "}
                  {organization.created_at
                    ? format(new Date(organization.created_at), "MMMM 'de' yyyy", {
                        locale: pt,
                      })
                    : "—"}
                </div>
              </div>
            </div>

            {/* Quality Box (Copying from dataset page)
              <div className="bg-[#F2F6FF] rounded-4 p-32 mb-16">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-l-semibold font-bold text-neutral-900 mb-8">Qualidade dos metadados</h3>
                </div>
                <div className="quality-progress-success">
                  <ProgressBar value={100} />
                </div>
                <div className="text-xs text-neutral-500 mt-8">
                  100% de conformidade média
                </div>
                <div className="flex justify-start items-center text-sm text-primary-600 mt-24">
                  <Icon name="agora-line-info-mark" className="w-24 h-24 cursor-pointer mr-8 fill-primary-600" />
                  <a href="#" className="hover:underline font-medium">Saiba mais sobre este indicador</a>
                </div>
              </div> */}
          </div>
        </div>
      </div>

      {/* <div className="bg-primary-100 p-32 rounded-lg mb-8">
          <h3 className="text-l-semibold font-bold text-neutral-900 mb-24 max-w-[592px]">
            Está à procura do preço de venda de um imóvel ou terreno?
          </h3>
          <div className="flex flex-col gap-4">
            <p className="font-semibold mb-16">
              O aplicativo "Dados de Valorização de Terrenos (DVF)" permite acessar informações claras sobre imóveis vendidos a partir do banco de dados da Direção Geral de Finanças Públicas.
            </p>
            <a href="#" className="text-xs text-primary-600 hover:underline inline-flex items-center gap-8 mr-4 max-w-[592px]">
              Consulte o aplicativo "Dados de Valor de Terreno (DVF)"
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="icon icon-m fill-[var(--color-primary-600)] w-32 h-32" aria-hidden="true" role="img"><path d="M11.2929 8.70711C10.9024 8.31658 10.9024 7.68342 11.2929 7.29289C11.6834 6.90237 12.3166 6.90237 12.7071 7.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L12.7071 16.7071C12.3166 17.0976 11.6834 17.0976 11.2929 16.7071C10.9024 16.3166 10.9024 15.6834 11.2929 15.2929L13.5858 13H8C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11H13.5858L11.2929 8.70711Z"></path><path fillRule="evenodd" clip-rule="evenodd" d="M12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z"></path></svg>
            </a>
          </div>
        </div> */}

      {/* Tabs Section */}
      <OrganizationTabs organization={organization} />
    </main>
  );
}
