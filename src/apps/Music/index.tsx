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

const OVERLAYCOLOR = "bg-slate-200/40";
const OVERLAYCOLORDARK = "dark:bg-slate-800/75";

export const getNewWindowColorScheme = (colorScheme: Partial<WindowState["colorScheme"]> = {}): WindowState["colorScheme"] => {
    return {
        bg: "bg-transparent",
        bgDark: "dark:bg-transparent",
        titleBarBg: "bg-transparent",
        titleBarBgDark: "dark:bg-transparent",
        titleBarBorder: "border-transparent",
        titleBarBorderDark: "dark:border-transparent",
        showBorder: false,
        backdropBlur: true,
        backgroundOpacity: "0.8",
        backgroundBlendMode: "normal",
        backgroundOverlay: true,
        backdropBlurClass: "backdrop-blur-3xl",
        overlayColor: OVERLAYCOLOR,
        overlayColorDark: OVERLAYCOLORDARK,
        overlayBlendMode: "normal",
        backgroundClassName: "transition-all duration-300",
        ...colorScheme,
    };
}

export const musicWindowState: Partial<WindowState> = {
    colorScheme: getNewWindowColorScheme(),
};


export default function Music({ windowId = WINDOW_ID }: AppProps) {
    const { isMobile: isMobileDevice } = useDevice();
    const { isMobileLayout } = useWindowManager();
    const isMobile = isMobileDevice || isMobileLayout(windowId);

    const { currentSong } = useMusic();
    const { updateWindow } = useWindowManager();
    const lastSongTitleRef = useRef<string | null>(null);
    const [currentCoverUrl, setCurrentCoverUrl] = React.useState<string | null>(null);

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
            colorScheme: getNewWindowColorScheme({
                backgroundImage: currentSong.cover || "https://cdn.liteyuki.org/blog/background.png",
            })
        });
        lastSongTitleRef.current = title;
        setCurrentCoverUrl(currentSong.cover || "https://cdn.liteyuki.org/blog/background.png");
    }, [currentSong, updateWindow, windowId]);

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* <div
                className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 to-black/30 dark:from-black/10 dark:to-black/20"
            /> */}
            {/* 移动端没有窗口 */}
            {isMobile && (
                <div className={`absolute inset-0 z-5 ${OVERLAYCOLOR} ${OVERLAYCOLORDARK} transition-colors duration-300`} />
            )}
            {/* 背景层 */}
            {isMobile && (
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-300 blur-3xl"
                    style={{
                        backgroundImage: `url(${currentCoverUrl})`,
                    }}
                />
            )}
            {/* 内容层 */}
            <div className="flex flex-col h-full z-10 relative">
                <PlayerView wid={windowId} />
                <MusicControls isMobile={isMobile} />
            </div>
        </div>
    );
}