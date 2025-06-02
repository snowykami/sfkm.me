"use client";

import React, { useEffect, useRef, useState } from "react";
import { AppProps } from "../BaseApp";
import { useMusic } from "@/contexts/MusicContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { t } from "i18next";
import { WindowState } from "@/contexts/WindowManagerContext";
import { ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Marquee } from "@/components/ui/Marquee";

import { Song } from "@/types/music";
import MusicCommandRegister from './CommandRegister';
import PlayerView from "./PlayerView";


export const WINDOW_ID = "music";

export const musicWindowState: Partial<WindowState> = {
    size: {
        width: 1600,
        height: 900
    }
};

const LOADING_SONG: Song = {
    title: t('music.loading'),
    artist: t('music.loading'),
    album: t('music.loading'),
    src: t('music.loading'),
    cover: t('music.loading'),
    lrc: t('music.loading'),
};

function isLoadingSong(song: Song) {
    return song.src === LOADING_SONG.src && song.title === LOADING_SONG.title;
}

export default function Music({ windowId = WINDOW_ID }: AppProps) {
    // 当前播放时间和总时长
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);

    // 从 useMusic 上下文获取
    const {
        audioRef, currentSong, isPlaying, playMode, handlePlayPause, handleNext, handlePrev,
        handleSwitchPlayMode, getAllSongs, handlePlaySong,
        volume, isMuted, handleVolumeChange
    } = useMusic();
    const { isMobile: isMobileDevice } = useDevice();
    const { isMobileLayout } = useWindowManager();
    const isMobile = isMobileDevice || isMobileLayout(windowId);

    // 播放列表窗口状态
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [songsList, setSongsList] = useState<Song[] | null>(null);
    const playlistRef = useRef<HTMLDivElement>(null);
    const playlistButtonRef = useRef<HTMLButtonElement>(null);

    // 音量窗口状态
    const [showVolume, setShowVolume] = useState(false);
    const volumeBtnRef = useRef<HTMLButtonElement>(null);
    const volumePopupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const update = () => setCurrentTime(audio.currentTime);
        const loaded = () => {
            setDuration(audio.duration || 0);
        };
        if (isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
        }
        audio.addEventListener("timeupdate", update);
        audio.addEventListener("loadedmetadata", loaded);
        return () => {
            audio.removeEventListener("timeupdate", update);
            audio.removeEventListener("loadedmetadata", loaded);
        };
    }, [audioRef, currentSong?.src, isMobile]);

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
            setCurrentTime(value);
        }
    };

    // 播放模式图标和提示
    const playModeIcon = (() => {
        if (playMode === "shuffle") return <Shuffle className="w-5 h-5" />;
        if (playMode === "repeat-one") return <Repeat1 className="w-5 h-5" />;
        return <Repeat className="w-5 h-5 rotate-0" />;
    })();

    const playModeText = (() => {
        if (playMode === "shuffle") return t('music.mode.shuffle');
        if (playMode === "repeat-one") return t('music.mode.single');
        return t('music.mode.loop');
    })();

    // 切换播放列表显示状态
    const handlePlaylistClick = () => {
        const nextShowState = !showPlaylist;
        setShowPlaylist(nextShowState);
        if (nextShowState) {
            const all = getAllSongs();
            const songs = all.map(s =>
                typeof (s as Promise<Song>).then === "function"
                    ? { ...LOADING_SONG }
                    : (s as Song)
            );
            setSongsList(songs);
        }
    };
    // 更新播放列表 fetch
    useEffect(() => {
        if (!showPlaylist) return;
        const timer = setInterval(() => {
            const all = getAllSongs();
            const songs = all.map(s =>
                typeof (s as Promise<Song>).then === "function"
                    ? { ...LOADING_SONG }
                    : (s as Song)
            );
            setSongsList(songs);
        }, 1000);
        return () => clearInterval(timer);
    }, [showPlaylist, getAllSongs]);

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

    return (
        <div className="flex flex-col h-full">
            <PlayerView wid={windowId} />
            {/* 音乐控制区，始终在底部 */}
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
                            accentColor: "#3b82f6",
                        }}
                    />
                    {/* 进度条背景 */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-gray-300 dark:bg-gray-700 rounded-full pointer-events-none"
                        aria-hidden
                    />
                    {/* 已播放进度 */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full pointer-events-none"
                        style={{
                            width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                        }}
                        aria-hidden
                    />
                </div>

                {/* 控制区 */}
                <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
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
                            title={t('music.prev')}
                        >
                            <SkipBack className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                        </button>
                        <button
                            className="p-3 rounded-full bg-slate-600 dark:bg-slate-200 text-white dark:text-slate-800 shadow-lg hover:scale-105 transition"
                            onClick={handlePlayPause}
                            title={isPlaying ? t('music.pause') : t('music.play')}
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
                            title={t('music.next')}
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
                            onClick={() => setShowVolume(v => !v)}
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
                                <div className="text-xs mt-2 text-gray-700 dark:text-gray-200 select-none">{volume}</div>
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
                                className="absolute bottom-full right-0 mb-2 w-64 h-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-y-auto border border-gray-200 dark:border-gray-700 z-50"
                            >
                                <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 z-10">
                                    {t('music.playlist')}
                                </div>
                                {songsList === null ? (
                                    <div className="p-2 text-center text-gray-500 dark:text-gray-400">
                                        {t('music.loading')}...
                                    </div>
                                ) : songsList.length === 0 ? (
                                    <div className="p-2 text-center text-gray-500 dark:text-gray-400">
                                        {t('music.nosongs')}
                                    </div>
                                ) : (
                                    <ul>
                                        {songsList.map((song, index) => (
                                            <li
                                                key={index}
                                                className={`p-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${currentSong?.src === song.src
                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                                    : 'text-gray-800 dark:text-gray-200'
                                                    }`}
                                                onClick={() => handlePlaylistItemClick(index)}
                                                style={!isLoadingSong(song) ? {} : { opacity: 0.5, pointerEvents: "none" }}
                                            >
                                                <Marquee>
                                                    {song.title || t('music.notitle')} - {song.artist || t('music.noartist')}
                                                </Marquee>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <MusicCommandRegister />
        </div>
    );
}