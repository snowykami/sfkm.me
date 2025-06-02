import React from "react";

import { apps } from "@/apps"; // 路径按你的项目结构调整

export interface DockApp {
  id: string;
  icon: React.ReactNode;
  label?: string;
}

export interface DockWindowState {
  id: string;
  isVisible: boolean;
  isMinimized: boolean;
}

interface DockProps {
  apps: DockApp[];
  windows: DockWindowState[];
  isMobile: boolean;
  mobileCurrentIndex: number;
  handleMobileWindowSelect: (id: string) => void;
  focusWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  openWindow: (id: string, options?: { title?: string }) => void; // 修改 openWindow 接口，允许传入标题
  showErrorWindow?: (msg: string) => void; // 新增：用于弹出错误窗口
}

export default function Dock({
  windows,
  isMobile,
  mobileCurrentIndex,
  handleMobileWindowSelect,
  focusWindow,
  restoreWindow,
  openWindow,
  showErrorWindow,
}: DockProps) {
  // 通过 app id 查找窗口状态
  const getWindowState = (id: string) =>
    windows.find(w => w.id === id) || { isVisible: false, isMinimized: false };

  return (
    <div
      className={`absolute ${isMobile ? "bottom-3" : "bottom-6"
        } left-1/2 transform -translate-x-1/2 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-6 py-3 border border-slate-300/50 dark:border-slate-600/50 z-50`}
    >
      <div className="flex items-center space-x-3">
        {apps.map((app, index) => {
          if (!app.showInDock) return null
          const windowState = getWindowState(app.id);
          return (
            <div
              key={app.id}
              className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 relative ${isMobile
                ? index === mobileCurrentIndex
                  ? "bg-slate-400/50 border border-slate-400/50 dark:bg-slate-600/50 dark:border-slate-500/50"
                  : "bg-slate-300/30 hover:bg-slate-300/40 dark:bg-slate-700/30 dark:hover:bg-slate-600/40"
                : windowState.isVisible && !windowState.isMinimized
                  ? "bg-slate-400/50 border border-slate-400/50 dark:bg-slate-600/50 dark:border-slate-500/50"
                  : "bg-slate-400/30 hover:bg-slate-400/40 dark:bg-slate-600/30 dark:hover:bg-slate-600/40"
                }`}
              onClick={() => {
                if (isMobile) {
                  handleMobileWindowSelect(app.id);
                } else {
                  // 检查 app 是否可用
                  if (!app.id) {
                    showErrorWindow?.("应用未配置，无法打开！");
                    return;
                  }
                  if (windowState.isVisible && !windowState.isMinimized) {
                    focusWindow(app.id);
                  } else if (windowState.isMinimized) {
                    restoreWindow(app.id);
                    focusWindow(app.id); // 恢复窗口后置顶
                  } else {
                    try {
                      openWindow(app.id, { title: app.label, ...app.windowState });
                      focusWindow(app.id); // 打开窗口后置顶
                    } catch (e) {
                      showErrorWindow?.("应用无法打开： " + e);
                    }
                  }
                }
              }}
            >
              <div className="flex items-center justify-center w-full h-full text-2xl text-slate-800 dark:text-slate-200">
                {app.icon}
              </div>
              {/* 最小化指示器 */}
              {!isMobile && windowState.isMinimized && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
              {/* 活动指示器 */}
              {!isMobile && windowState.isVisible && !windowState.isMinimized && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-slate-600 dark:bg-slate-300 rounded-full"></div>
              )}
              {/* 移动端当前页指示器 */}
              {isMobile && index === mobileCurrentIndex && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-slate-600 dark:bg-slate-300 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}