"use client";

import React from "react";
import { AppProps } from "../BaseApp";
import { useDevice } from "@/contexts/DeviceContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { WindowState } from "@/contexts/WindowManagerContext";
import PlayerView from "./PlayerView";
import MusicControls from "./MusicControls";

export const WINDOW_ID = "music";

export const musicWindowState: Partial<WindowState> = {
    size: {
        width: 1600,
        height: 900
    }
};

export default function Music({ windowId = WINDOW_ID }: AppProps) {
    const { isMobile: isMobileDevice } = useDevice();
    const { isMobileLayout } = useWindowManager();
    const isMobile = isMobileDevice || isMobileLayout(windowId);

    return (
        <div className="flex flex-col h-full">
            <PlayerView wid={windowId} />
            <MusicControls isMobile={isMobile} />
        </div>
    );
}