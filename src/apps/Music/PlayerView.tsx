import { Marquee } from "@/components/ui/Marquee";
import { Disc, ExternalLink, User } from "lucide-react";
import { Album } from "./Album";
import LyricScroller from "./LyricScroller";

import { t } from "i18next";
import { useMusic } from "@/contexts/MusicContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";

const PlayerView = ({ wid }: { wid: string }) => {
    const { currentSong } = useMusic();
    const { isMobile: isMobileDevice } = useDevice();
    const { isMobileLayout } = useWindowManager();
    const isMobile = isMobileDevice || isMobileLayout(wid);
    return (
        <div className={`flex-1 flex ${isMobile ? "flex-col" : "flex-row"} min-h-0`} style={{ height: "90%" }}>
            {/* 左边 1/2 */}
            <div className="flex-shrink-0 w-full md:w-1/2 p-4 flex flex-col items-center justify-center">
                <Album wid={wid} />
            </div>
            {/* 右边：歌曲信息/歌词区域 1/2 */}
            <div className="flex-1 p-4 flex flex-col min-h-0 max-w-full overflow-hidden">
                {/* 歌曲信息区（顶部） */}
                <div className={`mb-4 ${isMobile ? "mt-0" : "mt-2"} max-w-full`}>
                    <div className={`text-2xl font-bold text-gray-900 dark:text-white mb-2 w-full overflow-hidden ${isMobile ? "text-center" : "text-left"}`}>
                        <Marquee pauseBeforeRepeatSec={1.5} speedPxPerSec={40}>
                            {currentSong?.title || t('music.noplay')}
                            <span className="text-gray-600 dark:text-gray-400/80">{currentSong?.alias?.length ? ` (${currentSong?.alias?.join(", ")})` : ""}</span>
                        </Marquee>
                    </div>
                    <div className={
                        `flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300 overflow-hidden
    ${isMobile ? "justify-center text-center" : ""}`
                    }>
                        <span className="flex items-center gap-1 min-w-0 overflow-hidden text-ellipsis">
                            <Disc className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{currentSong?.album || "--"}</span>
                        </span>
                        <span className="flex items-center gap-1 min-w-0 overflow-hidden text-ellipsis">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{currentSong?.artist || "--"}</span>
                        </span>
                        <span
                            className="flex items-center gap-1 min-w-0 overflow-hidden text-ellipsis cursor-pointer"
                            onClick={() => {
                                if (currentSong?.songLink) {
                                    window.open(currentSong.songLink, '_blank');
                                }
                            }}
                        >
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{t("music.from." + currentSong?.source || "unknown")}</span>
                        </span>
                    </div>
                </div>
                {/* 歌词区（底部，可滚动） */}
                <div className={`
                    flex-1 
                    min-h-0 
                    overflow-y-auto 
                    ${isMobile ? 'mt-0' : 'mt-2'} 
                    ${isMobile ? 'mb-0' : 'mb-4'}
                    overflow-x-hidden
                    w-full
                    `}>
                    <LyricScroller wid={wid} />
                </div>
            </div>
        </div>
    )
}

export default PlayerView;