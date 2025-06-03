import React, { useEffect, useState } from "react";
import { TopBar, TOPBAR_HEIGHT } from "./TopBar"; // 确保 TOPBAR_HEIGHT 已导出
import Dock, { DockWindowState } from "./Dock";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import MacOSWindow from "../windows/MacOSWindow"; // 假设 MacOSWindow 组件根元素有 'macos-window' 类名
import { useApps } from "@/contexts/AppContext";
import { useDevice } from "@/contexts/DeviceContext";
import config from "@/config";
import { BackgroundContext } from "@/types/background";
import { mediumWindowState } from "@/apps";

async function getBackground(ctx: BackgroundContext): Promise<string | undefined> {
    const bg = config.background;
    if (typeof bg === "function") {
        try {
            const result = bg(ctx);
            if (result instanceof Promise) {
                const awaitedResult = await result;
                return awaitedResult;
            } else {
                return result;
            }
        } catch (error) {
            console.error("Error executing config.background function:", error);
            return "url('https://cdn.liteyuki.org/blog/background.png')"; // 函数执行出错时返回 undefined
        }
    } else {
        return "url('https://cdn.liteyuki.org/blog/background.png')";
    }
}


const WINDOW_MARGIN = 20; // 窗口移出后保留在视图内的边距
const DOCK_HEIGHT = 80; // Dock 的大致高度，根据实际情况调整

export function PCDesktop() {
    const { windows, openWindow, bringToFront, updateWindow } = useWindowManager();
    const { apps } = useApps();
    const { isMobile } = useDevice(); // isMobile 似乎未在 PCDesktop 中直接使用，但保留以防未来需要

    const dockWindows: DockWindowState[] = apps.map(app => {
        const win = windows.find(w => w.id === app.id);
        return {
            id: app.id,
            isVisible: !!win?.visible,
            isMinimized: !!win?.minimized,
        };
    });

    const focusWindow = (id: string) => bringToFront(id);
    const restoreWindow = (id: string) => updateWindow(id, { minimized: false, visible: true });

    const [background, setBackground] = useState<string | undefined>();
    useEffect(() => {
        getBackground({ isMobile: false }) // PCDesktop 明确 isMobile: false
            .then(setBackground)
            .catch(error => {
                console.error("Error fetching PCDesktop background:", error);
                setBackground(undefined);
            });
    }, []); // 空依赖数组，仅在挂载时运行

    // 监听路由变化并打开对应窗口
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1); // 获取哈希值，去掉前面的 #
            if (hash) {
                openWindow(hash, mediumWindowState); // 打开对应的窗口 ID
            }
        };
        // 初次加载时检查哈希值
        handleHashChange();
        // 监听哈希变化
    }, [openWindow]);

    const handleDesktopClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const targetElement = event.target as HTMLElement;
        if (
            targetElement.closest('.base-window') ||
            targetElement.closest('.top-bar-component') ||
            targetElement.closest('.dock-component')
        ) {
            return;
        }

        const windowAreaWidth = window.innerWidth;
        const windowAreaHeight = window.innerHeight - TOPBAR_HEIGHT - DOCK_HEIGHT; // 考虑 Dock 区域

        // 查找当前已隐藏到边缘的窗口
        const windowsToRestore = windows.filter(w => w.isEdgeHidden && w.originalPositionBeforeEdgeHide);

        if (windowsToRestore.length > 0) {
            // 如果有任何窗口已隐藏到边缘，则恢复所有这些窗口
            windowsToRestore.forEach(win => {
                if (win.originalPositionBeforeEdgeHide) { // Type guard
                    updateWindow(win.id, {
                        position: win.originalPositionBeforeEdgeHide,
                        isEdgeHidden: false,
                        originalPositionBeforeEdgeHide: undefined,
                        hiddenEdge: undefined,
                    });
                    // 恢复后是否需要置顶？根据需求决定，这里选择置顶
                    bringToFront(win.id);
                }
            });
        } else {
            // 如果没有窗口隐藏到边缘，则查找所有可见、非最小化、非最大化的窗口进行隐藏
            const windowsToHide = windows.filter(w => w.visible && !w.minimized && !w.maximized);

            windowsToHide.forEach(win => {
                const originalPosition = { ...win.position }; // 保存原始位置
                const { x, y } = win.position;
                const { width, height } = win.size;

                // 计算窗口中心点相对于窗口活动区域的坐标
                const windowCenterX = x + width / 2;
                const windowCenterY = y + height / 2;

                // 计算窗口中心点到四个边缘的距离
                const distToTop = windowCenterY;
                const distToBottom = windowAreaHeight - windowCenterY;
                const distToLeft = windowCenterX;
                const distToRight = windowAreaWidth - windowCenterX;

                let edgeToHide: 'top' | 'bottom' | 'left' | 'right';
                const newPosition = { ...originalPosition };

                // 确定最近的边缘
                if (distToTop <= distToBottom && distToTop <= distToLeft && distToTop <= distToRight) {
                    edgeToHide = 'top';
                } else if (distToLeft <= distToTop && distToLeft <= distToBottom && distToLeft <= distToRight) {
                    edgeToHide = 'left';
                } else if (distToRight <= distToTop && distToRight <= distToBottom && distToRight <= distToLeft) {
                    edgeToHide = 'right';
                } else {
                    edgeToHide = 'bottom';
                }

                // 计算隐藏后的新位置
                switch (edgeToHide) {
                    case 'top':
                        newPosition.y = -height + WINDOW_MARGIN;
                        // 隐藏到顶部或底部时，水平位置保持不变，但要确保不超出左右边界
                        newPosition.x = Math.max(0, Math.min(originalPosition.x, windowAreaWidth - width));
                        break;
                    case 'bottom':
                        newPosition.y = windowAreaHeight - WINDOW_MARGIN;
                        // 隐藏到顶部或底部时，水平位置保持不变，但要确保不超出左右边界
                        newPosition.x = Math.max(0, Math.min(originalPosition.x, windowAreaWidth - width));
                        break;
                    case 'left':
                        newPosition.x = -width + WINDOW_MARGIN;
                        // 隐藏到左侧或右侧时，垂直位置保持不变，但要确保不超出上下边界
                        newPosition.y = Math.max(0, Math.min(originalPosition.y, windowAreaHeight - height));
                        break;
                    case 'right':
                        newPosition.x = windowAreaWidth - WINDOW_MARGIN;
                        // 隐藏到左侧或右侧时，垂直位置保持不变，但要确保不超出上下边界
                        newPosition.y = Math.max(0, Math.min(originalPosition.y, windowAreaHeight - height));
                        break;
                }

                // 更新窗口状态，标记为边缘隐藏，并保存原始位置和隐藏边缘
                updateWindow(win.id, {
                    position: newPosition,
                    isEdgeHidden: true,
                    originalPositionBeforeEdgeHide: originalPosition, // 保存隐藏前的原始位置
                    hiddenEdge: edgeToHide,
                });
            });
        }
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
            style={{
                backgroundImage: background ? `url('${background}')` : undefined,
            }}
            onClick={handleDesktopClick}
        >
            <TopBar className="z-10 top-bar-component" title="" />
            <div
                className="window-area absolute left-0 right-0"
                style={{
                    top: TOPBAR_HEIGHT,
                    bottom: 0,
                    position: "absolute",
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            >
                <div style={{ width: "100%", height: "100%", position: "relative", pointerEvents: "auto" }}>
                    {windows.map(win =>
                        win.visible && !win.minimized ? (
                            (() => {
                                // 修改: 优先使用 customRender 函数渲染临时窗口内容
                                if (win.customRender) {
                                    return (
                                        <MacOSWindow
                                            key={win.id}
                                            id={win.id}
                                            showClose={win.showClose}
                                            showMinimize={win.showMinimize}
                                            showMaximize={win.showMaximize}
                                        >
                                            {win.customRender()}
                                        </MacOSWindow>
                                    );
                                }

                                // 如果没有 customRender，则使用常规应用入口
                                const app = apps.find(a => a.id === win.id);
                                if (!app) return null;
                                const Entry = app.entry;

                                // 传递 appProps 到应用组件
                                return (
                                    <MacOSWindow
                                        key={win.id}
                                        id={win.id}
                                        showClose={win.showClose}
                                        showMinimize={win.showMinimize}
                                        showMaximize={win.showMaximize}
                                    >
                                        <Entry
                                            windowId={win.id}
                                            {...(win.appProps || {})}
                                        />
                                    </MacOSWindow>
                                );
                            })()
                        ) : null
                    )}
                </div>
            </div>

            <div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-[99999] dock-component"
            >
                <Dock
                    apps={apps}
                    windows={dockWindows}
                    isMobile={isMobile}
                    mobileCurrentIndex={0}
                    handleMobileWindowSelect={() => { }}
                    focusWindow={focusWindow}
                    restoreWindow={restoreWindow}
                    openWindow={openWindow}
                />
            </div>
        </div>
    );
}

export default function Desktop() {
    const { isMobile } = useDevice();
    const [background, setBackground] = useState<string | undefined>();
    useEffect(() => {
        getBackground({ isMobile: isMobile })
            .then(setBackground)
            .catch(error => {
                console.error("Error fetching Desktop wrapper background:", error);
                setBackground(undefined);
            });
    }, [isMobile]);

    return (
        <div
            className="desktop-container fixed inset-0 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md z-40 flex flex-col"
            style={{
                backgroundImage: background ? background : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center"
            }}
        >
            <PCDesktop />
        </div>
    );
}