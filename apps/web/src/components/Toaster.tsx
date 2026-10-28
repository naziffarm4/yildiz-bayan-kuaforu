"use client";

import React from "react";
import { useToastStore } from "@/stores/toast-store";
import { Toast } from "@yildiz/ui";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto transform transition-all duration-300 ease-out">
          <Toast
            type={item.type}
            message={item.message}
            onDismiss={() => dismissToast(item.id)}
          />
        </div>
      ))}
    </div>
  );
}
