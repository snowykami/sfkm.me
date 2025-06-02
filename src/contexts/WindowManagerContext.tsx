"use client"

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";


export interface WindowState {
  id: string;
  visible: boolean;
  zIndex: number;
  maximized: boolean;
  minimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  title: string;
  isEdgeHidden?: boolean; // 新增：窗口是否隐藏到边缘
  originalPositionBeforeEdgeHide?: { x: number; y: number }; // 新增：隐藏前的原始位置
  hiddenEdge?: 'top' | 'bottom' | 'left' | 'right'; // 新增：隐藏到哪个边缘
}

interface WindowManagerContextProps {
  windows: WindowState[];
  openWindow: (id: string, initial?: Partial<WindowState>) => void;
  closeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  updateWindow: (id: string, patch: Partial<WindowState>) => void;
  getWindowById: (id: string) => WindowState | undefined;
  resetLocalWindows: () => void;
  isMobileLayout: (id: string) => boolean; // 新增方法

}

const WindowManagerContext = createContext<WindowManagerContextProps | null>(null);

export const useWindowManager = () => {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error("useWindowManager must be used within WindowManagerProvider");
  return ctx;
};

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>(() => {
    try {
      const saved = localStorage.getItem("windows");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. 每次窗口状态变化时写入 localStorage
  useEffect(() => {
    localStorage.setItem("windows", JSON.stringify(windows));
  }, [windows]);

  // 计算新窗口默认位置
  const getDefaultPosition = (count: number, size = { width: 400, height: 300 }) => {
    // 屏幕中心
    const centerX = Math.max(window.innerWidth / 2 - size.width / 2, 0);
    const centerY = Math.max(window.innerHeight / 2 - size.height / 2, 0);
    const offset = 32;
    let x = centerX + offset * (count % 6);
    let y = centerY + offset * (count % 6);
    // 限制窗口不超出右下边界
    x = Math.min(x, window.innerWidth - size.width);
    y = Math.min(y, window.innerHeight - size.height);
    // 限制窗口不超出左上边界
    x = Math.max(x, 0);
    y = Math.max(y, 0);
    return { x, y };
  };
  // 打开窗口
  const openWindow = useCallback((id: string, initial: Partial<WindowState> = {}) => {
    setWindows(ws => {
      const exist = ws.find(w => w.id === id);
      if (exist) {
        return ws.map(w =>
          w.id === id
            ? { ...w, visible: true, minimized: false, ...initial }
            : w
        );
      }
      if (ws.find(w => w.id === id)) return ws;
      const maxZ = ws.reduce((max, w) => Math.max(max, w.zIndex), 100);
      const size = initial.size ?? { width: 400, height: 300 };
      const position =
        initial.position ??
        getDefaultPosition(ws.length, size);
      return [
        ...ws,
        {
          id,
          title: initial.title ?? "",
          visible: true,
          zIndex: maxZ + 1,
          maximized: false,
          minimized: false,
          position,
          size,
          ...initial,
        },
      ];
    });
  }, []);

  // 关闭窗口
  const closeWindow = (id: string) => {
    setWindows(ws => {
      const newWindows = ws.map(w => w.id === id ? { ...w, visible: false } : w);
      // 检查是否还有可见窗口
      const anyVisible = newWindows.some(w => w.visible);
      if (!anyVisible && typeof window !== "undefined") {
        window.location.hash = "";
      }
      return newWindows;
    });
  };

  // 置顶窗口
  const bringToFront = (id: string) => {
    setWindows(ws => {
      const maxZ = ws.reduce((max, w) => Math.max(max, w.zIndex), 100);
      return ws.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
    // 修改浏览器 URL 的哈希
    if (typeof window !== "undefined") {
      window.location.hash = id;
    }
  };

  // 更新窗口属性
  const updateWindow = (id: string, patch: Partial<WindowState>) => {
    setWindows(ws => ws.map(w => w.id === id ? { ...w, ...patch } : w));
  };

  // 检查是否为移动布局
  const isMobileLayout = useCallback((id: string) => {
    const window = windows.find(w => w.id === id);
    if (!window) return false;
    const result = window.size.height / window.size.width >= 1.6;
    return result;
  }, [windows]);


  // 通过ID查找窗户
  const getWindowById = useCallback(
    (id: string) => windows.find(w => w.id === id),
    [windows]
  );

  // 重置本地存储的窗口状态
  const resetLocalWindows = useCallback(() => {
    localStorage.removeItem("windows");
  }, []);

  return (
    <WindowManagerContext.Provider value={{ windows, openWindow, closeWindow, bringToFront, updateWindow, getWindowById, resetLocalWindows, isMobileLayout }}>
      {children}
    </WindowManagerContext.Provider>
  );
};