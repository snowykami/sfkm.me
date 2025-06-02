import React, { useEffect, useState } from "react";
import { useMusic } from "@/contexts/MusicContext";
import Image from "next/image";
import { CirclePlay, CirclePause, SkipForward, SkipBack, Repeat, Repeat1, Shuffle } from "lucide-react";
import BaseWidget from "./BaseWidget";
import { Song } from "@/types/music";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { WINDOW_ID as musicWindowId } from '@/apps/Music';

type PlayMode = "order" | "repeat-one" | "shuffle";

const PLAY_MODE_ICONS: Record<PlayMode, React.ReactElement> = {
  order: <Repeat className="w-5 h-5 opacity-60" />,
  "repeat-one": <Repeat1 className="w-5 h-5 opacity-60" />,
  shuffle: <Shuffle className="w-5 h-5 opacity-60" />,
};

function LyricBox({
  onClick,
}: {
  onClick?: () => void;
}) {
  const { displayLrc, currentSong } = useMusic();
  // 当前显示的歌词
  const [currentLrc, setCurrentLrc] = useState(displayLrc);
  // 控制淡入淡出的状态
  const [fadeState, setFadeState] = useState<"fade-in" | "fade-out">("fade-in");

  const fadeDuration = 150; // 淡入淡出动画时长

  useEffect(() => {
    if (displayLrc !== currentLrc) {
      // 触发淡出动画
      setFadeState("fade-out");

      // 在淡出动画结束后切换歌词并触发淡入动画
      const timer = setTimeout(() => {
        setCurrentLrc(displayLrc);
        setFadeState("fade-in");
      }, fadeDuration); // 300ms是淡出动画的时长
      return () => clearTimeout(timer);
    }
  }, [displayLrc, currentLrc]);

  return (
    <div
      className="relative"
      style={{ minWidth: "4rem", maxWidth: "40rem", cursor: "pointer", width: "100%" }}
      onClick={onClick}
      title={currentSong?.title}
    >
      <div
        className="w-full text-right text-sm font-medium text-slate-700 dark:text-slate-300 pr-2"
        style={{
          whiteSpace: "nowrap",
          overflow: "visible",
          direction: "rtl",
          textAlign: "left",
        }}
      >
        <span
          style={{
            direction: "ltr",
            unicodeBidi: "plaintext",
            transition: `opacity ${fadeDuration / 1000}s`, // 300ms动画时长
            opacity: fadeState === "fade-in" ? 1 : 0,
            display: "inline-block",
          }}
        >
          {currentLrc || "No lyrics available"}
        </span>
      </div>
    </div>
  );
}

function CoverBox({
  currentSong,
  coverRotate,
  isPlaying,
  onClick,
}: {
  currentSong: Song | null;
  coverRotate: number;
  isPlaying: boolean;
  onClick?: () => void;
}) {
  return currentSong?.cover ? (
    <div
      className="flex items-center justify-center relative"
      style={{
        width: 22,
        height: 22,
        minWidth: 22,
        minHeight: 22,
        borderRadius: "50%",
        border: "1.5px solid #cbd5e1",
        background: "#f1f5f9",
        overflow: "hidden",
        marginRight: 4,
        transform: `rotate(${coverRotate}deg)`,
        transition: isPlaying ? undefined : "transform 0.2s linear",
        cursor: "pointer",
      }}
      onClick={onClick}
      title={currentSong?.title}
    >
      <Image
        src={currentSong.cover}
        alt={currentSong.album || "cover"}
        width={18}
        height={18}
        className="rounded-full"
        style={{ minWidth: 18, minHeight: 18 }}
        unoptimized
      />
    </div>
  ) : (
    <div
      className="rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-700"
      style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, marginRight: 4, cursor: "pointer" }}
      onClick={onClick}
      title={currentSong?.title}
    />
  );
}

function ControlButtons({
  handlePrev,
  handlePlayPause,
  handleNext,
  handleSwitchPlayMode,
  isPlaying,
  playMode,
}: {
  handlePrev: () => void;
  handlePlayPause: () => void;
  handleNext: () => void;
  handleSwitchPlayMode: () => void;
  isPlaying: boolean;
  playMode: PlayMode;
}) {
  return (
    <>
      <button onClick={handlePrev} className="p-1 text-slate-500 dark:text-slate-300 rounded-full">
        <SkipBack className="w-5 h-5" />
      </button>
      <button onClick={handlePlayPause} className="p-1 text-slate-500 dark:text-slate-300  rounded-full">
        {isPlaying ? <CirclePause className="w-5 h-5" /> : <CirclePlay className="w-5 h-5" />}
      </button>
      <button onClick={handleNext} className="p-1 text-slate-500 dark:text-slate-300 rounded-full">
        <SkipForward className="w-5 h-5" />
      </button>
      <button
        onClick={handleSwitchPlayMode}
        className="p-1 text-slate-500 dark:text-slate-300 rounded-full"
        title={
          playMode === "order"
            ? "顺序播放"
            : playMode === "repeat-one"
              ? "单曲循环"
              : "随机播放"
        }
        style={{ marginRight: 2 }}
      >
        {PLAY_MODE_ICONS[playMode]}
      </button>
    </>
  );
}

export function MusicControlWidget() {
  const {
    isPlaying,
    currentSong,
    playMode,
    coverRotate,
    handlePlayPause,
    handlePrev,
    handleNext,
    handleSwitchPlayMode,
  } = useMusic();

  const { openWindow } = useWindowManager();

  const handleOpenMusicApp = () => {
    openWindow(musicWindowId)
  };

  return (
    <BaseWidget
      className="px-0 py-0 bg-transparent hover:bg-transparent dark:hover:bg-transparent"
      style={{ minWidth: 0, width: "auto", padding: 0 }}
      title={currentSong ? `${currentSong.title} - ${currentSong.artist ?? ""}` : "音乐播放器"}
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center space-x-2 px-2 py-1">
          <LyricBox
            onClick={handleOpenMusicApp}
          />
          <CoverBox
            currentSong={currentSong}
            coverRotate={coverRotate}
            isPlaying={isPlaying}
            onClick={handleOpenMusicApp}
          />
          <ControlButtons
            handlePrev={handlePrev}
            handlePlayPause={handlePlayPause}
            handleNext={handleNext}
            handleSwitchPlayMode={handleSwitchPlayMode}
            isPlaying={isPlaying}
            playMode={playMode}
          />
        </div>
      </div>
    </BaseWidget>
  );
}