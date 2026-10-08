import React, { createContext, useContext, useMemo, useState } from 'react';

type CatalogMode = 'all' | 'recent';
type ConsoleUiContextValue = {
  catalogOpen: boolean;
  catalogMode: CatalogMode;
  openCatalog: (mode?: CatalogMode) => void;
  closeCatalog: () => void;
};

const ConsoleUiContext = createContext<ConsoleUiContextValue | undefined>(undefined);

export const ConsoleUiProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('all');
  const value = useMemo(() => ({
    catalogOpen,
    catalogMode,
    openCatalog: (mode: CatalogMode = 'all') => {
      setCatalogMode(mode);
      setCatalogOpen(true);
    },
    closeCatalog: () => setCatalogOpen(false),
  }), [catalogOpen, catalogMode]);
  return <ConsoleUiContext.Provider value={value}>{children}</ConsoleUiContext.Provider>;
};

export function useConsoleUi() {
  const value = useContext(ConsoleUiContext);
  if (!value) throw new Error('ConsoleUiProvider is missing');
  return value;
}
