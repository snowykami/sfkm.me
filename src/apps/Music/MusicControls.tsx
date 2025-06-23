"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMusic } from "@/contexts/MusicContext";
import { useDevice } from "@/contexts/DeviceContext";
import { t } from "i18next";
import {
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { Marquee } from "@/components/ui/Marquee";
import { Song } from "@/types/music";
import { deriveLyricThemeColors } from "@/utils/color";

// 加载中的歌曲常量
const LOADING_SONG: Song = {
  title: t("music.loading"),
  artist: t("music.loading"),
  album: t("music.loading"),
  src: t("music.loading"),
  cover: t("music.loading"),
  lrc: t("music.loading"),
  id: "loading-song",
};

function isLoadingSong(song: Song) {
  return song.src === LOADING_SONG.src && song.title === LOADING_SONG.title;
}

interface MusicControlsProps {
  isMobile: boolean;
}

export default function MusicControls({}: MusicControlsProps) {
  // 记录用户是否手动滚动了播放列表
  const [userScrolled, setUserScrolled] = useState(false);

  // 从 useMusic 上下文获取
  const {
    audioRef,
    currentSong,
    isPlaying,
    playMode,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSwitchPlayMode,
    getAllSongs,
    handlePlaySong,
    volume,
    isMuted,
    handleVolumeChange,
    currentTime,
    duration,
  } = useMusic();

  // 播放列表窗口状态
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [songsList, setSongsList] = useState<Song[] | null>(null);
  const playlistRef = useRef<HTMLDivElement>(null);
  const playlistButtonRef = useRef<HTMLButtonElement>(null);
  const playlistItemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // 音量窗口状态
  const [showVolume, setShowVolume] = useState(false);
  const volumeBtnRef = useRef<HTMLButtonElement>(null);
  const volumePopupRef = useRef<HTMLDivElement>(null);

  // 用于跟踪最后一次更新的播放列表
  const lastSongsList = useRef<string>("");

  // 搜索相关状态
  const [playlistSearch, setPlaylistSearch] = useState("");

  // 搜索过滤后的歌曲列表
  const filteredSongsList = useMemo(() => {
    if (!songsList) return null;
    if (!playlistSearch.trim()) return songsList;
    const keywords = playlistSearch.trim().toLowerCase().split(/\s+/);
    return songsList.filter((song) => {
      const text =
        `${song.title || ""} ${song.artist || ""} ${song.album || ""}`.toLowerCase();
      return keywords.every((kw) => text.includes(kw));
    });
  }, [songsList, playlistSearch]);

  // 进度条颜色 控制区
  const { getAlbumCoverColor } = useMusic();
  const { mode } = useDevice();
  const [progressTheme, setProgressTheme] = useState({
    day: "#000",
    night: "#000",
  });
  // 主题色衍生切换
  useEffect(() => {
    let mounted = true;
    getAlbumCoverColor().then((color) => {
      if (!mounted) return;
      setProgressTheme({
        day: deriveLyricThemeColors(color).dayProgress,
        night: deriveLyricThemeColors(color).nightProgress, // 使用 deriveLyricThemeColors 获取夜间主题色
      });
    });
    return () => {
      mounted = false;
    };
  }, [getAlbumCoverColor]);

  // 处理点击外部关闭播放列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        playlistRef.current &&
        !playlistRef.current.contains(event.target as Node) &&
        playlistButtonRef.current &&
        !playlistButtonRef.current.contains(event.target as Node)
      ) {
        setShowPlaylist(false);
      }
    };
    if (showPlaylist) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPlaylist]);

  // 关闭音量弹窗的点击事件
  useEffect(() => {
    if (!showVolume) return;
    const handleClick = (e: MouseEvent) => {
      if (
        volumePopupRef.current &&
        !volumePopupRef.current.contains(e.target as Node) &&
        volumeBtnRef.current &&
        !volumeBtnRef.current.contains(e.target as Node)
      ) {
        setShowVolume(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showVolume]);

  // 添加播放列表滚动事件监听
  useEffect(() => {
    const playlistElement = playlistRef.current;
    if (!playlistElement || !showPlaylist) return;

    // 监听 wheel 事件（鼠标滚轮）
    const handleWheel = () => {
      setUserScrolled(true);
    };

    // 监听 touchmove 事件（移动端滑动）
    const handleTouchMove = () => {
      setUserScrolled(true);
    };

    // 监听 scroll 事件（任何方式的滚动，包括滚动条拖动）
    const handleScroll = () => {
      setUserScrolled(true);
    };

    // 添加所有事件监听
    playlistElement.addEventListener("wheel", handleWheel, {
      passive: true,
    });
    playlistElement.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    playlistElement.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    // 清理事件监听
    return () => {
      playlistElement.removeEventListener("wheel", handleWheel);
      playlistElement.removeEventListener("touchmove", handleTouchMove);
      playlistElement.removeEventListener("scroll", handleScroll);
    };
  }, [showPlaylist]);

  function formatTime(sec: number) {
    if (!isFinite(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // 拖动进度条
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      // 不要 setCurrentTime(value);
    }
  };

  // 播放模式图标和提示
  const playModeIcon = (() => {
    if (playMode === "shuffle") return <Shuffle className="w-5 h-5" />;
    if (playMode === "repeat-one") return <Repeat1 className="w-5 h-5" />;
    return <Repeat className="w-5 h-5 rotate-0" />;
  })();

  const playModeText = (() => {
    if (playMode === "shuffle") return t("music.mode.shuffle");
    if (playMode === "repeat-one") return t("music.mode.single");
    return t("music.mode.loop");
  })();

  // 滚动到当前播放歌曲
  const scrollToCurrentSong = useCallback(() => {
    if (!showPlaylist || !songsList || !currentSong) return;

    // 找到当前歌曲在列表中的索引
    const currentIndex = songsList.findIndex(
      (song) => song.src === currentSong.src,
    );
    if (currentIndex === -1) return;

    // 获取对应的元素和容器
    const container = playlistRef.current;
    const target = playlistItemRefs.current[currentIndex];

    if (container && target) {
      // 计算目标位置 (居中显示)
      const containerHeight = container.clientHeight;
      const targetTop = target.offsetTop;
      const targetHeight = target.clientHeight;
      const scrollTo = targetTop - containerHeight / 2 + targetHeight / 2;

      // 使用平滑滚动
      container.scrollTo({
        top: scrollTo,
        behavior: "smooth",
      });
    }
  }, [currentSong, showPlaylist, songsList]);

  // 切换播放列表显示状态
  const handlePlaylistClick = () => {
    const nextShowState = !showPlaylist;
    setShowPlaylist(nextShowState);
    if (nextShowState) {
      // 重置用户滚动状态
      setUserScrolled(false);

      // 获取歌曲列表，仅在打开播放列表时执行一次
      const all = getAllSongs();
      const songs = all.map((s) =>
        typeof (s as Promise<Song>).then === "function"
          ? { ...LOADING_SONG }
          : (s as Song),
      );
      setSongsList(songs);

      // 更新最后的播放列表数据
      lastSongsList.current = JSON.stringify(songs);

      // 等待列表渲染后滚动到当前歌曲
      setTimeout(scrollToCurrentSong, 100);
    }
  };

  // 更新播放列表 fetch - 优化为较低频率更新
  useEffect(() => {
    if (!showPlaylist) return;

    // 首次加载已在 handlePlaylistClick 中完成，这里设置延迟更新
    const initialTimer = setTimeout(() => {
      const all = getAllSongs();
      const songs = all.map((s) =>
        typeof (s as Promise<Song>).then === "function"
          ? { ...LOADING_SONG }
          : (s as Song),
      );

      // 仅当有变化时才更新
      const songsJson = JSON.stringify(songs);
      if (songsJson !== lastSongsList.current) {
        setSongsList(songs);
        lastSongsList.current = songsJson;
      }
    }, 1000);

    // 后续使用更低频率的更新
    const intervalTimer = setInterval(() => {
      const all = getAllSongs();
      const songs = all.map((s) =>
        typeof (s as Promise<Song>).then === "function"
          ? { ...LOADING_SONG }
          : (s as Song),
      );

      // 仅当有变化时才更新
      const songsJson = JSON.stringify(songs);
      if (songsJson !== lastSongsList.current) {
        setSongsList(songs);
        lastSongsList.current = songsJson;
      }
    }, 3000); // 降低更新频率到3秒一次

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [showPlaylist, getAllSongs]);

  // 仅在打开播放列表时执行一次滚动
  useEffect(() => {
    if (showPlaylist && currentSong && !userScrolled) {
      setTimeout(scrollToCurrentSong, 100);
    }
  }, [showPlaylist, currentSong, userScrolled, scrollToCurrentSong]);

  // 播放列表点击事件，修正索引
  const handlePlaylistItemClick = (index: number) => {
    if (!songsList) return;
    const song = songsList[index];
    if (!song || isLoadingSong(song)) return;
    // 计算前面有多少 loading 项
    const n = songsList.slice(0, index).filter(isLoadingSong).length;
    // 真实 resolvedSongs 索引
    const resolvedIndex = index - n;
    handlePlaySong(resolvedIndex);
    // 点击后重置用户滚动状态
    setUserScrolled(false);
  };

  // 音量滑块变更
  const handleVolumeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    // 如果静音，调整音量时自动取消静音
    if (isMuted && v > 0) {
      handleVolumeChange(v);
    } else {
      handleVolumeChange(v);
    }
  };

  // 记忆当前播放歌曲的索引，避免每次渲染都重新计算
  // const currentSongIndex = songsList ? songsList.findIndex(song => song.src === currentSong?.src) : -1;

  return (
    <div className="shrink-0 bg-gray-800/10 dark:bg-stone-300/10">
      {/* 进度条单独一行 */}
      <div className="relative flex items-center h-0">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className={`
                w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400
                rounded-full appearance-none outline-none transition
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow
                [&::-webkit-slider-thumb]:border
                [&::-webkit-slider-thumb]:border-blue-400
                [&::-webkit-slider-thumb]:transition
                group-hover:[&::-webkit-slider-thumb]:opacity-100
                [&::-webkit-slider-thumb]:opacity-0
                dark:[&::-webkit-slider-thumb]:bg-blue-300
                dark:[&::-webkit-slider-thumb]:border-blue-300
                [&::-ms-fill-lower]:bg-blue-400
                [&::-ms-fill-upper]:bg-blue-600
            `}
          style={{
            accentColor:
              mode === "dark" ? progressTheme.night : progressTheme.day,
          }}
        />
        {/* 进度条背景 */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-gray-300 dark:bg-gray-700 rounded-full pointer-events-none"
          aria-hidden
        />
        {/* 已播放进度 */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none"
          style={{
            width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
            backgroundColor:
              mode === "dark" ? progressTheme.night : progressTheme.day,
          }}
          aria-hidden
        />
      </div>

      {/* 控制区 */}
      <div className="flex items-center px-4 py-2 bg-gray-100/40 dark:bg-gray-800/40 border-t border-gray-300 dark:border-gray-700">
        {/* 左边：播放模式+时间 */}
        <div className="flex flex-1 items-center justify-start gap-3">
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1"
            onClick={handleSwitchPlayMode}
            title={playModeText}
          >
            {playModeIcon}
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono select-none tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        {/* 中间：播放控制 */}
        <div className="flex flex-1 justify-center items-center gap-4">
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={handlePrev}
            title={t("music.prev")}
          >
            <SkipBack className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
          <button
            className="p-3 rounded-full bg-slate-600 dark:bg-slate-200 text-white dark:text-slate-800 shadow-lg hover:scale-105 transition"
            onClick={handlePlayPause}
            title={isPlaying ? t("music.pause") : t("music.play")}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7" />
            )}
          </button>
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={handleNext}
            title={t("music.next")}
          >
            <SkipForward className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
        </div>
        {/* 右边：音量/播放列表 */}
        <div className="flex flex-1 justify-end items-center gap-2 relative">
          {/* 音量按钮 */}
          <button
            ref={volumeBtnRef}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="音量"
            onClick={() => setShowVolume((v) => !v)}
          >
            <Volume2 className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          {/* 音量弹窗 */}
          {showVolume && (
            <div
              ref={volumePopupRef}
              className="absolute bottom-full right-14 mb-2 w-12 h-36 bg-white dark:bg-gray-800 rounded-md shadow-lg flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 z-50"
            >
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={handleVolumeInputChange}
                className="h-28 w-2 accent-blue-500 cursor-pointer"
                style={{ writingMode: "vertical-lr" }}
              />
              <div className="text-xs mt-2 text-gray-700 dark:text-gray-200 select-none">
                {volume}
              </div>
            </div>
          )}
          {/* 播放列表按钮，添加 ref 和 onClick */}
          <button
            ref={playlistButtonRef}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="播放列表"
            onClick={handlePlaylistClick}
          >
            <ListMusic className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          {/* 播放列表悬浮窗口 */}
          {showPlaylist && (
            <div
              ref={playlistRef}
              className="absolute bottom-full right-0 mb-2 w-64 h-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-y-auto border border-gray-200 dark:border-gray-700 z-50 scroll-smooth"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 z-10">
                {t("music.playlist")}
              </div>
              {/* 搜索框 */}
              <div className="sticky top-8 bg-white dark:bg-gray-800 px-2 py-1 z-10">
                <input
                  type="text"
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  placeholder={t("music.search") || "搜索歌曲/歌手/专辑"}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {filteredSongsList === null ? (
                <div className="p-2 text-center text-gray-500 dark:text-gray-400">
                  {t("music.loading")}...
                </div>
              ) : filteredSongsList.length === 0 ? (
                <div className="p-2 text-center text-gray-500 dark:text-gray-400">
                  {t("music.nosongs")}
                </div>
              ) : (
                <ul>
                  {filteredSongsList.map((song, index) => {
                    // 需要修正 currentSongIndex 的判断
                    const isCurrentSong = song.src === currentSong?.src;
                    const isLoading = isLoadingSong(song);

                    return (
                      <li
                        key={song.id || index}
                        ref={(el) => {
                          // 只在原始 songsList 里有的才赋值
                          const origIdx = songsList?.findIndex(
                            (s) => s.src === song.src,
                          );
                          if (origIdx !== undefined && origIdx >= 0)
                            playlistItemRefs.current[origIdx] = el;
                        }}
                        className={`p-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          isCurrentSong
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                        onClick={() => {
                          // 需要用原始 songsList 的索引
                          const origIdx =
                            songsList?.findIndex((s) => s.src === song.src) ??
                            -1;
                          if (origIdx >= 0) handlePlaylistItemClick(origIdx);
                        }}
                        style={
                          !isLoading
                            ? {}
                            : {
                                opacity: 0.5,
                                pointerEvents: "none",
                              }
                        }
                      >
                        {isCurrentSong ? (
                          <Marquee
                            pauseBeforeRepeatSec={1.5}
                            speedPxPerSec={40}
                          >
                            {song.title || t("music.notitle")} -{" "}
                            {song.artist || t("music.noartist")}
                          </Marquee>
                        ) : (
                          <div className="truncate">
                            {song.title || t("music.notitle")} -{" "}
                            {song.artist || t("music.noartist")}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
