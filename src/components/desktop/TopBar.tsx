"use client";

import { useWindowManager } from "@/contexts/WindowManagerContext";
import { useEffect, useState } from "react";
// component
// import { MusicPlayerWidget } from "./widgets/MusicPlayerWidget"
import { DatetimeWidget } from "./widgets/DatetimeWidget";
import { MusicControlWidget } from "./widgets/MusicControlWidget";
import { ThemeSwitch } from "./widgets/ThemeSwitch";
import { VolumeWidget } from "./widgets/VolumeWidget";
import { FullscreenSwitch } from "./widgets/FullscreenSwitch";

import config from "@/config";
import { t } from "i18next";

// 顶栏高度常量，导出供全局使用
export const TOPBAR_HEIGHT = 36; // 你可以根据设计调整为 40 或其它

interface TopBarProps {
  className?: string;
  title?: string;
}

export function TopBar({
  className = "",
  title = "Window Title",
}: TopBarProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { windows } = useWindowManager();
  const focusedWindow = windows
    .filter((w) => w.visible && !w.minimized)
    .reduce(
      (top, w) => (top === null || w.zIndex > top.zIndex ? w : top),
      null as (typeof windows)[0] | null,
    );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 等待组件挂载后再根据 isMobile 渲染数据
  if (!mounted) return null;

  return (
    <div
      style={{
        height: TOPBAR_HEIGHT,
        minHeight: TOPBAR_HEIGHT,
        maxHeight: TOPBAR_HEIGHT,
      }}
      className={`fixed top-0 left-0 right-0 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-300/30 dark:border-slate-700/30 z-[9999] transition-colors ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2 h-full">
        {/* 左侧区域 */}
        {!isMobile && (
          <div className="flex items-center space-x-4">
            <span className="text-slate-600 dark:text-slate-300 text-sm font-bold transition-colors">
              {focusedWindow
                ? t(focusedWindow.title)
                : t(title) || config.meta.name}
            </span>
          </div>
        )}
        {/* 右侧区域 */}
        <div className="flex items-center space-x-1">
          {/* 右侧组件区 */}
          <MusicControlWidget />
          <VolumeWidget />
          <ThemeSwitch />
          <FullscreenSwitch />
          <DatetimeWidget />
        </div>
      </div>
    </div>
  );
}
