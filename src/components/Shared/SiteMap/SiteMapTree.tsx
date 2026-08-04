"use client";

import { Anchor } from "@ama-pt/agora-design-system";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { stripLocale } from "@/utils/stripLocale";
import type { SitemapNode } from "@/utils/buildSitemap";

interface SiteMapTreeProps {
  nodes: SitemapNode[];
  title?: string;
}

const externalProps = (node: SitemapNode) =>
  node.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

function SiteMapNode({
  node,
  depth,
  isActive,
}: {
  node: SitemapNode;
  depth: number;
  isActive: (href?: string) => boolean;
}) {
  const active = isActive(node.href);
  const isTop = depth === 0;
  const weightClass = isTop
    ? "[&_.children-wrapper]:!text-m-bold"
    : "[&_.children-wrapper]:!text-m-regular";

  return (
    <li className="flex flex-col">
      {node.href ? (
        <span className="flex flex-col">
          <Anchor
            appearance="link"
            variant="neutral"
            href={node.href}
            aria-current={active ? "page" : undefined}
            {...externalProps(node)}
            className={`!justify-start !px-16 !py-16 ${weightClass} ${
              active
                ? "bg-primary-100 border-l-4 border-l-primary-600 [&_.children-wrapper]:!text-primary-600"
                : isTop
                  ? ""
                  : "[&_.children-wrapper]:!text-neutral-700"
            }`}
          >
            {node.label}
          </Anchor>
        </span>
      ) : (
        <span
          className={`px-16 py-16 ${
            isTop ? "text-m-bold text-neutral-900" : "text-m-regular text-neutral-700"
          }`}
        >
          {node.label}
        </span>
      )}

      {node.children?.length ? (
        <ul className="flex flex-col pl-24">
          {node.children.map((child) => (
            <SiteMapNode key={child.id} node={child} depth={depth + 1} isActive={isActive} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function SiteMapTree({ nodes, title }: SiteMapTreeProps) {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const currentPath = stripLocale(pathname);
  const isActive = (href?: string) => !!href && stripLocale(href) === currentPath;

  if (!nodes.length) return null;

  return (
    <nav aria-label={title ?? t("breadcrumbs.sitemap")} className="container flex flex-col gap-16">
      {title && <span className="text-l-bold">{title}</span>}
      <ul className="xl:pl-56 flex w-full max-w-md flex-col">
        {nodes.map((node) => (
          <SiteMapNode key={node.id} node={node} depth={0} isActive={isActive} />
        ))}
      </ul>
    </nav>
  );
}
