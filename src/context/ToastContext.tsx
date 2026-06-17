import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Absolute floating portal-like container positioned elegantly inside the viewport frame */}
      <div className="absolute top-16 inset-x-4 z-50 pointer-events-none flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const bgClass = {
              success: "bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100",
              error: "bg-rose-50 border-rose-200 text-rose-950 shadow-rose-100",
              info: "bg-blue-50 border-blue-200 text-blue-950 shadow-blue-100",
              warning: "bg-amber-50 border-amber-200 text-amber-950 shadow-amber-100",
            }[toast.type];

            const iconClass = {
              success: "text-emerald-600",
              error: "text-rose-600",
              info: "text-blue-600",
              warning: "text-amber-600",
            }[toast.type];

            const Icon = {
              success: CheckCircle2,
              error: AlertCircle,
              info: Info,
              warning: AlertTriangle,
            }[toast.type];

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-xs font-semibold shadow-lg backdrop-blur-md pointer-events-auto ${bgClass}`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${iconClass}`} />
                <p className="flex-1 leading-normal text-left">{toast.message}</p>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="p-0.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
