import initTranslations from "@/app/i18n";
import HeroGeneral from "@/components/HeroGeneral";
import SiteMapTree from "@/components/Shared/SiteMap/SiteMapTree";
import { getHeaderNavigation } from "@/service/commom/header";
import { getFrontOfficeMetadata, getFrontOfficePage } from "@/service/queries/common";
import { FrontOfficePage } from "@/service/types/shared/common";
import { buildSitemap, type SitemapNode } from "@/utils/buildSitemap";
import { stripHtmlTags } from "@/utils/htmlToParagraphs";
import dayjs from "dayjs";
import { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;

    try {
        const metadata = await getFrontOfficeMetadata("sitemap", locale);

        return {
            title: metadata.title,
            description: stripHtmlTags(metadata.description),
        };
    } catch (error) {
        // Fall back to the layout's default title/description rather than failing
        // the whole page render when the CMS is unreachable.
        console.error("Error fetching datasets metadata:", error);
        return {};
    }
}


export default async function Sitemap({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const { t } = await initTranslations({ locale, namespaces: ["common"] });
    let pageContent: FrontOfficePage | undefined;
    try {
        pageContent = await getFrontOfficePage("datasets", locale);
    } catch (error) {
        console.error("Error fetching datasets page content:", error);
    }

    const footerPages: SitemapNode[] = [
        { id: "footer-areas-tematicas", label: t("breadcrumbs.areas-tematicas"), href: "/areas-tematicas" },
        { id: "footer-noticias", label: t("breadcrumbs.noticias"), href: "/noticias" },
        { id: "footer-roadmap", label: t("breadcrumbs.roadmap"), href: "/roadmap" },
        { id: "footer-ajuda-e-contactos", label: t("breadcrumbs.ajuda-e-contactos"), href: "/ajuda-e-contactos" },
        { id: "footer-termos-de-utilizacao", label: t("breadcrumbs.termos-de-utilizacao"), href: "/termos-de-utilizacao" },
        { id: "footer-sitemap", label: t("breadcrumbs.sitemap"), href: "/sitemap" },
    ];

    const { dropdowns, topLevelLinks } = await getHeaderNavigation(locale);

    const sitemap = [{ id: "home", label: t("breadcrumbs.home"), href: "/" }, ...buildSitemap({ topLevelLinks, dropdowns }), ...footerPages];

    return (
        <main className="flex flex-col">
            <HeroGeneral
                title={
                    <span className="text-white flex flex-col items-start leading-tight">
                        {pageContent?.hero.title}
                    </span>
                }
                subtitle={
                    <div className="flex flex-col gap-32">
                        <span className="text-white text-m-regular">
                            {stripHtmlTags(pageContent?.hero.description)}
                        </span>
                        <span className="text-white text-m-regular">
                            {t("updatedAt", {
                                date: dayjs(pageContent?.metadata.createdAt).format("DD.MM.YYYY"),
                            })}
                        </span>
                    </div>
                }
            />
            <div className="flex flex-col justify-center items-center py-64 ">
                <div className="container flex flex-row gap-32">
                    <div className="w-full">
                        <SiteMapTree nodes={sitemap} />
                    </div>
                    <div className="w-full xl:flex justify-center items-center hidden">
                        <Image src={"/sitemap-bg.png"} alt="" width={386} height={592} />
                    </div>
                </div>
            </div>
        </main>
    )
}
