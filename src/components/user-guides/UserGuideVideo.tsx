"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import Anchor from "@/components/Shared/Anchor";
import type { UserGuideTask } from "@/service/types/user-guides";
import { getAssets } from "@/utils/getAssets";
import { toVideoEmbedUrl } from "@/utils/videoEmbed";

interface UserGuideVideoProps {
  task: Pick<UserGuideTask, "title" | "videoUrl" | "video" | "mediaCaption">;
}

export function hasUserGuideMedia(task: UserGuideVideoProps["task"]): boolean {
  return Boolean(task.videoUrl || task.video.length > 0);
}

/**
 * Media of a guide task: a YouTube/Vimeo URL is embedded (only those hosts are allowed by the
 * CSP `frame-src`), any other URL becomes a link, and an uploaded asset renders as a native
 * `<video>` or an image served through the `/assets` proxy.
 */
export function UserGuideVideo({ task }: UserGuideVideoProps) {
  const { t } = useTranslation("user-guides");
  const title = task.mediaCaption || t("videoFallbackTitle", { title: task.title });
  const embedUrl = toVideoEmbedUrl(task.videoUrl);
  const asset = task.video[0];

  if (embedUrl) {
    return (
      <div className="relative w-full aspect-video bg-neutral-900">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (asset) {
    const src = getAssets(asset.slug || asset.id);
    if (asset.mimeType.startsWith("video/")) {
      return (
        <video controls preload="metadata" className="w-full bg-neutral-900" aria-label={title}>
          <source src={src} type={asset.mimeType} />
        </video>
      );
    }
    return (
      <Image
        src={src}
        alt={title}
        width={1024}
        height={576}
        unoptimized
        className="w-full h-auto"
      />
    );
  }

  if (task.videoUrl) {
    return (
      <Anchor
        href={task.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        appearance="link"
        hasIcon
        trailingIcon="agora-line-external-link"
      >
        {t("watchVideo")}
      </Anchor>
    );
  }

  return null;
}
