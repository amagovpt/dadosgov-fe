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

/** Link de nível 1 (top-level ou título de secção que também navega): a bold. */
function TopLink({ node, active }: { node: SitemapNode; active: boolean }) {
  return (
    <span className={`flex flex-col ${!active && 'xl:pl-32'}`}>
      <Anchor
        appearance="link"
        variant="neutral"
        href={node.href}
        aria-current={active ? "page" : undefined}
        {...externalProps(node)}
        className={`!justify-start !px-16 !py-16 [&_.children-wrapper]:!text-m-bold ${active
          ? "bg-primary-100 border-l-4 border-l-primary-600 [&_.children-wrapper]:!text-primary-600"
          : ""
          }`}
      >
        {node.label}
      </Anchor>
    </span>
  );
}

/** Sub-página (children): indentada, peso normal, cor mais suave. */
function SubLink({ node, active }: { node: SitemapNode; active: boolean }) {
  return (
    <span className={`flex flex-col ${!active && 'xl:pl-32'}`}>
      <Anchor
        appearance="link"
        variant="neutral"
        href={node.href}
        aria-current={active ? "page" : undefined}
        {...externalProps(node)}
        className={`!justify-start !px-16 !py-16 pl-32 [&_.children-wrapper]:!text-m-regular ${active
          ? "bg-primary-100 border-l-4 border-l-primary-600 [&_.children-wrapper]:!text-primary-600"
          : "[&_.children-wrapper]:!text-neutral-700"
          }`}
      >
        {node.label}
      </Anchor>
    </span>
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
      <div className="xl:pl-56 flex w-full max-w-md flex-col">
        {nodes.map((node) =>
          node.children?.length ? (
            <div key={node.id} className="flex flex-col">
              {node.href ? (
                <TopLink node={node} active={isActive(node.href)} />
              ) : (
                <span className="pl-48 py-16 text-m-bold text-neutral-900">{node.label}</span>
              )}
              {node.children.map((child) => (
                <span className="flex flex-col ml-16" key={child.id}>
                  <SubLink node={child} active={isActive(child.href)} />
                </span>
              ))}
            </div>
          ) : node.href ? (
            <TopLink key={node.id} node={node} active={isActive(node.href)} />
          ) : (
            <span key={node.id} className="px-16 py-16 text-m-bold text-neutral-900">
              {node.label}
            </span>
          )
        )}
      </div>
    </nav>
  );
}
