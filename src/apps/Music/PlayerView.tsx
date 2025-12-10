import { t } from 'i18next'
import { Disc, User } from 'lucide-react'
import { Marquee } from '@/components/ui/Marquee'
import { useDevice } from '@/contexts/DeviceContext'

import { useMusic } from '@/contexts/MusicContext'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import { Album } from './Album'
import LyricScroller from './LyricScroller'

function PlayerView({ wid }: { wid: string }) {
  const { currentTrack } = useMusic()
  const { isMobile: isMobileDevice } = useDevice()
  const { isMobileLayout } = useWindowManager()
  const isMobile = isMobileDevice || isMobileLayout(wid)
  return (
    <div
      className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} min-h-0`}
      style={{ height: '90%' }}
    >
      {/* 左边 1/2 */}
      <div className="flex-shrink-0 w-full md:w-1/2 p-4 flex flex-col items-center justify-center">
        <Album wid={wid} />
      </div>
      {/* 右边：歌曲信息/歌词区域 1/2 */}
      <div className="flex-1 p-2 flex flex-col min-h-0 max-w-full overflow-hidden">
        {/* 歌曲信息区（顶部） */}
        <div className={`mb-4 ${isMobile ? 'mt-0' : 'mt-0'} max-w-full`}>
          <div
            className={`text-2xl font-bold text-gray-900 dark:text-white mb-2 w-full overflow-hidden ${isMobile ? 'text-center' : 'text-left'}`}
          >
            <Marquee pauseBeforeRepeatSec={1.5} speedPxPerSec={40}>
              {currentTrack?.name || t('music.noplay')}
              <span className="text-gray-600 dark:text-gray-400/80">
                {currentTrack?.aliases?.length
                  ? ` (${currentTrack?.aliases?.join(', ')})`
                  : ''}
              </span>
            </Marquee>
          </div>
          <div
            className={`flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300 overflow-hidden
    ${isMobile ? 'justify-center text-center' : ''}`}
          >
            <span className="flex items-center gap-1 min-w-0 overflow-hidden text-ellipsis">
              <Disc className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{currentTrack?.album || '--'}</span>
            </span>
            <span className="flex items-center gap-1 min-w-0 overflow-hidden text-ellipsis">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{currentTrack?.artists.join(', ') || '--'}</span>
            </span>
            <span
              className="flex items-center gap-1 min-w-0 overflow-hidden text-ellipsis cursor-pointer"
              onClick={() => {
                if (currentTrack?.link) {
                  window.open(currentTrack.link, '_blank')
                }
              }}
            >
              {/* <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {t("music.from." + currentTrack?.source || "unknown")}
              </span> */}
            </span>
          </div>
        </div>
        {/* 歌词区（底部，可滚动） */}
        <div
          className={`
                    flex-1 
                    min-h-0 
                    overflow-y-auto 
                    ${isMobile ? 'mt-0' : 'mt-2'} 
                    ${isMobile ? 'mb-0' : 'mb-4'}
                    overflow-x-hidden
                    w-full
                    `}
        >
          <LyricScroller wid={wid} />
        </div>
      </div>
    </div>
  )
}

export default PlayerView
