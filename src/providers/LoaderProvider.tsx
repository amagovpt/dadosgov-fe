"use client";

import { createContext, useState, ReactNode } from 'react';
import { LoaderDialogProvider } from "@ama-pt/agora-design-system";
import Loader from '@/components/Primitives/Loader';

interface LoaderContextType {
  showLoader: () => void;
  hideLoader: () => void;
  isVisible: boolean;
}

export const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const showLoader = () => {
    setIsVisible(true);
  };

  const hideLoader = () => {
    setIsVisible(false);
  };

  return (
    <LoaderDialogProvider>
      <LoaderContext.Provider value={{ showLoader, hideLoader, isVisible }}>
        {children}
        <Loader isVisible={isVisible} />
      </LoaderContext.Provider>
    </LoaderDialogProvider>
  );
}
