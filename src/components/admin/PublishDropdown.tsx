"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@ama-pt/agora-design-system";
import { useAuth } from "@/context/AuthContext";
import AppIcon from "../Primitives/AppIcon";
import { useTranslation } from "react-i18next";

interface PublishDropdownProps {
  darkMode?: boolean;
  outline?: boolean;
}

export default function PublishDropdown({
  darkMode = false,
  outline = true,
}: PublishDropdownProps) {
  const { t } = useTranslation("common");

  const router = useRouter();
  const { hasOrganization } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const PUBLISH_ITEMS = [
    {
      icon: "agora-line-layers-menu",
      label: t("publishSelection.dataset"),
      href: "/admin/datasets/new",
    },
    {
      icon: null as string | null,
      customIcon: "/Icons/api.svg",
      label: t("publishSelection.api"),
      href: "/admin/dataservices/new",
    },
    {
      icon: "agora-line-share",
      label: t("publishSelection.reuse"),
      href: "/admin/reuses/new",
    },
    {
      icon: null as string | null,
      customIcon: "/Icons/harvester.svg",
      label: t("publishSelection.harvester"),
      href: "/admin/harvesters/new",
    },
    {
      icon: "agora-line-buildings",
      label: t("publishSelection.organization"),
      href: "/admin/organizations/new?step=1",
    },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <Button
        variant="primary"
        appearance={outline ? "outline" : undefined}
        className="!bg-white hover:!text-primary-900 [&_.icon]:hover:!fill-primary-900"
        darkMode={darkMode}
        hasIcon={true}
        trailingIcon={showDropdown ? "agora-line-chevron-up" : "agora-line-chevron-down"}
        trailingIconHover={showDropdown ? "agora-solid-chevron-up" : "agora-solid-chevron-down"}
        onClick={() => setShowDropdown((v) => !v)}
      >
        <span className="text-lg font-medium">
          {t("publish")} <span className="font-bold">dados.gov.pt</span>
        </span>
      </Button>
      {showDropdown && (
        <div className="shadow-lg absolute left-0 z-10 mt-8 max-w-256 rounded-4 border-1 bg-white py-8">
          {PUBLISH_ITEMS.map((item, index) => (
            <button
              key={index}
              className="flex w-full items-center gap-8 text-nowrap border-b-2 border-b-neutral-200 p-16 text-left last-of-type:border-none hover:bg-primary-50"
              onClick={() => {
                setShowDropdown(false);
                router.push(item.href);
              }}
            >
              {item.icon ? (
                <AppIcon name={item.icon} className="h-24 w-24 text-primary-600" />
              ) : (
                <img
                  src={item.customIcon!}
                  alt=""
                  className="h-24 w-24"
                  style={{
                    filter:
                      "invert(22%) sepia(93%) saturate(2500%) hue-rotate(215deg) brightness(95%) contrast(105%)",
                  }}
                  aria-hidden="true"
                />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
