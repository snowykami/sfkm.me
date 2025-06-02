"use client";

import React, { useEffect, useRef } from "react";
import { AppProps } from "../BaseApp";
import { useDevice } from "@/contexts/DeviceContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { useMusic } from "@/contexts/MusicContext";
import { WindowState } from "@/contexts/WindowManagerContext";
import PlayerView from "./PlayerView";
import MusicControls from "./MusicControls";
import { t } from "i18next";

export const WINDOW_ID = "music";

export const musicWindowState: Partial<WindowState> = {
    size: {
        width: 1000,
        height: 700
    },
    colorScheme: {
        // 窗口和标题栏完全透明
        bg: "bg-transparent",
        bgDark: "dark:bg-transparent",
        titleBarBg: "bg-transparent",
        titleBarBgDark: "dark:bg-transparent",
        titleBarBorder: "border-transparent",
        titleBarBorderDark: "dark:border-transparent",
        showBorder: false,
        backgroundImage: "https://cdn.liteyuki.org/blog/background.png",
        backdropBlur: true,
        backgroundOpacity: "0.8",
        backgroundBlendMode: "normal",
        backgroundOverlay: true,
        overlayColor: "bg-slate-200",
        overlayColorDark: "dark:bg-slate-500",
        overlayBlendMode: "normal",
    }
};

export default function Music({ windowId = WINDOW_ID }: AppProps) {
    const { isMobile: isMobileDevice } = useDevice();
    const { isMobileLayout } = useWindowManager();
    const isMobile = isMobileDevice || isMobileLayout(windowId);

    const { currentSong } = useMusic();
    const { updateWindow } = useWindowManager();
    const lastSongTitleRef = useRef<string | null>(null);

    // 只更新标题，不更新样式
    useEffect(() => {
        if (!currentSong) return;
        const title = currentSong.title || "Music Player";
        const fullTitle = t("music.title") + " - " + title;
        if (lastSongTitleRef.current === title) {
            return;
        }
        updateWindow(windowId, {
            title: fullTitle,
            colorScheme: {
                bg: "bg-transparent",
                bgDark: "dark:bg-transparent",
                titleBarBg: "bg-transparent",
                titleBarBgDark: "dark:bg-transparent",
                titleBarBorder: "border-transparent",
                titleBarBorderDark: "dark:border-transparent",
                showBorder: false,
                backgroundImage: currentSong.cover || "https://cdn.liteyuki.org/blog/background.png",
                backdropBlur: true,
                backgroundOpacity: "0.6",
                backgroundBlendMode: "normal",
                backgroundOverlay: true,
                overlayColor: "bg-slate-200",
                overlayColorDark: "dark:bg-slate-500",
                overlayBlendMode: "multiply",
            }
        });
        lastSongTitleRef.current = title;
    }, [currentSong, updateWindow, windowId]);

    // 获取封面图片URL，如果没有就使用默认图片
    const coverUrl = currentSong?.cover || "/images/default-cover.jpg";

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* 背景图片层 */}
            <div
                className="absolute inset-0 z-0 transition-all duration-1000 ease-out"
                style={{
                    backgroundImage: `url(${coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(30px) brightness(0.7)',
                    transform: 'scale(1.1)', // 稍微放大以避免模糊边缘
                }}
            />
            {/* 其余背景层和内容层不变 */}
            {/* 叠加渐变层，增强可读性 */}
            <div
                className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 to-black/50 dark:from-black/30 dark:to-black/60"
            />
            {/* 主题适应蒙版层 - 亮色时添加冷色调蒙版，暗色时添加暖色调蒙版 */}
            <div className="absolute inset-0 z-1 mix-blend-soft-light bg-blue-100/40 dark:bg-amber-900/40 transition-colors duration-300" />
            {/* 明暗统一调整蒙版 */}
            <div className="absolute inset-0 z-1 bg-slate-200/60 dark:bg-slate-500/40 backdrop-blur-[2px] transition-colors duration-300" />
            {/* 内容层 */}
            <div className="flex flex-col h-full z-10 relative">
                <PlayerView wid={windowId} />
                <MusicControls isMobile={isMobile} />
            </div>
        </div>
    );
}