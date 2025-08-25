"use client";
import React, { useState, useEffect, useRef } from "react";
import { Rnd, RndDragCallback, RndResizeCallback } from "react-rnd";
import type { Rnd as RndType } from "react-rnd";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "i18next";
import { useDevice } from "@/contexts/DeviceContext";

export interface BaseWindowProps {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  zIndex?: number;
  draggable?: boolean;
  resizable?: boolean;
  maximized?: boolean;
  visible?: boolean;
  onDragStart?: RndDragCallback;
  onDragStop?: RndDragCallback;
  onResizeStop?: RndResizeCallback;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  dockHeight?: number; // 可选的停靠栏高度
  windowMargin?: number; // 窗口边距
  dragHandleClassName?: string;
  children?: React.ReactNode;
}

interface PreMaximizeState {
  size: { width: number; height: number };
  position: { x: number; y: number };
  mouseOffset: { x: number; y: number };
}

export const BaseWindow: React.FC<BaseWindowProps> = ({
  id,
  x = 100,
  y = 100,
  width = 400,
  height = 300,
  minWidth = 220,
  minHeight = 120,
  zIndex = 100,
  draggable = true,
  resizable = true,
  maximized = false,
  visible = true,
  onDragStart,
  onDragStop,
  onResizeStop,
  onClick,
  dragHandleClassName,
  dockHeight = 0, // 默认停靠栏顶部绝对高度
  windowMargin = 0, // 窗口边距
  children,
}) => {
  const windowManager = useWindowManager?.();
  const win =
    id && windowManager
      ? windowManager.windows.find((w) => w.id === id)
      : undefined;

  const { isMobile } = useDevice();

  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width, height });

  useEffect(() => {
    if (!win) setPosition({ x, y });
  }, [x, y, win]);
  useEffect(() => {
    if (!win) setSize({ width, height });
  }, [width, height, win]);

  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const maximizedStyle =
    (win?.maximized ?? maximized)
      ? {
          x: windowMargin,
          y: windowMargin,
          width: window.innerWidth - windowMargin * 2,
          height: window.innerHeight - windowMargin * 2 - dockHeight,
        }
      : {
          x: win?.position?.x ?? position.x,
          y: win?.position?.y ?? position.y,
          width: win?.size?.width ?? size.width,
          height: win?.size?.height ?? size.height,
        };

  const [showMaximizeHint, setShowMaximizeHint] = useState(false);
  const [preMaximize, setPreMaximize] = useState<PreMaximizeState | null>(null);
  const rndRef = useRef<RndType | null>(null);
  const handleDrag: RndDragCallback = (e, d) => {
    // 最大化时允许拖拽
    if (win?.maximized ?? maximized) {
      // 记录鼠标在窗口中的偏移
      const mouseX = (e as MouseEvent).clientX;
      const mouseY = (e as MouseEvent).clientY;
      const widthVal = win?.size?.width ?? size.width;
      const heightVal = win?.size?.height ?? size.height;
      setPreMaximize({
        size: { width: widthVal, height: heightVal },
        position: { x: d.x, y: d.y },
        mouseOffset: {
          x: mouseX - (maximizedStyle.x ?? 0),
          y: mouseY - (maximizedStyle.y ?? 0),
        },
      });
      if (id && windowManager) {
        windowManager.updateWindow(id, { maximized: false });
      }
      return;
    }
    if (d.y <= windowMargin) {
      setShowMaximizeHint(true);
    } else {
      setShowMaximizeHint(false);
    }
  };

  const handleDragStop: RndDragCallback = (e, d) => {
    if (showMaximizeHint) {
      setShowMaximizeHint(false);
      if (id && windowManager) {
        windowManager.updateWindow(id, { maximized: true });
      }
      return;
    }
    if (id && windowManager) {
      windowManager.updateWindow(id, { position: { x: d.x, y: d.y } });
    } else {
      setPosition({ x: d.x, y: d.y });
    }
    onDragStop?.(e, d);
  };
  const handleDragStart: RndDragCallback = (e, d) => {
    // 最大化时允许拖拽，逻辑已在 handleDrag 实现
    onDragStart?.(e, d);
  };

  useEffect(() => {
    if (!win?.maximized && preMaximize && rndRef.current) {
      const mouse = preMaximize.mouseOffset;
      // 鼠标相对于窗口左上角的偏移
      let newX = mouse.x - preMaximize.size.width / 2;
      let newY = mouse.y - preMaximize.size.height / 2;
      // 不自动吸附边缘，仅保证窗口不超出屏幕
      newX = Math.min(Math.max(newX, 0), window.innerWidth - preMaximize.size.width);
      newY = Math.min(Math.max(newY, windowMargin), window.innerHeight - preMaximize.size.height);
      rndRef.current.updatePosition({ x: newX, y: newY });
      rndRef.current.updateSize({
        width: preMaximize.size.width,
        height: preMaximize.size.height,
      });
      setPreMaximize(null);
      if (id && windowManager) {
        windowManager.updateWindow(id, {
          position: { x: newX, y: newY },
          size: {
            width: preMaximize.size.width,
            height: preMaximize.size.height,
          },
        });
      } else {
        setPosition({ x: newX, y: newY });
        setSize({
          width: preMaximize.size.width,
          height: preMaximize.size.height,
        });
      }
    }
  }, [
    win?.maximized,
    preMaximize,
    id,
    windowManager,
    size.width,
    size.height,
    windowMargin,
  ]);
  if (!shouldRender) return null;
  // 移动端下直接全屏
  const rndSize = isMobile
    ? { width: "100vw", height: "100vh" }
    : { width: maximizedStyle.width, height: maximizedStyle.height };
  const rndPosition = isMobile
    ? { x: 0, y: 0 }
    : { x: maximizedStyle.x, y: maximizedStyle.y };

  return (
    <AnimatePresence>
      {visible && (
        <Rnd
          ref={rndRef}
          size={rndSize}
          position={rndPosition}
          minWidth={minWidth}
          minHeight={minHeight}
          bounds="parent"
          disableDragging={
            isMobile || !draggable
          }
          enableResizing={
            !isMobile && resizable && !(win?.maximized ?? maximized)
          }
          style={{ zIndex: win?.zIndex ?? zIndex }}
          className="base-window"
          dragHandleClassName={dragHandleClassName}
          onDrag={handleDrag}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          onMouseDown={() => {
            if (id && windowManager) {
              windowManager.bringToFront(id);
            }
          }}
          onResizeStop={(e, dir, ref, delta, pos) => {
            if (id && windowManager) {
              windowManager.updateWindow(id, {
                size: {
                  width: parseInt(ref.style.width, 10),
                  height: parseInt(ref.style.height, 10),
                },
                position: { x: pos.x, y: pos.y },
              });
            } else {
              setSize({
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
              });
              setPosition({ x: pos.x, y: pos.y });
            }
            onResizeStop?.(e, dir, ref, delta, pos);
          }}
          onClick={onClick}
        >
          <motion.div
            layout
            className="w-full h-full relative"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -30 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            {showMaximizeHint && (
              <div
                className="
                base-window-container
                  absolute top-0 left-1/2 -translate-x-1/2
                  bg-blue-500/50 text-white px-4 py-1 rounded-3xl z-[9999] text
                  text-sm pointer-events-none shadow-md select-none w-full h-full flex justify-center items-start
                "
              >
                {t("ui.releaseToMaximize")}
              </div>
            )}
            {children}
          </motion.div>
        </Rnd>
      )}
    </AnimatePresence>
  );
};

export default BaseWindow;
