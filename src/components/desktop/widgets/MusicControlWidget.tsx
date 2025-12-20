'use client'

import type { PlayMode } from '@/contexts/MusicContext'
import type { MusicTrack } from '@/models/music'
import { t } from 'i18next'
import {
  CirclePause,
  CirclePlay,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import { WINDOW_ID as musicWindowId } from '@/apps/Music'
import { useMusic } from '@/contexts/MusicContext'
import { useWindowManager } from '@/contexts/WindowManagerContext'
import BaseWidget from './BaseWidget'

const PLAY_MODE_ICONS: Record<PlayMode, React.ReactElement> = {
  'repeat-all': <Repeat className="w-5 h-5 opacity-60" />,
  'repeat-one': <Repeat1 className="w-5 h-5 opacity-60" />,
  'shuffle': <Shuffle className="w-5 h-5 opacity-60" />,
}

function LyricBox({ onClick }: { onClick?: () => void }) {
  const { currentLyric, currentTrack } = useMusic()
  const [fadeState, setFadeState] = useState<'fade-in' | 'fade-out'>('fade-in')
  const prevLyricRef = useRef<string>('')

  const fadeDuration = 150 // 淡入淡出动画时长

  // 获取要显示的文本：优先显示歌词，没有歌词时显示歌曲信息
  const displayText = currentLyric
    || (currentTrack ? `${currentTrack.name} - ${currentTrack.artists.join('/')}` : '暂无播放')

  // 监听歌词变化，触发淡入淡出效果
  useEffect(() => {
    if (displayText !== prevLyricRef.current) {
      setFadeState('fade-out')
      const timer = setTimeout(() => {
        setFadeState('fade-in')
        prevLyricRef.current = displayText
      }, fadeDuration)
      return () => clearTimeout(timer)
    }
  }, [displayText, fadeDuration])
  return (
    <div
      className="relative"
      style={{
        minWidth: '4rem',
        maxWidth: '40rem',
        cursor: 'pointer',
        width: '100%',
      }}
      onClick={onClick}
      title={currentTrack?.name}
    >
      <div
        className="w-full text-right text-sm font-medium text-slate-700 dark:text-slate-300 pr-2"
        style={{
          whiteSpace: 'nowrap',
          overflow: 'visible',
          direction: 'rtl',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            direction: 'ltr',
            unicodeBidi: 'plaintext',
            transition: `opacity ${fadeDuration / 1000}s`,
            opacity: fadeState === 'fade-in' ? 1 : 0,
            display: 'inline-block',
          }}
        >
          {t(`music.${displayText}`, displayText)}
        </span>
      </div>
    </div>
  )
}

function CoverBox({
  currentTrack,
  rotateDeg,
  isPlaying,
  onClick,
}: {
  currentTrack: MusicTrack | null
  rotateDeg: number
  isPlaying: boolean
  onClick?: () => void
}) {
  return currentTrack?.albumPic
    ? (
        <div
          className="flex items-center justify-center relative"
          style={{
            width: 22,
            height: 22,
            minWidth: 22,
            minHeight: 22,
            borderRadius: '50%',
            border: '1.5px solid #cbd5e1',
            background: '#f1f5f9',
            overflow: 'hidden',
            marginRight: 4,
            transform: `rotate(${rotateDeg * 2}deg)`,
            transition: isPlaying ? undefined : 'transform 0.2s linear',
            cursor: 'pointer',
          }}
          onClick={onClick}
          title={currentTrack?.album}
        >
          <Image
            src={currentTrack.albumPic}
            alt={currentTrack.album || 'cover'}
            width={18}
            height={18}
            className="rounded-full"
            style={{ minWidth: 18, minHeight: 18 }}
            unoptimized
          />
        </div>
      )
    : (
        <div
          className="rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-700"
          style={{
            width: 18,
            height: 18,
            minWidth: 18,
            minHeight: 18,
            marginRight: 4,
            cursor: 'pointer',
          }}
          onClick={onClick}
          title={currentTrack?.album || 'no cover'}
        />
      )
}

function ControlButtons({
  handlePrev,
  handlePlayPause,
  handleNext,
  handleSwitchPlayMode,
  isPlaying,
}: {
  handlePrev: () => void
  handlePlayPause: () => void
  handleNext: () => void
  handleSwitchPlayMode: () => void
  isPlaying: boolean
}) {
  const { playMode } = useMusic()
  return (
    <>
      <button
        onClick={handlePrev}
        className="p-1 text-slate-500 dark:text-slate-300 rounded-full"
      >
        <SkipBack className="w-5 h-5" />
      </button>
      <button
        onClick={handlePlayPause}
        className="p-1 text-slate-500 dark:text-slate-300  rounded-full"
      >
        {isPlaying
          ? (
              <CirclePause className="w-5 h-5" />
            )
          : (
              <CirclePlay className="w-5 h-5" />
            )}
      </button>
      <button
        onClick={handleNext}
        className="p-1 text-slate-500 dark:text-slate-300 rounded-full"
      >
        <SkipForward className="w-5 h-5" />
      </button>
      <button
        onClick={handleSwitchPlayMode}
        className="p-1 text-slate-500 dark:text-slate-300 rounded-full"
        title={
          playMode === 'repeat-all'
            ? '顺序播放'
            : playMode === 'repeat-one'
              ? '单曲循环'
              : '随机播放'
        }
        style={{ marginRight: 2 }}
      >
        {PLAY_MODE_ICONS[playMode]}
      </button>
    </>
  )
}

export function MusicControlWidget() {
  const {
    isPlaying,
    currentTrack,
    playMode,
    rotateDeg,
    togglePlay,
    prev,
    next,
    setPlayMode,
  } = useMusic()

  const { openWindow } = useWindowManager()

  const handleOpenMusicApp = () => {
    openWindow(musicWindowId)
  }

  return (
    <BaseWidget
      className="px-0 py-0 bg-transparent hover:bg-transparent dark:hover:bg-transparent"
      style={{ minWidth: 0, width: 'auto', padding: 0 }}
      title={
        currentTrack
          ? `${currentTrack.name} - ${currentTrack.artists.join('/')}`
          : '音乐播放器'
      }
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center space-x-2 px-2 py-1">
          <LyricBox onClick={handleOpenMusicApp} />
          <CoverBox
            currentTrack={currentTrack}
            rotateDeg={rotateDeg}
            isPlaying={isPlaying}
            onClick={handleOpenMusicApp}
          />
          <ControlButtons
            handlePrev={prev}
            handlePlayPause={togglePlay}
            handleNext={next}
            handleSwitchPlayMode={() => {
              const nextMode = playMode === 'repeat-all' ? 'repeat-one' : playMode === 'repeat-one' ? 'shuffle' : 'repeat-all'
              setPlayMode(nextMode)
            }}
            isPlaying={isPlaying}
          />
        </div>
      </div>
    </BaseWidget>
  )
}
