"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    show: (message: string, type?: ToastType) => void;
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
};

let idCounter = 0;

export function ToastProvider({ children }: any) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const remove = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const show = useCallback((message: string, type: ToastType = "info") => {
        const id = ++idCounter;

        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => remove(id), 3000);
    }, []);

    const api = {
        show,
        success: (msg: string) => show(msg, "success"),
        error: (msg: string) => show(msg, "error"),
        warning: (msg: string) => show(msg, "warning"),
        info: (msg: string) => show(msg, "info"),
    };

    return (
        <ToastContext.Provider value={api}>
            {children}

            {/* TOAST UI */}
            <div className="fixed top-6 right-6 z-50 space-y-3">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <ToastItem key={t.id} {...t} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

/* ITEM */
function ToastItem({ id, message, type }: Toast) {
    const colors = {
        success: "bg-green-50 border-green-200 text-green-700",
        error: "bg-red-50 border-red-200 text-red-700",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
        info: "bg-blue-50 border-blue-200 text-blue-700",
    };

    const icons = {
        success: "✔",
        error: "✖",
        warning: "⚠",
        info: "ℹ",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.25 }}
            className={`min-w-[260px] px-4 py-3 rounded-xl border shadow-md backdrop-blur-md ${colors[type]}`}
        >
            <div className="flex items-center gap-2 text-sm font-medium">
                <span>{icons[type]}</span>
                {message}
            </div>
        </motion.div>
    );
}