'use client'

import type { AppProps } from '../BaseApp'
import type { WindowState } from '@/contexts/WindowManagerContext'
import { t } from 'i18next'
import React, { useEffect, useRef } from 'react'
import { useDevice } from '@/contexts/DeviceContext'
import { useMusic } from '@/contexts/MusicContext'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import MusicControls from './MusicControls'
import PlayerView from './PlayerView'

export const WINDOW_ID = 'music'

const OVERLAYCOLOR = 'bg-slate-200/40'
const OVERLAYCOLORDARK = 'dark:bg-slate-800/75'

export function getNewWindowColorScheme(colorScheme: Partial<WindowState['colorScheme']> = {}): WindowState['colorScheme'] {
  return {
    bg: 'bg-transparent',
    bgDark: 'dark:bg-transparent',
    titleBarBg: 'bg-transparent',
    titleBarBgDark: 'dark:bg-transparent',
    titleBarBorder: 'border-transparent',
    titleBarBorderDark: 'dark:border-transparent',
    showBorder: true,
    backdropBlur: true,
    backgroundOpacity: '0.8',
    backgroundBlendMode: 'normal',
    backgroundOverlay: true,
    backdropBlurClass: 'backdrop-blur-6xl',
    overlayColor: OVERLAYCOLOR,
    overlayColorDark: OVERLAYCOLORDARK,
    overlayBlendMode: 'normal',
    backgroundClassName: 'transition-all duration-600',
    ...colorScheme,
  }
}

export const musicWindowState: Partial<WindowState> = {
  colorScheme: getNewWindowColorScheme(),
}

export default function Music({ windowId = WINDOW_ID }: AppProps) {
  const { isMobile: isMobileDevice } = useDevice()
  const { isMobileLayout } = useWindowManager()
  const isMobile = isMobileDevice || isMobileLayout(windowId)

  const { currentTrack } = useMusic()
  const { updateWindow } = useWindowManager()
  const lastSongTitleRef = useRef<string | null>(null)
  const [currentCoverUrl, setCurrentCoverUrl] = React.useState<string | null>(
    null,
  )

  // 只更新标题，不更新样式
  useEffect(() => {
    if (!currentTrack)
      return
    const title = currentTrack.name || 'Music Player'
    const fullTitle = `${t('music.title')} - ${title}`
    if (lastSongTitleRef.current === title) {
      return
    }
    updateWindow(windowId, {
      title: fullTitle,
      colorScheme: getNewWindowColorScheme({
        backgroundImage:
          currentTrack.albumPic || 'https://cdn.liteyuki.org/blog/background.png',
      }),
    })
    lastSongTitleRef.current = title
    setCurrentCoverUrl(
      currentTrack.albumPic || 'https://cdn.liteyuki.org/blog/background.png',
    )
  }, [currentTrack, updateWindow, windowId])

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {isMobile && (
        <div
          className={`absolute inset-0 z-5 ${OVERLAYCOLOR} ${OVERLAYCOLORDARK} transition-colors duration-600`}
        />
      )}
      {/* 背景层 */}
      {isMobile && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-600 blur-3xl"
          style={{
            backgroundImage: `url(${currentCoverUrl})`,
          }}
        />
      )}
      {/* 内容层 */}
      <div className="flex flex-col h-full z-10 relative">
        <PlayerView wid={windowId} />
        <MusicControls />
      </div>
    </div>
  )
}
