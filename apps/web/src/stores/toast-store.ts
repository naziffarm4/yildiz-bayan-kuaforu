import { create, type SetState, type GetState } from "./zustand";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set: SetState<ToastState>, get: GetState<ToastState>) => ({
  toasts: [],
  addToast: ({ type, message, duration = 4000 }) => {
    const id = `toast-${Date.now()}-${++toastCounter}`;
    const newToast: ToastItem = { id, type, message, duration };
    set({ toasts: [...get().toasts, newToast] });

    if (duration > 0 && typeof window !== "undefined") {
      setTimeout(() => {
        get().dismissToast(id);
      }, duration);
    }
    return id;
  },
  dismissToast: (id: string) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

export const toast = {
  success: (message: string, duration = 4000) =>
    useToastStore.getState().addToast({ type: "success", message, duration }),
  error: (message: string, duration = 4000) =>
    useToastStore.getState().addToast({ type: "error", message, duration }),
  info: (message: string, duration = 4000) =>
    useToastStore.getState().addToast({ type: "info", message, duration }),
};
