import type React from "react";
import { useState } from "react";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import type { BaseWindowProps } from "./BaseWindow";
import { t } from "i18next";
import BaseWindow from "./BaseWindow";

interface MacOSWindowColorScheme {
  bg?: string;
  bgDark?: string;
  border?: string;
  borderDark?: string;
  title?: string;
  titleDark?: string;
}

interface MacOSWindowProps extends Omit<BaseWindowProps, "children" | "title"> {
  id: string;
  children?: React.ReactNode;
  showClose?: boolean;
  showMinimize?: boolean;
  showMaximize?: boolean;
  colorScheme?: MacOSWindowColorScheme;
}

export const MacOSWindow: React.FC<MacOSWindowProps> = ({
  id,
  children,
  showClose = true,
  showMinimize = true,
  showMaximize = true,
  colorScheme,
  ...baseProps
}) => {
  const { windows, closeWindow, bringToFront, updateWindow } = useWindowManager();
  const win = windows.find(w => w.id === id);
  const [closing, setClosing] = useState(false);
  const [minimizing, setMinimizing] = useState(false);

  if (!win) return null;

  const defaultScheme: MacOSWindowColorScheme = {
    bg: "bg-slate-100/95",
    bgDark: "dark:bg-slate-800/95",
    border: "border-slate-300/60",
    borderDark: "dark:border-slate-700/30",
    title: "text-slate-700",
    titleDark: "dark:text-slate-300",
  };
  const scheme = { ...defaultScheme, ...colorScheme };

  // 处理关闭窗口逻辑
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      closeWindow(id);
      setClosing(false);
    }, 220);
  };

  // 处理最大化/还原窗口逻辑
  const handleMaximize = () => {
    updateWindow(id, { maximized: !win.maximized, minimized: false });
  };

  // 最小化逻辑
  const handleMinimize = () => {
    setMinimizing(true);
    setTimeout(() => {
      updateWindow(id, { minimized: true, maximized: false });
      setMinimizing(false);
    }, 220); // 动画时长与 CSS 保持一致
  };

  return (
    <BaseWindow
      id={id}
      x={win.position.x}
      y={win.position.y}
      width={win.size.width}
      height={win.size.height}
      maximized={win.maximized}
      visible={win.visible}
      dragHandleClassName="window-drag-handle"
      draggable
      resizable
      // 不再传递 zIndex，由 BaseWindow 统一处理
      onResizeStop={(_, __, ref, ___, pos) =>
        updateWindow(id, {
          size: {
            width: parseInt(ref.style.width, 10),
            height: parseInt(ref.style.height, 10),
          },
          position: pos,
        })
      }
      onClick={() => bringToFront(id)}
      {...baseProps}
    >
      <div
        className={`
          ${scheme.bg} ${scheme.bgDark}
          backdrop-blur-md
          shadow-xl
          border ${scheme.border} ${scheme.borderDark}
          overflow-hidden
          flex flex-col
          rounded-2xl
          will-change-transform
          transition-all duration-300
          ${closing ? "animate-window-close" : minimizing ? "animate-window-minimize" : "animate-window-open"}
        `}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 标题栏 */}
        <div
          className={`
            window-drag-handle
            bg-slate-300/80 dark:bg-slate-800/80
            backdrop-blur-sm
            border-b border-slate-300/60 dark:border-slate-800/50
            px-4 py-3 flex items-center select-none relative
            cursor-grab active:cursor-grabbing
          `}
        >
          <div className="window-controls flex items-center space-x-2">
            {/* 关闭按钮 */}
            {showClose && (
              <div
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center group relative"
                onClick={handleClose}
              >
                <div className="w-1.5 h-0.5 bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rotate-45 absolute"></div>
                <div className="w-1.5 h-0.5 bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -rotate-45 absolute"></div>
              </div>
            )}
            {/* 最小化按钮 */}
            {showMinimize && (
              <div
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center group relative"
                onClick={handleMinimize}>
                <div className="w-1.5 h-0.5 bg-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            )}
            {/* 最大化按钮 */}
            {showMaximize && (
              <div
                className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center group relative"
                onClick={handleMaximize}>
                <div className="w-1.5 h-1.5 border border-green-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            )}
          </div>
          {/* 绝对居中标题 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max pointer-events-none z-0">
            <span className={`${scheme.title} ${scheme.titleDark} text-sm font-medium`}>{t(win.title)}</span>
          </div>
          <div className="w-[60px]" />
        </div>
        {/* 内容区域 */}
        <div
          className="overflow-y-auto custom-scrollbar flex-1 text-slate-800 dark:text-slate-200"
          style={{
            transition: "height 0.3s ease",
          }}
        >
          {children}
        </div>
      </div>
    </BaseWindow>
  );
};

export default MacOSWindow;