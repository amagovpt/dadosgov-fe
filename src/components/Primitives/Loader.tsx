"use client";

import { useEffect, useState } from "react";
import { useLoaderDialogContext } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

interface LoaderProps {
  isVisible: boolean;
}

export default function Loader({ isVisible }: LoaderProps) {
  const { showLoader: showLoaderContext, hideLoader: hideLoaderContext } =
    useLoaderDialogContext();
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(5);
  const [wasVisible, setWasVisible] = useState(false);

  useEffect(() => {
    if (isVisible && seconds > 0) {
      const timer = setTimeout(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [seconds, isVisible]);

  useEffect(() => {
    if (isVisible && !wasVisible) {
      setSeconds(5);
      setWasVisible(true);
    } else if (!isVisible && wasVisible) {
      setSeconds(5);
      setWasVisible(false);
      hideLoaderContext();
    }
  }, [isVisible, wasVisible, hideLoaderContext]);

  useEffect(() => {
    if (isVisible && wasVisible) {
      showLoaderContext({
        id: `loader-${+new Date()}`,
        title: t("loading.title"),
        subtitle: seconds > 0 ? t("loading.description", { seconds }) : t("loading.descriptionWithoutSeconds"),
      });
    }
  }, [isVisible, wasVisible, seconds, showLoaderContext, t]);

  return null;
}
