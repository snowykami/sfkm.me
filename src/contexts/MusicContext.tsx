"use client";

import React, {
    createContext,
    useContext,
    useRef,
    useState,
    useEffect,
    ReactNode,
    useCallback
} from "react";
import Lyric from "lrc-file-parser";
import config from "@/config";
import { Song, SongOrPromise } from "@/types/music";
import { t } from "i18next";

type PlayMode = "order" | "repeat-one" | "shuffle";

const STORAGE_KEY = "musicplayer_state";
const PLAYMODE_KEY = "musicplayer_playmode";
const VOLUME_KEY = "musicplayer_volume";
const MUTE_KEY = "musicplayer_muted";

interface MusicContextType {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    isPlaying: boolean;
    currentSong: Song | null;
    currentSongIndex: number;
    playMode: PlayMode;
    displayLrc: string;
    coverRotate: number;
    lyricRef: React.RefObject<Lyric | null>;
    currentLrcLine: number;
    lrcLines: { time: number; text: string }[];
    handlePlayPause: () => void;
    handlePrev: () => void;
    handleNext: () => void;
    handleSwitchPlayMode: () => void;
    handleEnded: () => void;
    onLrcLineChange: (cb: (line: number, text: string) => void) => () => void;
    getAllSongs: () => (Song | Promise<Song>)[];
    resolvedSongs: Song[] | null;
    isLoadingSongs: boolean;
    handlePlaySong: (index: number) => void;
    volume: number;
    isMuted: boolean;
    handleVolumeChange: (volume: number) => void;
    handleToggleMute: () => void;
    // 新增：音乐命令处理接口
    handleMusicCommand: (subCommand: string, args: string[]) => string;
}

const initialSongs: SongOrPromise[] = config.musics;

// 新增：全局维护的歌曲缓存（可为 Song 或 Promise<Song>）
let cachedSongList: (Song | Promise<Song>)[] | null = null;

const songRetryCount: Record<number, number> = {};
const MAX_RETRY = 3;
const RETRY_DELAY = 2000; // 2秒

// 新增：后台静默替换 Promise 为 Song 的函数
function backgroundResolveSongs() {
    if (!cachedSongList) return;
    cachedSongList.forEach((item, idx) => {
        if (item instanceof Promise) {
            item.then(song => {
                if (cachedSongList && cachedSongList[idx] === item) {
                    cachedSongList[idx] = song;
                    songRetryCount[idx] = 0; // 成功后清零
                }
            }).catch(() => {
                // 失败时重试
                songRetryCount[idx] = (songRetryCount[idx] || 0) + 1;
                if (songRetryCount[idx] <= MAX_RETRY) {
                    setTimeout(() => {
                        // 重新触发 Promise
                        const original = initialSongs[idx];
                        if (typeof original === "function") {
                            cachedSongList![idx] = (original as () => Promise<Song>)();
                            backgroundResolveSongs();
                        }
                    }, RETRY_DELAY);
                }
            });
        }
    });
}

function getInitialState(totalSongs: number) {
    if (typeof window !== "undefined") {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const { index, time } = JSON.parse(saved);
                if (
                    typeof index === "number" &&
                    index >= 0 &&
                    index < totalSongs &&
                    typeof time === "number" &&
                    time >= 0
                ) {
                    return { index, time };
                }
            }
        } catch { }
        return { index: Math.floor(Math.random() * totalSongs), time: 0 };
    }
    return { index: 0, time: 0 };
}

function getInitialPlayMode(): PlayMode {
    if (typeof window !== "undefined") {
        try {
            const saved = localStorage.getItem(PLAYMODE_KEY);
            if (saved === "repeat-one" || saved === "shuffle" || saved === "order") {
                return saved as PlayMode;
            }
        } catch { }
    }
    return "order";
}

function getInitialVolumeState() {
    if (typeof window !== "undefined") {
        try {
            const savedVolume = localStorage.getItem(VOLUME_KEY);
            const savedMuted = localStorage.getItem(MUTE_KEY);
            let initialVolume = 100;
            let initialMuted = false;
            if (savedVolume !== null) {
                const v = parseInt(savedVolume);
                if (!isNaN(v) && v >= 0 && v <= 100) {
                    initialVolume = v;
                }
            }
            if (savedMuted !== null) {
                initialMuted = savedMuted === "true";
            }
            return { volume: initialVolume, isMuted: initialMuted };
        } catch { }
    }
    return { volume: 100, isMuted: false };
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

interface MusicProviderProps {
    children: ReactNode;
}

interface LrcLineChangeCallback {
    (line: number, text: string): void;
}

export function MusicProvider({ children }: MusicProviderProps) {
    const [resolvedSongs, setResolvedSongs] = useState<Song[] | null>(null);
    const [isLoadingSongs, setIsLoadingSongs] = useState<boolean>(true);

    const [currentSongIndex, setCurrentSongIndex] = useState<number>(() => getInitialState(initialSongs.length).index);
    const [pendingSeek, setPendingSeek] = useState<number | null>(() => {
        const state = getInitialState(initialSongs.length);
        return state.time > 0 ? state.time : null;
    });
    const [playMode, setPlayMode] = useState<PlayMode>(getInitialPlayMode());
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [displayLrc, setDisplayLrc] = useState<string>("");
    const [currentLrc, setCurrentLrc] = useState<string>("");
    const [coverRotate, setCoverRotate] = useState<number>(0);
    const rotateRef = useRef<number>(0);
    const animFrameRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number>(0);
    const lyricRef = useRef<Lyric | null>(null);
    const lastLrcRef = useRef<string>("");
    const lrcSessionRef = useRef<number>(0);
    const [currentLrcLine, setCurrentLrcLine] = useState<number>(0);
    const [lrcLines, setLrcLines] = useState<{ time: number; text: string }[]>([]);
    const lrcLineChangeCbs = useRef<LrcLineChangeCallback[]>([]);
    const [volume, setVolume] = useState<number>(() => getInitialVolumeState().volume);
    const [isMuted, setIsMuted] = useState<boolean>(() => getInitialVolumeState().isMuted);

    function onLrcLineChange(cb: LrcLineChangeCallback): () => void {
        lrcLineChangeCbs.current.push(cb);
        return () => {
            lrcLineChangeCbs.current = lrcLineChangeCbs.current.filter(fn => fn !== cb);
        };
    }

    // 优化后的 getAllSongs：立即返回当前缓存列表（Song 或 Promise），并后台解析
    const getAllSongs = useCallback((): (Song | Promise<Song>)[] => {
        if (!cachedSongList) {
            cachedSongList = initialSongs.map(songOrPromise => {
                if (typeof songOrPromise === "function") {
                    try {
                        return (songOrPromise as () => Promise<Song>)();
                    } catch {
                        return Promise.reject();
                    }
                }
                return songOrPromise;
            });
            backgroundResolveSongs();
        }
        backgroundResolveSongs();
        return cachedSongList;
    }, []);

    // 只用于首次加载全部已解析歌曲（不影响 getAllSongs 的即时返回）
    useEffect(() => {
        let cancelled = false;
        async function loadSongs() {
            setIsLoadingSongs(true);
            try {
                const all = getAllSongs();

                // 1. 优先加载当前索引的歌曲
                const currentItem = all[currentSongIndex];
                let currentSongResolved: Song | null = null;

                if (currentItem) {
                    try {
                        // 如果是 Promise，立即解析
                        if (currentItem instanceof Promise) {
                            currentSongResolved = await currentItem;
                        } else {
                            currentSongResolved = currentItem as Song;
                        }

                        // 立即设置当前歌曲，不等待其他歌曲
                        if (currentSongResolved && !cancelled) {
                            setCurrentSong(currentSongResolved);
                            // 创建临时已解析歌曲列表，只包含当前歌曲
                            const tempResolved = new Array(all.length);
                            tempResolved[currentSongIndex] = currentSongResolved;
                            setResolvedSongs(tempResolved.filter((s): s is Song => !!s));
                        }
                    } catch (error) {
                        console.error("Failed to load current song:", error);
                    }
                }

                // 2. 后台加载其余歌曲
                if (!cancelled) {
                    // 继续加载所有歌曲，但不阻塞UI
                    Promise.all(
                        all.map(async (s, idx) => {
                            // 当前歌曲已加载，跳过
                            if (idx === currentSongIndex && currentSongResolved) {
                                return currentSongResolved;
                            }

                            if (s instanceof Promise) {
                                try {
                                    return await s;
                                } catch {
                                    return null;
                                }
                            }
                            return s as Song;
                        })
                    ).then(allResults => {
                        if (!cancelled) {
                            setResolvedSongs(allResults.filter((s): s is Song => !!s));
                            setIsLoadingSongs(false);
                        }
                    }).catch(error => {
                        console.error("Failed to load all songs:", error);
                        if (!cancelled) {
                            setIsLoadingSongs(false);
                        }
                    });
                }
            } catch (error) {
                console.error("Error in loadSongs:", error);
                if (!cancelled) {
                    setIsLoadingSongs(false);
                }
            }
        }
        loadSongs();
        return () => { cancelled = true; };
    }, [getAllSongs, currentSongIndex]);

    useEffect(() => {
        if (resolvedSongs && resolvedSongs.length > 0) {
            const safeIndex = Math.max(0, Math.min(currentSongIndex, resolvedSongs.length - 1));
            const song = resolvedSongs[safeIndex];
            setCurrentSong(song);
        } else if (!isLoadingSongs && (!resolvedSongs || resolvedSongs.length === 0)) {
            setCurrentSong(null);
            setIsPlaying(false);
        }
    }, [currentSongIndex, resolvedSongs, isLoadingSongs]);

    // 修改 useEffect 以处理 lrc 为 Promise 的情况
    useEffect(() => {
        setCurrentLrc("");
        lastLrcRef.current = "";
        lrcSessionRef.current += 1;
        const thisSession = lrcSessionRef.current;

        if (lyricRef.current) {
            lyricRef.current.pause();
            lyricRef.current = null;
        }

        if (!currentSong?.lrc) {
            setDisplayLrc("");
            setLrcLines([]);
            setCurrentLrcLine(0);
            return;
        }

        const handleLrc = async (lrcContent: string | Promise<string>) => {
            if (lrcSessionRef.current !== thisSession) return;

            let finalLrc: string;
            try {
                // 处理 lrc 可能是 Promise 的情况
                if (lrcContent instanceof Promise) {
                    finalLrc = await lrcContent;
                } else {
                    finalLrc = lrcContent as string;
                }

                const parser = new Lyric({
                    lyric: finalLrc,
                    offset: currentSong?.offset ?? 0,
                    onPlay: (lineNum: number, text: string) => {
                        if (lrcSessionRef.current !== thisSession) return;
                        if (lineNum !== currentLrcLine) {
                            if (text.trim() !== "") {
                                setCurrentLrc(text);
                                setCurrentLrcLine(lineNum);
                                lrcLineChangeCbs.current.forEach(cb => cb(lineNum, text));
                            }
                        }
                    },
                });

                lyricRef.current = parser;
                setLrcLines(parser.lines || []);

                if (audioRef.current && isPlaying && audioRef.current.readyState >= 2) {
                    parser.play(audioRef.current.currentTime * 1000);
                }
            } catch (error) {
                console.error("Failed to load lyrics:", error);
                setDisplayLrc("");
                setLrcLines([]);
                setCurrentLrcLine(0);
            }
        };

        handleLrc(currentSong.lrc);

        return () => {
            lyricRef.current?.pause();
            lyricRef.current = null;
        };
    }, [currentLrcLine, currentSong, isPlaying]);

    useEffect(() => {
        if (currentLrc.trim() !== "") {
            setDisplayLrc(currentLrc);
        }
    }, [currentLrc]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const handleTimeUpdate = () => {
            if (!isPlaying) return;
            if (lyricRef.current && currentSong?.lrc) {
                const offset = currentSong.offset ?? 0;
                lyricRef.current.play(audio.currentTime * 1000 - offset);
            }
        };
        audio.addEventListener("timeupdate", handleTimeUpdate);
        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
        };
    }, [audioRef, currentSong?.lrc, currentSong?.offset, isPlaying]);

    const animate = useCallback((now: number) => {
        const delta = now - lastFrameTimeRef.current;
        lastFrameTimeRef.current = now;
        rotateRef.current += delta * 0.09;
        setCoverRotate(rotateRef.current);
        animFrameRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        if (!isPlaying) {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = 0;
            return;
        }
        lastFrameTimeRef.current = performance.now();
        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [isPlaying, animate]);

    useEffect(() => {
        rotateRef.current = 0;
        setCoverRotate(0);
    }, [currentSong]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const saveState = () => {
            if (audioRef.current && currentSong) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        index: currentSongIndex,
                        time: audioRef.current.currentTime,
                    })
                );
            }
        };
        const audio = audioRef.current;
        if (audio && currentSong?.src) {
            audio.addEventListener("timeupdate", saveState);
            window.addEventListener("beforeunload", saveState);
            return () => {
                audio.removeEventListener("timeupdate", saveState);
                window.removeEventListener("beforeunload", saveState);
            };
        }
        return () => {
            if (audio) {
                audio.removeEventListener("timeupdate", saveState);
            }
            window.removeEventListener("beforeunload", saveState);
        };
    }, [audioRef, currentSong?.src, currentSongIndex, currentSong]);

    const handleLoadedMetadata = useCallback((): void => {
        if (pendingSeek != null && audioRef.current) {
            audioRef.current.currentTime = pendingSeek;
            setPendingSeek(null);
        }
        if (isPlaying && audioRef.current) {
            audioRef.current.play().catch(() => { });
        }
    }, [pendingSeek, isPlaying, audioRef]);

    const handlePlayPause = useCallback((): void => {
        setIsPlaying(prev => {
            const audio = audioRef.current;
            if (audio) {
                audio.muted = false;
                if (!prev) {
                    audio.play().then(() => {
                        lyricRef.current?.play(audio.currentTime * 1000);
                    }).catch(() => {
                        setIsPlaying(false);
                    });
                } else {
                    audio.pause();
                    lyricRef.current?.pause();
                }
            }
            return !prev;
        });
    }, [audioRef, lyricRef]);

    const handleNext = useCallback((): void => {
        console.log("handleNext called with playMode:", playMode, "currentSongIndex:", currentSongIndex);
        if (!resolvedSongs || resolvedSongs.length === 0) return;
        let nextIndex: number;
        if (playMode === "shuffle") {
            nextIndex = Math.floor(Math.random() * resolvedSongs.length);
            if (resolvedSongs.length > 1 && nextIndex === currentSongIndex) {
                nextIndex = (nextIndex + 1) % resolvedSongs.length;
            }
        } else if (playMode === "repeat-one") {
            nextIndex = (currentSongIndex === resolvedSongs.length - 1 ? 0 : currentSongIndex + 1);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
                lyricRef.current?.play(0);
            }
            return;
        } else {
            nextIndex = (currentSongIndex === resolvedSongs.length - 1 ? 0 : currentSongIndex + 1);
        }
        setCurrentSongIndex(nextIndex);
        setIsPlaying(true);
    }, [playMode, currentSongIndex, resolvedSongs, audioRef, lyricRef]);

    const handlePrev = useCallback((): void => {
        if (!resolvedSongs || resolvedSongs.length === 0) return;
        let prevIndex: number;
        if (playMode === "shuffle") {
            prevIndex = Math.floor(Math.random() * resolvedSongs.length);
            if (resolvedSongs.length > 1 && prevIndex === currentSongIndex) {
                prevIndex = (prevIndex + 1) % resolvedSongs.length;
            }
        } else if (playMode === "repeat-one") {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
                lyricRef.current?.play(0);
            }
            return;
        } else {
            prevIndex = (currentSongIndex === 0 ? resolvedSongs.length - 1 : currentSongIndex - 1);
        }
        setCurrentSongIndex(prevIndex);
        setIsPlaying(true);
    }, [playMode, currentSongIndex, resolvedSongs, audioRef, lyricRef]);

    const handleEnded = useCallback((): void => {
        if (!resolvedSongs || resolvedSongs.length === 0) {
            setIsPlaying(false);
            return;
        }
        if (playMode === "repeat-one") {
            audioRef.current?.play().catch(() => { });
            lyricRef.current?.play(0);
        } else {
            let nextIndex: number;
            if (playMode === "shuffle") {
                nextIndex = Math.floor(Math.random() * resolvedSongs.length);
                if (resolvedSongs.length > 1 && nextIndex === currentSongIndex) {
                    nextIndex = (nextIndex + 1) % resolvedSongs.length;
                }
            } else {
                nextIndex = (currentSongIndex === resolvedSongs.length - 1 ? 0 : currentSongIndex + 1);
            }
            setCurrentSongIndex(nextIndex);
            setIsPlaying(true);
        }
    }, [playMode, currentSongIndex, resolvedSongs, audioRef, lyricRef]);

    const handleSwitchPlayMode = useCallback((): void => {
        setPlayMode((mode: PlayMode) => {
            let next: PlayMode;
            if (mode === "order") next = "repeat-one";
            else if (mode === "repeat-one") next = "shuffle";
            else next = "order";
            try {
                localStorage.setItem(PLAYMODE_KEY, next);
            } catch { }
            return next;
        });
    }, []);

    const handlePlaySong = useCallback((resolvedIndex: number): void => {
        // 只允许切换到已加载的歌曲
        if (resolvedSongs && resolvedIndex >= 0 && resolvedIndex < resolvedSongs.length) {
            setCurrentSongIndex(resolvedIndex);
            setIsPlaying(true);
            setPendingSeek(0);
        } else {
            // 不切换
            // console.warn("无法切换到指定索引的歌曲:", resolvedIndex, resolvedSongs);
        }
    }, [resolvedSongs, setCurrentSongIndex, setIsPlaying, setPendingSeek]);

    const handleVolumeChange = useCallback((newVolume: number): void => {
        const safeVolume = Math.max(0, Math.min(100, newVolume));
        setVolume(safeVolume);
        if (safeVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    }, [isMuted]);

    const handleToggleMute = useCallback((): void => {
        setIsMuted(prev => !prev);
    }, []);

    // 新增：处理音乐命令的函数
    const handleMusicCommand = useCallback((subCommand: string, args: string[]): string => {
        if (!subCommand) {
            if (currentSong) {
                return `${t("terminal.commands.music.nowPlaying")}: ${currentSong.title} - ${currentSong.artist}`;
            }
            return t("terminal.commands.music.help");
        }

        // 处理播放控制命令
        if (["next", "n"].includes(subCommand)) {
            handleNext();
            return t("terminal.commands.music.next");
        }
        else if (["prev", "p"].includes(subCommand)) {
            handlePrev();
            return t("terminal.commands.music.prev");
        }
        else if (["ended", "e"].includes(subCommand)) {
            handleEnded();
            return t("terminal.commands.music.ended");
        }
        else if (["pp", "playpause", "play", "pause"].includes(subCommand)) {
            handlePlayPause();
            return t("terminal.commands.music.playpause");
        }
        // 通过索引播放歌曲
        else if (["play", "goto"].includes(subCommand) && args[0]) {
            const index = parseInt(args[0]);
            if (!isNaN(index) && resolvedSongs && index >= 0 && index < resolvedSongs.length) {
                handlePlaySong(index);
                return t("terminal.commands.music.playIndex", {
                    index,
                    title: resolvedSongs[index].title,
                    artist: resolvedSongs[index].artist
                });
            }
            return t("terminal.commands.music.invalidIndex");
        }
        // 列出可用歌曲
        else if (["list", "ls"].includes(subCommand)) {
            if (!resolvedSongs || resolvedSongs.length === 0) {
                return t("terminal.commands.music.noSongs");
            }

            let songList = `<div class="terminal-table">\n`;
            songList += `<table style="width: 100%; border-collapse: collapse;">\n`;
            songList += `<thead><tr><th>ID</th><th>Title</th><th>Artist</th></tr></thead>\n`;
            songList += `<tbody>\n`;

            resolvedSongs.forEach((song, idx) => {
                const isPlaying = idx === currentSongIndex;
                songList += `<tr${isPlaying ? ' style="color: var(--color-primary);"' : ''}>\n`;
                songList += `<td>${idx}</td>\n`;
                songList += `<td>${song.title || t("terminal.commands.music.unknown")}</td>\n`;
                songList += `<td>${song.artist || t("terminal.commands.music.unknown")}</td>\n`;
                songList += `</tr>\n`;
            });

            songList += `</tbody></table></div>\n`;
            return songList;
        }

        return t("terminal.commands.music.unknown", { 
            subCommand, 
            help: t("terminal.commands.music.help") 
        });
    }, [
        currentSong, 
        handleNext, 
        handlePrev, 
        handleEnded, 
        handlePlayPause, 
        handlePlaySong, 
        resolvedSongs, 
        currentSongIndex
    ]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume / 100;
            audio.muted = isMuted;
        }
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem(VOLUME_KEY, String(volume));
                localStorage.setItem(MUTE_KEY, String(isMuted));
            } catch { }
        }
    }, [volume, isMuted, audioRef]);

    useEffect(() => {
        if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
        if (currentSong) {
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: currentSong.title,
                artist: currentSong.artist,
                album: currentSong.album,
                artwork: [
                    { src: currentSong.cover || "", sizes: "512x512", type: "image/png" }
                ]
            });
        } else {
            navigator.mediaSession.metadata = null;
        }
        navigator.mediaSession.setActionHandler("play", handlePlayPause as MediaSessionActionHandler);
        navigator.mediaSession.setActionHandler("pause", handlePlayPause as MediaSessionActionHandler);
        navigator.mediaSession.setActionHandler("previoustrack", handlePrev as MediaSessionActionHandler);
        navigator.mediaSession.setActionHandler("nexttrack", handleNext as MediaSessionActionHandler);
        navigator.mediaSession.setActionHandler("stop", (() => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
            }
        }) as MediaSessionActionHandler);
        navigator.mediaSession.setActionHandler("seekto", ((details: unknown) => {
            type SeekToDetails = { seekTime?: number };
            const d = details as SeekToDetails;
            if (audioRef.current && typeof d.seekTime === "number") {
                audioRef.current.currentTime = d.seekTime;
            }
        }) as MediaSessionActionHandler);
        navigator.mediaSession.setActionHandler("seekbackward", ((details: unknown) => {
            type SeekDetails = { seekOffset?: number };
            const d = details as SeekDetails;
            const seekOffset = d.seekOffset ?? 10;
            if (audioRef.current) {
                audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - seekOffset);
            }
        }) as MediaSessionActionHandler);
        navigator.mediaSession.setActionHandler("seekforward", ((details: unknown) => {
            type SeekDetails = { seekOffset?: number };
            const d = details as SeekDetails;
            const seekOffset = d.seekOffset ?? 10;
            if (audioRef.current && isFinite(audioRef.current.duration)) {
                audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + seekOffset);
            }
        }) as MediaSessionActionHandler);

        return () => {
            navigator.mediaSession.setActionHandler("play", null);
            navigator.mediaSession.setActionHandler("pause", null);
            navigator.mediaSession.setActionHandler("previoustrack", null);
            navigator.mediaSession.setActionHandler("nexttrack", null);
            navigator.mediaSession.setActionHandler("stop", null);
            navigator.mediaSession.setActionHandler("seekto", null);
            navigator.mediaSession.setActionHandler("seekbackward", null);
            navigator.mediaSession.setActionHandler("seekforward", null);
        };
    }, [currentSong, handlePlayPause, handlePrev, handleNext, audioRef]);

    return (
        <MusicContext.Provider
            value={{
                audioRef,
                isPlaying,
                currentSong,
                currentSongIndex,
                playMode,
                displayLrc,
                coverRotate,
                handlePlayPause,
                handlePrev,
                handleNext,
                handleSwitchPlayMode,
                handleEnded,
                lyricRef,
                currentLrcLine,
                lrcLines,
                onLrcLineChange,
                getAllSongs,
                resolvedSongs,
                isLoadingSongs,
                handlePlaySong,
                volume,
                isMuted,
                handleVolumeChange,
                handleToggleMute,
                // 新增：暴露命令处理接口
                handleMusicCommand
            }}
        >
            {currentSong?.src ? (
                <audio
                    ref={audioRef}
                    src={currentSong.src}
                    key={currentSongIndex}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                    preload="auto"
                    crossOrigin="anonymous"
                />
            ) : null}
            {children}
        </MusicContext.Provider>
    );
}

export function useMusic() {
    const context = useContext(MusicContext);
    if (context === undefined) {
        throw new Error("useMusic must be used within a MusicProvider");
    }
    return context;
}