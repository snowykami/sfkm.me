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
            <div className="flex-1 p-4 flex flex-col min-h-0">
                {/* 歌曲信息区（顶部） */}
                <div className={`mb-4 ${isMobile ? "mt-0" : "mt-2"}`}>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        <Marquee>
                            {currentSong?.title || t('music.noplay')}
                        </Marquee>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                            <Disc className="w-4 h-4" /> {currentSong?.album || "--"}
                        </span>
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4" /> {currentSong?.artist || "--"}
                        </span>
                        <span
                            className="flex items-center gap-1"
                            onClick={() => {
                                if (currentSong?.songLink) {
                                    window.open(currentSong.songLink, '_blank');
                                }
                            }}
                        >
                            <ExternalLink className="w-4 h-4" /> {t("music.from." + currentSong?.from || "unknown")}
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
                    overflow-x-hidden /* 添加水平溢出隐藏 */
                    w-full /* 确保占满可用宽度 */
                    `}>
                    <LyricScroller wid={wid} />
                </div>
            </div>
        </div>
    )
}

export default PlayerView;