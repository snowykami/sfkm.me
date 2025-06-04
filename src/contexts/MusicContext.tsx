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
const DEFAULT_COVER_COLOR = "#6b7280"; // 灰色

// 新的统一歌曲类型，包含加载状态
export type TrackState =
    | { status: 'loading', originalIndex: number }              // 加载中
    | { status: 'loaded', originalIndex: number, data: Song }   // 加载成功
    | { status: 'error', originalIndex: number, retries: number }; // 加载失败

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
    resolvedSongs: Song[] | null; // 保持向后兼容
    isLoadingSongs: boolean;
    handlePlaySong: (index: number) => void;
    volume: number;
    isMuted: boolean;
    handleVolumeChange: (volume: number) => void;
    handleToggleMute: () => void;
    handleMusicCommand: (subCommand: string, args: string[]) => string;
    getAlbumCoverColor: () => Promise<string>;
    currentTime: number;
    duration: number;

}

const MAX_RETRY = 3;
const RETRY_DELAY = 2000; // 2秒

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
    // 使用统一的 tracks 数组替代 initialSongs 和 resolvedSongs
    const [tracks, setTracks] = useState<TrackState[]>(() =>
        config.musics.map((_, idx) => ({
            status: 'loading',
            originalIndex: idx
        }))
    );

    const [isLoadingSongs, setIsLoadingSongs] = useState<boolean>(true);

    // 获取初始索引（基于原始索引）
    const initialState = getInitialState(config.musics.length);
    const [currentSongIndex, setCurrentSongIndex] = useState<number>(initialState.index);

    // 其他状态保持不变
    const [pendingSeek, setPendingSeek] = useState<number | null>(
        initialState.time > 0 ? initialState.time : null
    );
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
    const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);


    useEffect(() => {
        // 只要 currentSong 变了，立即暂停 audio，防止继续播旧歌
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setResolvedSrc(null); // 立即清空 src，audio 彻底静音
    }, [currentSong]);

    // 在 loadSong 回调中修改处理 song 的逻辑
    const loadSong = useCallback(async (songOrPromise: SongOrPromise, originalIndex: number): Promise<TrackState> => {
        try {
            let song: Song;

            if (typeof songOrPromise === "function") {
                song = await (songOrPromise as () => Promise<Song>)();
            } else if (songOrPromise instanceof Promise) {
                song = await songOrPromise;
            } else {
                song = songOrPromise as Song;
            }

            // 注意：这里我们不预加载 src 函数，只在播放时解析
            // 如果 src 是函数，保持原样不执行

            return {
                status: 'loaded',
                originalIndex,
                data: song
            };
        } catch (error) {
            console.error(`Failed to load song at index ${originalIndex}:`, error);
            return {
                status: 'error',
                originalIndex,
                retries: 0
            };
        }
    }, []);

    // 重试加载失败的歌曲
    const retrySong = useCallback((originalIndex: number, retries: number) => {
        if (retries >= MAX_RETRY) return;

        setTimeout(async () => {
            try {
                const songOrPromise = config.musics[originalIndex];
                const result = await loadSong(songOrPromise, originalIndex);

                setTracks(current => current.map(track =>
                    track.originalIndex === originalIndex ? result : track
                ));
            } catch {
                // 失败后增加重试次数
                setTracks(current => current.map(track =>
                    track.originalIndex === originalIndex
                        ? { status: 'error', originalIndex, retries: retries + 1 }
                        : track
                ));
            }
        }, RETRY_DELAY);
    }, [loadSong]);

    // 在 track 状态变化后计算 resolvedSongs 数组（向后兼容）
    const resolvedSongs = React.useMemo(() => {
        const loaded = tracks
            .filter((track): track is { status: 'loaded', originalIndex: number, data: Song } =>
                track.status === 'loaded'
            )
            .map(track => track.data);

        return loaded.length > 0 ? loaded : null;
    }, [tracks]);

    // 将原始索引转换为已加载歌曲的索引
    const mapToLoadedIndex = useCallback((originalIndex: number): number => {
        let loadedIndex = -1;

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track.status === 'loaded') {
                loadedIndex++;
                if (track.originalIndex === originalIndex) {
                    return loadedIndex;
                }
            }
        }

        return -1;
    }, [tracks]);

    // 将已加载歌曲的索引转换为原始索引
    const mapToOriginalIndex = useCallback((loadedIndex: number): number => {
        let currentLoadedIndex = -1;

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track.status === 'loaded') {
                currentLoadedIndex++;
                if (currentLoadedIndex === loadedIndex) {
                    return track.originalIndex;
                }
            }
        }

        return -1;
    }, [tracks]);

    // 初始化加载所有歌曲
    // 修改初始化加载所有歌曲的逻辑
    useEffect(() => {
        let isCancelled = false;
        setIsLoadingSongs(true);

        // 获取当前歌曲索引（从 localStorage 或随机生成）
        const currentOriginalIndex = currentSongIndex;
        const currentSongOrPromise = config.musics[currentOriginalIndex];

        // 首先单独加载当前歌曲（优先加载策略）
        (async () => {
            try {
                console.log(`[Music] 优先加载当前歌曲: 索引 ${currentOriginalIndex}`);
                const result = await loadSong(currentSongOrPromise, currentOriginalIndex);

                // 如果组件已卸载，不继续处理
                if (isCancelled) return;

                if (result.status === 'loaded') {
                    // 立即更新当前歌曲，不等待其他歌曲加载
                    setCurrentSong(result.data);

                    // 更新 tracks 中当前歌曲的状态
                    setTracks(prev => prev.map(track =>
                        track.originalIndex === currentOriginalIndex ? result : track
                    ));

                    console.log(`[Music] 当前歌曲加载成功: ${result.data.title}`);
                } else {
                    console.warn(`[Music] 当前歌曲加载失败, 将在后台队列中重试`);
                    // 加载失败时，会在后续统一处理重试
                }
            } catch (error) {
                console.error(`[Music] 当前歌曲加载出错:`, error);
            }
        })();

        // 后台并行加载所有歌曲（跳过已加载的当前歌曲）
        (async () => {
            try {
                // 创建所有歌曲的加载 Promise 数组
                const loadPromises = config.musics.map((songOrPromise, idx) => {
                    // 如果是当前歌曲，返回一个已解析的 Promise，避免重复加载
                    if (idx === currentOriginalIndex) {
                        return Promise.resolve(null); // 稍后过滤掉 null 值
                    }
                    return loadSong(songOrPromise, idx);
                });

                // 使用 Promise.all 并行加载所有歌曲
                const results = await Promise.all(loadPromises);

                // 如果组件已卸载，不继续处理
                if (isCancelled) return;

                // 过滤掉 null 值（跳过的当前歌曲）并合并到当前 tracks 中
                const validResults = results.filter(Boolean) as TrackState[];

                setTracks(prev => {
                    // 创建新的 tracks 数组，保留当前状态，更新加载结果
                    return prev.map(track => {
                        // 查找是否有该索引的新加载结果
                        const newTrack = validResults.find(t => t.originalIndex === track.originalIndex);
                        return newTrack || track;
                    });
                });

                // 设置加载完成
                setIsLoadingSongs(false);

                // 为加载失败的歌曲设置重试
                validResults.forEach(result => {
                    if (result.status === 'error') {
                        retrySong(result.originalIndex, result.retries);
                    }
                });

                console.log(`[Music] 所有歌曲加载完成，共 ${validResults.length} 首`);
            } catch (error) {
                console.error("[Music] 加载歌曲列表出错:", error);
                if (!isCancelled) {
                    setIsLoadingSongs(false);
                }
            }
        })();

        // 组件卸载时取消所有操作
        return () => {
            isCancelled = true;
        };
    }, [loadSong, retrySong, currentSongIndex]);

    // 当 tracks 或 currentSongIndex 变化时更新当前歌曲
    useEffect(() => {
        if (tracks.length === 0) return;

        // 找到当前原始索引对应的 track
        const track = tracks.find(t => t.originalIndex === currentSongIndex);

        if (track && track.status === 'loaded') {
            setCurrentSong(track.data);
        } else if (!isLoadingSongs && resolvedSongs && resolvedSongs.length > 0) {
            // 如果当前索引的歌曲未加载，但有其他加载好的歌曲，则切换到第一首加载好的歌曲
            const firstLoadedTrack = tracks.find(t => t.status === 'loaded');
            if (firstLoadedTrack) {
                setCurrentSongIndex(firstLoadedTrack.originalIndex);
                setCurrentSong(firstLoadedTrack.data);
            }
        } else if (!isLoadingSongs && (!resolvedSongs || resolvedSongs.length === 0)) {
            setCurrentSong(null);
            setIsPlaying(false);
        }
    }, [currentSongIndex, tracks, isLoadingSongs, resolvedSongs]);

    // 保持原始的 getAllSongs 接口以兼容现有代码
    const getAllSongs = useCallback((): (Song | Promise<Song>)[] => {
        // 将内部 tracks 转换为与原始接口兼容的格式
        return tracks.map(track => {
            if (track.status === 'loaded') {
                return track.data;
            } else {
                // 对于未加载的歌曲，返回一个永远处于 pending 状态的 Promise
                return new Promise<Song>(() => {
                    // 这个 Promise 会在歌曲加载完成后在其他地方解析
                });
            }
        });
    }, [tracks]);

    function onLrcLineChange(cb: LrcLineChangeCallback): () => void {
        lrcLineChangeCbs.current.push(cb);
        return () => {
            lrcLineChangeCbs.current = lrcLineChangeCbs.current.filter(fn => fn !== cb);
        };
    }

    // 修改 useEffect 以处理 lrc 为 Promise 的情况
    useEffect(() => {
        // setCurrentLrcLine(0);
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

    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    // 修改播放时间更新逻辑
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            if (lyricRef.current && currentSong?.lrc) {
                const offset = currentSong.offset ?? 0;
                lyricRef.current.play(audio.currentTime * 1000 - offset);
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("durationchange", handleLoadedMetadata);

        // 初始化
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("durationchange", handleLoadedMetadata);
        };
    }, [resolvedSrc, currentSong?.lrc, currentSong?.offset]);

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

    // 存储播放进度到本地存储
    useEffect(() => {
        if (typeof window === "undefined") return;
        const saveState = () => {
            if (audioRef.current && currentSong) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        index: currentSongIndex, // 存储原始索引
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
    }, [audioRef, currentSong, currentSong?.src, currentSongIndex]);

    const handleLoadedMetadata = useCallback((): void => {
        if (pendingSeek != null && audioRef.current) {
            audioRef.current.currentTime = pendingSeek;
            setPendingSeek(null);
        }
        if (isPlaying && audioRef.current) {
            audioRef.current.play().catch(() => { });
        }
    }, [pendingSeek, isPlaying, audioRef]);

    // 修改 handlePlayPause 以处理 src 解析状态
    const handlePlayPause = useCallback((): void => {
        setIsPlaying(prev => {
            const audio = audioRef.current;
            if (audio) {
                audio.muted = false;
                if (!prev) {
                    if (resolvedSrc) { // 只有在 URL 已解析时尝试播放
                        audio.play().then(() => {
                            lyricRef.current?.play(audio.currentTime * 1000);
                        }).catch(() => {
                            setIsPlaying(false);
                        });
                    } else {
                        // URL 尚未解析完成，保持播放状态但不实际播放
                        console.log("[Music] 等待 URL 解析完成...");
                        return true; // 仍然返回 true 表示意图是播放
                    }
                } else {
                    audio.pause();
                    lyricRef.current?.pause();
                }
            }
            return !prev;
        });
    }, [audioRef, lyricRef, resolvedSrc]);

    // 修改的切换歌曲逻辑，使用原始索引
    const handleNext = useCallback((): void => {
        if (!resolvedSongs || resolvedSongs.length === 0) return;

        // 获取当前歌曲的加载索引
        const currentLoadedIndex = mapToLoadedIndex(currentSongIndex);
        if (currentLoadedIndex === -1) return;

        let nextLoadedIndex: number;

        if (playMode === "shuffle") {
            // 随机播放
            nextLoadedIndex = Math.floor(Math.random() * resolvedSongs.length);
            if (resolvedSongs.length > 1 && nextLoadedIndex === currentLoadedIndex) {
                nextLoadedIndex = (nextLoadedIndex + 1) % resolvedSongs.length;
            }
        } else if (playMode === "repeat-one") {
            // 单曲循环
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
                lyricRef.current?.play(0);
            }
            return;
        } else {
            // 顺序播放
            nextLoadedIndex = (currentLoadedIndex + 1) % resolvedSongs.length;
        }

        // 将加载索引转换回原始索引
        const nextOriginalIndex = mapToOriginalIndex(nextLoadedIndex);
        if (nextOriginalIndex !== -1) {
            setCurrentSongIndex(nextOriginalIndex);
            setIsPlaying(true);
        }
    }, [playMode, currentSongIndex, resolvedSongs, audioRef, lyricRef, mapToLoadedIndex, mapToOriginalIndex]);

    const handlePrev = useCallback((): void => {
        if (!resolvedSongs || resolvedSongs.length === 0) return;

        // 获取当前歌曲的加载索引
        const currentLoadedIndex = mapToLoadedIndex(currentSongIndex);
        if (currentLoadedIndex === -1) return;

        let prevLoadedIndex: number;

        if (playMode === "shuffle") {
            // 随机播放
            prevLoadedIndex = Math.floor(Math.random() * resolvedSongs.length);
            if (resolvedSongs.length > 1 && prevLoadedIndex === currentLoadedIndex) {
                prevLoadedIndex = (prevLoadedIndex + 1) % resolvedSongs.length;
            }
        } else if (playMode === "repeat-one") {
            // 单曲循环
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
                lyricRef.current?.play(0);
            }
            return;
        } else {
            // 顺序播放
            prevLoadedIndex = (currentLoadedIndex - 1 + resolvedSongs.length) % resolvedSongs.length;
        }

        // 将加载索引转换回原始索引
        const prevOriginalIndex = mapToOriginalIndex(prevLoadedIndex);
        if (prevOriginalIndex !== -1) {
            setCurrentSongIndex(prevOriginalIndex);
            setIsPlaying(true);
        }
    }, [playMode, currentSongIndex, resolvedSongs, audioRef, lyricRef, mapToLoadedIndex, mapToOriginalIndex]);

    const handleEnded = useCallback((): void => {
        if (!resolvedSongs || resolvedSongs.length === 0) {
            setIsPlaying(false);
            return;
        }

        if (playMode === "repeat-one") {
            // 单曲循环
            audioRef.current?.play().catch(() => { });
            lyricRef.current?.play(0);
            return;
        }

        // 获取当前歌曲的加载索引
        const currentLoadedIndex = mapToLoadedIndex(currentSongIndex);
        if (currentLoadedIndex === -1) return;

        let nextLoadedIndex: number;

        if (playMode === "shuffle") {
            // 随机播放
            nextLoadedIndex = Math.floor(Math.random() * resolvedSongs.length);
            if (resolvedSongs.length > 1 && nextLoadedIndex === currentLoadedIndex) {
                nextLoadedIndex = (nextLoadedIndex + 1) % resolvedSongs.length;
            }
        } else {
            // 顺序播放
            nextLoadedIndex = (currentLoadedIndex + 1) % resolvedSongs.length;
        }

        // 将加载索引转换回原始索引
        const nextOriginalIndex = mapToOriginalIndex(nextLoadedIndex);
        if (nextOriginalIndex !== -1) {
            setCurrentSongIndex(nextOriginalIndex);
            setIsPlaying(true);
        }
    }, [playMode, currentSongIndex, resolvedSongs, audioRef, lyricRef, mapToLoadedIndex, mapToOriginalIndex]);

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

    // 修改 handlePlaySong 方法，接受的是加载后的索引
    const handlePlaySong = useCallback((loadedIndex: number): void => {
        if (!resolvedSongs || loadedIndex < 0 || loadedIndex >= resolvedSongs.length) return;

        // 将加载索引转换为原始索引
        const originalIndex = mapToOriginalIndex(loadedIndex);
        if (originalIndex !== -1) {
            setCurrentSongIndex(originalIndex);
            setIsPlaying(true);
            setPendingSeek(0);
        }
    }, [resolvedSongs, mapToOriginalIndex]);

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

    // 处理音乐命令
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
                const isPlaying = mapToOriginalIndex(idx) === currentSongIndex;
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
        currentSongIndex,
        mapToOriginalIndex
    ]);

    // 音量控制
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

    // 媒体会话集成
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

    // 获取封面颜色
    const getAlbumCoverColor = useCallback(async (): Promise<string> => {
        if (!currentSong?.cover) {
            return DEFAULT_COVER_COLOR;
        }
        try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = currentSong.cover || "";
            });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) return DEFAULT_COVER_COLOR;
            const size = Math.min(img.width, img.height, 64); // 小尺寸更快
            canvas.width = size;
            canvas.height = size;
            ctx.drawImage(img, 0, 0, size, size);
            const imageData = ctx.getImageData(0, 0, size, size).data;
            const colorMap = new Map<string, number>();
            const simplify = (v: number) => Math.round(v / 32) * 32;
            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2], a = imageData[i + 3];
                // 跳过透明、过亮、过暗像素
                if (a < 128) continue;
                if ((r > 240 && g > 240 && b > 240) || (r < 20 && g < 20 && b < 20)) continue;
                const key = `${simplify(r)},${simplify(g)},${simplify(b)}`;
                colorMap.set(key, (colorMap.get(key) || 0) + 1);
            }
            let maxCount = 0, dominantColor = DEFAULT_COVER_COLOR;
            for (const [colorKey, count] of colorMap.entries()) {
                if (count > maxCount) {
                    maxCount = count;
                    const [r, g, b] = colorKey.split(',').map(Number);
                    dominantColor = `rgb(${r}, ${g}, ${b})`;
                }
            }
            return dominantColor;
        } catch (error) {
            console.error("Failed to get album cover color:", error);
            return DEFAULT_COVER_COLOR;
        }
    }, [currentSong?.cover]);

    // 添加一个用于解析 src 的 useEffect
    useEffect(() => {
        let isMounted = true;

        const resolveSrc = async () => {
            if (!currentSong) {
                setResolvedSrc(null);
                return;
            }

            try {
                let finalSrc: string;

                if (typeof currentSong.src === 'function') {
                    console.log(`[Music] 懒加载歌曲 URL: ${currentSong.title}`);
                    finalSrc = await currentSong.src();

                    // 验证 URL 有效性
                    if (!finalSrc || typeof finalSrc !== 'string' || !finalSrc.startsWith('http')) {
                        throw new Error(`无效的音频 URL: ${finalSrc}`);
                    }
                } else {
                    finalSrc = currentSong.src as string;

                    // 验证直接提供的 URL
                    if (!finalSrc || typeof finalSrc !== 'string' || !finalSrc.startsWith('http')) {
                        throw new Error(`无效的音频 URL: ${finalSrc}`);
                    }
                }

                if (isMounted) {
                    console.log(`[Music] URL 解析成功: ${finalSrc.substring(0, 50)}...`);
                    setResolvedSrc(finalSrc);
                }
            } catch (error) {
                console.error(`[Music] 无法加载歌曲 URL:`, error);
                if (isMounted) {
                    setResolvedSrc(null);
                    // 加载失败时跳到下一首
                    handleNext();
                }
            }
        };

        resolveSrc();

        return () => {
            isMounted = false;
        };
    }, [currentSong, handleNext]);

    // 修改 resolvedSrc 变化后的自动播放逻辑，增加延迟和错误处理
    useEffect(() => {
        if (!resolvedSrc || !isPlaying || !audioRef.current) return;

        // 使用setTimeout给浏览器一点时间来处理新的src
        const playTimer = setTimeout(() => {
            if (!audioRef.current) return;

            // 确保audio元素已加载
            if (audioRef.current.readyState >= 2) {
                audioRef.current.play()
                    .catch(err => {
                        console.error("[Music] 自动播放失败:", err);
                        // 尝试再次播放一次（有时第一次会因为浏览器策略失败）
                        setTimeout(() => {
                            if (audioRef.current && resolvedSrc) {
                                audioRef.current.play().catch(err => {
                                    console.error("[Music] 第二次播放尝试也失败:", err);
                                    setIsPlaying(false);
                                });
                            }
                        }, 300);
                    });
            } else {
                // 监听canplay事件
                const canPlayHandler = () => {
                    audioRef.current?.play().catch(err => {
                        console.error("[Music] canplay事件后播放失败:", err);
                        setIsPlaying(false);
                    });
                };

                audioRef.current.addEventListener('canplay', canPlayHandler, { once: true });

                // 清理函数
                return () => {
                    audioRef.current?.removeEventListener('canplay', canPlayHandler);
                };
            }
        }, 100);

        return () => clearTimeout(playTimer);
    }, [resolvedSrc, isPlaying]);

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
                handleMusicCommand,
                getAlbumCoverColor,
                currentTime,
                duration,
            }}
        >
            {currentSong && resolvedSrc ? (
                <audio
                    ref={audioRef}
                    src={resolvedSrc}
                    key={`${currentSongIndex}-${resolvedSrc}`}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleEnded}
                    onError={(e) => {
                        console.error("[Music] 音频加载错误:", e);
                        // 在音频加载失败时尝试下一首
                        setTimeout(() => handleNext(), 1000);
                    }}
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