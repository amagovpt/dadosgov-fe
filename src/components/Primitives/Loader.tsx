"use client";

import { useEffect, useRef, useState } from "react";
import { useLoaderDialogContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

interface LoaderProps {
  isVisible: boolean;
}

export default function Loader({ isVisible }: LoaderProps) {
  const { showLoader: showLoaderContext, hideLoader: hideLoaderContext } = useLoaderDialogContext();
  const { t } = useTranslation("common");
  const [seconds, setSeconds] = useState(5);
  const [previousVisible, setPreviousVisible] = useState(isVisible);
  const wasVisible = useRef(false);

  if (isVisible !== previousVisible) {
    setPreviousVisible(isVisible);
    setSeconds(5);
  }

  useEffect(() => {
    if (isVisible && seconds > 0) {
      const timer = setTimeout(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [seconds, isVisible]);

  useEffect(() => {
    if (!isVisible && wasVisible.current) {
      hideLoaderContext();
    }
    wasVisible.current = isVisible;
  }, [isVisible, hideLoaderContext]);

  useEffect(() => {
    if (isVisible) {
      showLoaderContext({
        id: `loader-${+new Date()}`,
        title: t("pageLoader.title"),
        subtitle:
          seconds > 0
            ? t("pageLoader.description", { seconds })
            : t("pageLoader.descriptionWithoutSeconds"),
      });
    }
  }, [isVisible, seconds, showLoaderContext, t]);

  return null;
}
