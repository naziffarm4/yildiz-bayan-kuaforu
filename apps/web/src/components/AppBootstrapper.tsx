"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { PageLoader } from "./PageLoader";

export const AppBootstrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isInitialLoaded = useAppStore((s) => s.isInitialLoaded);
  const bootstrapApp = useAppStore((s) => s.bootstrapApp);
  const initAppRealtimeSync = useAppStore((s) => s.initAppRealtimeSync);

  useEffect(() => {
    bootstrapApp();
    const cleanup = initAppRealtimeSync();
    return cleanup;
  }, [bootstrapApp, initAppRealtimeSync]);

  if (!isInitialLoaded) {
    return <PageLoader variant="fullscreen" />;
  }

  return <>{children}</>;
};
