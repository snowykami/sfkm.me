import React, { createContext, useContext, useMemo } from "react";
import { apps, AppMeta } from "@/apps/index"; // 从单独的 apps 文件导入

interface AppContextValue {
  apps: AppMeta[];
  getAppById: (id: string) => AppMeta | undefined;
}

const AppContext = createContext<AppContextValue>({
  apps,
  getAppById: (id: string) => apps.find((app) => app.id === id),
});

export const useApps = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const getAppById = (id: string) => apps.find((app) => app.id === id);

  const value = useMemo(
    () => ({
      apps,
      getAppById,
    }),
    [],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
