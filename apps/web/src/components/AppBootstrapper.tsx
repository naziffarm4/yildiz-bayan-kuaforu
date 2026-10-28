"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

export const AppBootstrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const bootstrapApp = useAppStore((s) => s.bootstrapApp);
  const initAppRealtimeSync = useAppStore((s) => s.initAppRealtimeSync);

  useEffect(() => {
    bootstrapApp();
    const cleanup = initAppRealtimeSync();
    return cleanup;
  }, [bootstrapApp, initAppRealtimeSync]);

  return <>{children}</>;
};
