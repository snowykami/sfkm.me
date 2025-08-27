import { useCallback, useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";
import BaseWidget from "./BaseWidget";

export function FullscreenSwitch() {
    // 全屏状态
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handler);
        return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const handleFullscreen = useCallback(() => {
        if (isFullscreen) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }, [isFullscreen]);

    return (
        <BaseWidget
            title={isFullscreen ? "退出全屏" : "切换全屏"}
            onClick={handleFullscreen}
            aria-label="切换全屏"
        >
            {isFullscreen ? (
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400"  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="10" y1="14" x2="3" y2="21" /></svg>
            ) : (
                <Maximize2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            )}
        </BaseWidget>
    );
}

export default FullscreenSwitch;
