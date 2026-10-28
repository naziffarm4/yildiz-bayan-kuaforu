import React from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  type: ToastType;
  message: string;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onDismiss }) => {
  const getStyleAndIcon = () => {
    switch (type) {
      case "success":
        return {
          wrapper: "bg-bg-primary border-emerald-300/80 shadow-[0_8px_30px_rgb(16,185,129,0.12)] text-emerald-950",
          iconBg: "bg-emerald-100/90 text-emerald-700",
          title: "Başarılı",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case "error":
        return {
          wrapper: "bg-bg-primary border-rose-300/80 shadow-[0_8px_30px_rgb(244,63,94,0.12)] text-rose-950",
          iconBg: "bg-rose-100/90 text-rose-700",
          title: "Hata",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      case "info":
      default:
        return {
          wrapper: "bg-bg-primary border-primary/40 shadow-md text-dark",
          iconBg: "bg-primary/10 text-primary",
          title: "Bilgi",
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const config = getStyleAndIcon();

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${config.wrapper}`}
    >
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${config.iconBg}`}>
        {config.icon}
      </div>

      <div className="flex-1 pt-0.5 min-w-0">
        <span className="font-serif text-xs font-bold uppercase tracking-wider block mb-0.5 text-text-primary">
          {config.title}
        </span>
        <p className="text-xs text-text-secondary leading-relaxed break-words font-medium">
          {message}
        </p>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Kapat"
          className="shrink-0 p-1 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
