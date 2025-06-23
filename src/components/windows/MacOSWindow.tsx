import type React from "react";
import { useState } from "react";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import type { BaseWindowProps } from "./BaseWindow";
import { t } from "i18next";
import BaseWindow from "./BaseWindow";
import { Marquee } from "@/components/ui/Marquee";
import { windowColorScheme } from "@/types/window";

interface MacOSWindowProps extends Omit<BaseWindowProps, "children" | "title"> {
  id: string;
  children?: React.ReactNode;
  showClose?: boolean;
  showMinimize?: boolean;
  showMaximize?: boolean;
  colorScheme?: windowColorScheme;
}

export const MacOSWindow: React.FC<MacOSWindowProps> = ({
  id,
  children,
  showClose = true,
  showMinimize = true,
  showMaximize = true,
  colorScheme: propColorScheme = {},
  ...baseProps
}) => {
  const { windows, closeWindow, bringToFront, updateWindow } =
    useWindowManager();
  const win = windows.find((w) => w.id === id);
  const [closing, setClosing] = useState(false);
  const [minimizing, setMinimizing] = useState(false);
  const isTop = win?.zIndex === Math.max(...windows.map((w) => w.zIndex));

  if (!win) return null;

  const defaultScheme: windowColorScheme = {
    bg: "bg-slate-100/95",
    bgDark: "dark:bg-slate-800/95",
    border: "border-slate-300/60",
    borderDark: "dark:border-slate-700/30",
    title: "text-slate-700",
    titleDark: "dark:text-slate-300",
    titleBarBg: "bg-slate-300/80",
    titleBarBgDark: "dark:bg-slate-800/80",
    titleBarBorder: "border-slate-300/60",
    titleBarBorderDark: "dark:border-slate-800/50",
    titleBarClassName: "",
    backgroundImage: "",
    backgroundColor: "",
    backgroundColorDark: "",
    backgroundBlendMode: "normal",
    backgroundOpacity: "1",
    backdropBlur: true,
    backdropBlurClass: "backdrop-blur-md",
    shadow: "shadow-2xl",
    showBorder: true, // 默认显示边框
    backgroundOverlay: false,
    overlayColor: "bg-black/20",
    overlayColorDark: "dark:bg-black/30",
    overlayBlendMode: "normal",
    overlayGradient: "",
  };

  const scheme = {
    ...defaultScheme,
    ...win.colorScheme,
    ...propColorScheme,
  };

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
    }, 220);
  };

  // 生成背景样式
  const getBackgroundStyle = () => {
    const style: React.CSSProperties = {};

    // 设置背景图片 (如果有)
    if (scheme.backgroundImage) {
      style.backgroundImage = `url(${scheme.backgroundImage})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
      style.backgroundRepeat = "no-repeat";
    }

    // 设置背景色 (如果有)
    if (scheme.backgroundColor) {
      style.backgroundColor = scheme.backgroundColor;
    }

    // 设置混合模式
    if (scheme.backgroundBlendMode) {
      style.backgroundBlendMode = scheme.backgroundBlendMode;
    }

    // 设置不透明度
    if (scheme.backgroundOpacity && scheme.backgroundOpacity !== "1") {
      style.opacity = parseFloat(scheme.backgroundOpacity);
    }

    return style;
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
          relative
          rounded-2xl
          overflow-hidden
          w-full h-full
          ${closing ? "animate-window-close" : minimizing ? "animate-window-minimize" : "animate-window-open"}
        `}
      >
        {/* 背景层 - 背景图片或自定义背景色 */}
        {(scheme.backgroundImage ||
          scheme.backgroundColor ||
          scheme.backgroundColorDark) && (
          <div
            className={`
              absolute inset-0 z-0
              ${scheme.backgroundClassName}
              ${scheme.backgroundColorDark || ""}
            `}
            style={getBackgroundStyle()}
          />
        )}

        {/* 新增：背景蒙版层 */}
        {scheme.backgroundOverlay && (
          <div
            className={`
            absolute inset-0 z-[5]
            ${scheme.overlayColor || defaultScheme.overlayColor}
            ${scheme.overlayColorDark || defaultScheme.overlayColorDark}
            transition-colors duration-300
            ${scheme.overlayGradient || ""}
          `}
            style={{
              mixBlendMode: (scheme.overlayBlendMode ||
                "normal") as React.CSSProperties["mixBlendMode"],
            }}
          />
        )}

        {/* 主窗口容器 */}
        <div
          className={`
            ${scheme.bg} ${scheme.bgDark}
            ${scheme.backdropBlur ? scheme.backdropBlurClass : ""}
            ${scheme.shadow || "shadow-xl"}
            ${scheme.showBorder !== false ? `border ${scheme.border} ${scheme.borderDark}` : ""}
            overflow-hidden
            flex flex-col
            rounded-2xl
            will-change-transform
            transition-all duration-300
            relative z-10
            w-full h-full
          `}
        >
          {/* 标题栏 */}
          <div
            className={`
              window-drag-handle
              ${scheme.titleBarBg || defaultScheme.titleBarBg} 
              ${scheme.titleBarBgDark || defaultScheme.titleBarBgDark}
              backdrop-blur-sm
              border-b ${scheme.titleBarBorder || defaultScheme.titleBarBorder} 
              ${scheme.titleBarBorderDark || defaultScheme.titleBarBorderDark}
              px-4 py-3 flex items-center select-none relative
              cursor-grab active:cursor-grabbing
              ${scheme.titleBarClassName || ""}
              ${scheme.titleBarClassName}
            `}
          >
            <div className="window-controls flex items-center space-x-2 group">
              {/* 关闭按钮 */}
              {showClose && (
                <div
                  className={`
        w-3 h-3 rounded-full
        ${isTop ? "bg-red-500" : "bg-gray-400"}
        group-hover:bg-red-500
        hover:bg-red-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center relative
      `}
                  onClick={isTop ? handleClose : undefined}
                  style={{
                    pointerEvents: isTop ? "auto" : "none",
                  }}
                >
                  <div className="w-1.5 h-0.5 bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rotate-45 absolute"></div>
                  <div className="w-1.5 h-0.5 bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -rotate-45 absolute"></div>
                </div>
              )}
              {/* 最小化按钮 */}
              {showMinimize && (
                <div
                  className={`
        w-3 h-3 rounded-full
        ${isTop ? "bg-yellow-500" : "bg-gray-400"}
        group-hover:bg-yellow-500
        hover:bg-yellow-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center relative
      `}
                  onClick={isTop ? handleMinimize : undefined}
                  style={{
                    pointerEvents: isTop ? "auto" : "none",
                  }}
                >
                  <div className="w-1.5 h-0.5 bg-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              )}
              {/* 最大化按钮 */}
              {showMaximize && (
                <div
                  className={`
        w-3 h-3 rounded-full
        ${isTop ? "bg-green-500" : "bg-gray-400"}
        group-hover:bg-green-500
        hover:bg-green-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center relative
      `}
                  onClick={isTop ? handleMaximize : undefined}
                  style={{
                    pointerEvents: isTop ? "auto" : "none",
                  }}
                >
                  <div className="w-1.5 h-1.5 border border-green-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              )}
            </div>

            {/* 绝对居中标题 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[60%] w-auto pointer-events-none z-0 overflow-hidden">
              <span
                className={`${scheme.title} ${scheme.titleDark} text-sm font-medium block`}
              >
                <Marquee pauseBeforeRepeatSec={1.5} speedPxPerSec={40}>
                  {t(win.title)}
                </Marquee>
              </span>
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
      </div>
    </BaseWindow>
  );
};

export default MacOSWindow;
