"use client";

import { LoaderContext } from '@/providers/LoaderProvider';
import { useContext } from 'react';

export function useLoader() {
  const context = useContext(LoaderContext);
  
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  
  return context;
}
