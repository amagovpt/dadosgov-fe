"use client";

import { CardGeneral, ProgressBar } from "@ama-pt/agora-design-system";
import Link from "next/link";
import Icon from "../../Primitives/Icon";

export type CardMetricsProps = {
    link: string;
    title: string;
    description: string;
    last_modified?: string;
    organization?: {
        name: string;
        logo?: string;
    };
    quality?: {
        score: number;
    };
    metrics?: {
        views?: number;
        resources_downloads?: number;
        reuses?: number;
        followers?: number;
    };
    hideProgressBar?: boolean;
};

export default function CardMetrics({
    link,
    title,
    description,
    last_modified,
    organization,
    quality,
    metrics,
    hideProgressBar = false,
}: CardMetricsProps) {
    const qualityScore = quality?.score != null ? Math.round(quality.score * 100) : 0;

    const formatMetric = (value: number | undefined) => {
        if (!value) return "0";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(".", ",") + " M";
        if (value >= 1_000) return (value / 1_000).toFixed(0) + " mil";
        return String(value);
    };

    return (
        <Link
            href={link}
            className="card-general-listing rounded-4 overflow-hidden h-full flex flex-col"
        >
            <CardGeneral
                variant="white"
                image={{
                    src: organization?.logo || "/images/placeholders/organization.png",
                    alt: organization?.name || "Organização",
                    height: "56px",
                    className: "bg-primary-100 !object-contain !h-[56px]",
                }}
                subtitleText={
                    <div className="flex flex-col">
                        <span style={{ fontSize: "16px" }} className="text-neutral-900">
                            {last_modified}
                        </span>
                        <span style={{ fontSize: "16px", fontWeight: 300 }} className="text-neutral-900 mt-4">
                            {organization?.name || "Sem Organização"}
                        </span>
                    </div>
                }
                titleText={title}
                descriptionText={
                    <div className="flex flex-col grow">
                        <p className="text-m-regular text-neutral-800 line-clamp-3 mb-16">{description}</p>
                        <div
                            className={`mt-auto ${qualityScore <= 45 ? "quality-progress-warning" : qualityScore > 50 ? "quality-progress-success" : ""}`}
                        >
                            {!hideProgressBar && (<>
                                <ProgressBar
                                    value={qualityScore}
                                    max={100}
                                    hideLabel={true}
                                    hidePercentageValue={true}
                                />
                                <span className="text-s-regular text-neutral-900 mt-4 block">
                                    {qualityScore}% Qualidade dos metadados
                                </span>
                            </>)}
                            <div className="flex items-center flex-wrap gap-8 text-xs mt-12 text-neutral-700">
                                <div className="flex items-center gap-8" title="Visualizações">
                                    <Icon
                                        name="agora-solid-eye"
                                        dimensions="xs"
                                        className="fill-neutral-700"
                                        aria-hidden="true"
                                    />
                                    <span>{formatMetric(metrics?.views)}</span>
                                </div>
                                <div className="flex items-center gap-8" title="Downloads">
                                    <Icon
                                        name="agora-solid-download"
                                        dimensions="xs"
                                        className="fill-neutral-700"
                                        aria-hidden="true"
                                    />
                                    <span>{formatMetric(metrics?.resources_downloads)}</span>
                                </div>
                                <div className="flex items-center gap-8" title="Reutilizações">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        className="w-16 h-16 fill-neutral-700"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 22.9091V15.2727C4 14.6702 4.47969 14.1818 5.07143 14.1818C5.66316 14.1818 6.14286 14.6702 6.14286 15.2727V22.9091C6.14286 23.5116 5.66316 24 5.07143 24C4.47969 24 4 23.5116 4 22.9091ZM10.4286 22.9091V1.09091C10.4286 0.488417 10.9083 0 11.5 0C12.0917 0 12.5714 0.488417 12.5714 1.09091V22.9091C12.5714 23.5116 12.0917 24 11.5 24C10.9083 24 10.4286 23.5116 10.4286 22.9091ZM16.8571 22.9091V9.81818C16.8571 9.21569 17.3368 8.72727 17.9286 8.72727C18.5203 8.72727 19 9.21569 19 9.81818V22.9091C19 23.5116 18.5203 24 17.9286 24C17.3368 24 16.8571 23.5116 16.8571 22.9091Z" />
                                    </svg>
                                    <span>{metrics?.reuses || 0}</span>
                                </div>
                                <div className="flex items-center gap-8" title="Favoritos">
                                    <Icon
                                        name="agora-solid-star"
                                        dimensions="xs"
                                        className="fill-neutral-700"
                                        aria-hidden="true"
                                    />
                                    <span>{formatMetric(metrics?.followers)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 text-primary-600 mt-8">
                                <Icon
                                    name="agora-line-arrow-right-circle"
                                    className="w-32 h-32"
                                    aria-hidden="true"
                                />
                            </div>
                        </div>
                    </div>
                }
                isBlockedLink={true}
                anchor={{
                    href: link,
                }}
            />
        </Link>
    );
}
