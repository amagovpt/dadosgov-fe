"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@ama-pt/agora-design-system";
import { useAuth } from "@/context/AuthContext";
import AppIcon from "../Primitives/AppIcon";

interface PublishDropdownProps {
  darkMode?: boolean;
  outline?: boolean;
}

export default function PublishDropdown({ darkMode = false, outline = true }: PublishDropdownProps) {
  const router = useRouter();
  const { hasOrganization } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const PUBLISH_ITEMS = [
    {
      icon: "agora-line-layers-menu",
      label: "Um conjunto de dados",
      href: "/admin/datasets/new",
    },
    {
      icon: null as string | null,
      customIcon: "/Icons/api.svg",
      label: "Uma API",
      href: "/admin/dataservices/new",
    },
    {
      icon: "agora-line-share",
      label: "Uma reutilização",
      href: "/admin/reuses/new",
    },
    {
      icon: null as string | null,
      customIcon: "/Icons/harvester.svg",
      label: "Um harvester",
      href: "/admin/harvesters/new",
    },
    {
      icon: "agora-line-buildings",
      label: "Uma organização",
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
          Publicar <span className="font-bold">dados.gov.pt</span>
        </span>
      </Button>
      {showDropdown && (
        <div className="absolute left-0 mt-8 bg-white border-1 rounded-4 shadow-lg py-8 z-10 max-w-256">
          {PUBLISH_ITEMS.map((item, index) => (
            <button
              key={index}
              className="flex items-center gap-8 w-full text-left text-nowrap p-16 border-b-2 border-b-neutral-200 last-of-type:border-none hover:bg-primary-50"
              onClick={() => {
                setShowDropdown(false);
                router.push(item.href);
              }}
            >
              {item.icon ? (
                <AppIcon name={item.icon} className="w-24 h-24 text-primary-600" />
              ) : (
                <img
                  src={item.customIcon!}
                  alt=""
                  className="w-24 h-24"
                  style={{ filter: "invert(22%) sepia(93%) saturate(2500%) hue-rotate(215deg) brightness(95%) contrast(105%)" }}
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
