"use client";
import type React from "react";
import { useDevice } from "@/contexts/DeviceContext";
import { motion, AnimatePresence } from "framer-motion";
import { windowColorScheme } from "@/types/window";

interface MobileWindowProps {
    id?: string;
    children?: React.ReactNode;
    colorScheme?: windowColorScheme;
    visible?: boolean;
    scrollable?: boolean; // 新增 scrollable 属性，默认为 true
    // onClose?: () => void; // 父级统一渲染关闭按钮，这里去掉
}

export const MobileWindow: React.FC<MobileWindowProps> = ({
    children,
    colorScheme,
    visible = true,
    scrollable = true, // 新增 scrollable 属性
}) => {
    const { isMobile } = useDevice();

    if (!isMobile || !visible) return null;

    const defaultScheme: windowColorScheme = {
        bg: "bg-slate-100/95",
        bgDark: "dark:bg-slate-800/95",
        border: "border-slate-300/40",
        borderDark: "dark:border-slate-700/20",
    };
    const scheme = { ...defaultScheme, ...colorScheme };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className={`
    ${scheme.bg} ${scheme.bgDark}
    w-full flex flex-col h-full relative
  `}
                >
                    {scrollable ? (
                        <div className="flex-1 overflow-y-auto text-slate-800 dark:text-slate-200 pb-4">
                            {children}
                        </div>
                    ) : (
                        <div className="flex-1 text-slate-800 dark:text-slate-200 pb-4">
                            {children}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MobileWindow;