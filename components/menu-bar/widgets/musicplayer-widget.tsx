import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { CirclePlay, CirclePause, SkipForward, SkipBack, Repeat, Repeat1, Shuffle } from "lucide-react"
import { VolumeWidget } from "./volume-widget"
import Lyric from 'lrc-file-parser'

// Song 类型
interface Song {
    title: string
    src: string
    artist?: string
    album?: string
    lrc?: string
    cover?: string
    offset?: number
}

type PlayMode = "order" | "repeat-one" | "shuffle"

const PLAY_MODE_ICONS = {
    order: <Repeat className="w-5 h-5 opacity-60" />,
    "repeat-one": <Repeat1 className="w-5 h-5 opacity-60" />,
    shuffle: <Shuffle className="w-5 h-5 opacity-60" />,
}

type SongOrPromise = Song | Promise<Song> | (() => Promise<Song>)

// 工具函数,从网易云音乐获取歌曲信息和歌词
async function fetchSongFromNCM(mid: string, offset: number = 0): Promise<Song> {
    console.log(`Fetching song with mid: ${mid}, offset: ${offset}`)
    const songResponse = await fetch(`https://music.api.liteyuki.org/music/?action=netease&module=get_url&mids=${mid}`)
    if (!songResponse.ok) throw new Error("获取歌曲信息失败")
    const songData = await songResponse.json()
    const lrcResponse = await fetch(`https://ncm.api.liteyuki.org/api/song/media?id=${mid}`)
    if (!lrcResponse.ok) throw new Error("获取歌词失败")
    const lrcData = await lrcResponse.json()
    return {
        title: songData.data[0].song || "Unknown",
        album: songData.data[0].album || "Unknown Album",
        artist: songData.data[0].singer || "Unknown Artist",
        src: songData.data[0].url.replace("http://", "https://"),
        lrc: lrcData.lyric || `[00:00:00]${songData.data[0].song} - ${songData.data[0].singer}`,
        cover: songData.data[0].cover,
        offset,
    }
}

// 歌曲列表，支持常量和懒加载
const songs: SongOrPromise[] = [
    // 懒加载
    () => fetchSongFromNCM("2165386067", 1500), // 糖果色的梦 - Kirara
    () => fetchSongFromNCM("2155423468", -6000), // 希望有羽毛和翅膀
    () => fetchSongFromNCM("1944651767",),   // Antler - 鹿角
    () => fetchSongFromNCM("1466019525"),   // 夜に駆ける(初音ミク ver.)
    () => fetchSongFromNCM("2155422573"), // 使一颗心免于哀伤
    () => fetchSongFromNCM("22821014"), // 活动小丑
    () => fetchSongFromNCM("2657083161"), // 愛♡スクリ～ム！
    () => fetchSongFromNCM("2138674818"), // 沐雨
    () => fetchSongFromNCM("2616952326"),   // 夢で逢いましょう
    () => fetchSongFromNCM("40915694"), // 心做し 鹿乃
    () => fetchSongFromNCM("2051317320"), // 强风大背头
    () => fetchSongFromNCM("512376191"), // 砂之行星
    () => fetchSongFromNCM("1345485069"), // 冬之花
    () => fetchSongFromNCM("16607987"), // trouble is a friend
    () => fetchSongFromNCM("460528"), // 白金disco
    () => fetchSongFromNCM("2100630469"), // 错位时空
    () => fetchSongFromNCM("208902"), // 北国之春
    () => fetchSongFromNCM("1945128093"), // 时钟悖论
    () => fetchSongFromNCM("1501478611"), // ハロウィンナイトパーティ (feat. Hanon &amp; Kotoha)
    () => fetchSongFromNCM("1323760916"),   // 余命3日少女（翻自 プロペリン）
    () => fetchSongFromNCM("2011912894"), // 天街花
    () => fetchSongFromNCM("1375725396"), // cyber天使
    () => fetchSongFromNCM("27180681"), // 柠檬树
    () => fetchSongFromNCM("440208476"), // that girl
    () => fetchSongFromNCM("16607964"), // the show
    () => fetchSongFromNCM("580817"), // HAMELN
    () => fetchSongFromNCM("1451998397"), // 恋爱吧 魔法少女 hanser
    () => fetchSongFromNCM("1991282192"),   // Automaton Waltz - Plum - Melodic Artist
    () => fetchSongFromNCM("29163452"),     // 君恋し - EasyPop / 巡音ルカ
    () => fetchSongFromNCM("1906977699"),   // まっすぐ - 大原ゆい子
    () => fetchSongFromNCM("1456393572"), // 枕边童话
    () => fetchSongFromNCM("2010574726"), // 铁道唱歌
    () => fetchSongFromNCM("441459"), // 悬崖上的金鱼公主
    () => fetchSongFromNCM("519006"), // 拼好歌
    () => fetchSongFromNCM("1910911958"), // 神女劈观
    () => fetchSongFromNCM("1859245776"), // STAY
    () => fetchSongFromNCM("2637558926"), // APT. rose
    () => fetchSongFromNCM("1809242210"), // 有何不可红石音乐
    () => fetchSongFromNCM("406716121"), // miku
    () => fetchSongFromNCM("26349198"), // 何度も RAM WIRE
    () => fetchSongFromNCM("472219448"),    // 心拍数#0822 - H△G
    () => fetchSongFromNCM("1975923438", 1000), // 菟园
    () => fetchSongFromNCM("1819778023"), // Classy Kitty
    () => fetchSongFromNCM("2118709322", -2500),   // 乙女的ストーキング - なるみや
    () => fetchSongFromNCM("2100334024"),   // 轻涟 La vaguelette - HOYO-MiX
]

const STORAGE_KEY = "musicplayer_state"
const PLAYMODE_KEY = "musicplayer_playmode"

// 1. 初始化时直接读取 localStorage
function getInitialState() {
    if (typeof window !== "undefined") {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const { index, time } = JSON.parse(saved)
                if (
                    typeof index === "number" &&
                    index >= 0 &&
                    index < songs.length &&
                    typeof time === "number" &&
                    time > 0
                ) {
                    return { index, time }
                }
            }
        } catch { }
        return { index: Math.floor(Math.random() * songs.length), time: 0 }
    }
    return { index: 0, time: 0 }
}

function getInitialPlayMode(): PlayMode {
    if (typeof window !== "undefined") {
        try {
            const saved = localStorage.getItem(PLAYMODE_KEY)
            if (saved === "repeat-one" || saved === "shuffle" || saved === "order") {
                return saved as PlayMode
            }
        } catch { }
    }
    return "order"
}

export function MusicPlayerWidget() {
    // 初始化
    const initial = getInitialState()
    const [currentSongIndex, setCurrentSongIndex] = useState(initial.index)
    const [currentSong, setCurrentSong] = useState<Song | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentLrc, setCurrentLrc] = useState("")
    const [audioSrc, setAudioSrc] = useState<string>("")
    const [displayLrc, setDisplayLrc] = useState("")
    const [lyricFade, setLyricFade] = useState(true)
    const [, setMarqueeActive] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const lyricBoxRef = useRef<HTMLDivElement>(null)
    const lyricTextRef = useRef<HTMLDivElement>(null)
    const isPlayingRef = useRef(isPlaying)
    const lastLrcRef = useRef("")
    const lyricRef = useRef<Lyric | null>(null)
    const [coverRotate, setCoverRotate] = useState(0)
    const rotateRef = useRef(0)
    const animFrameRef = useRef<number>(0)
    const lrcSessionRef = useRef(0)
    const [pendingSeek, setPendingSeek] = useState<number | null>(initial.time > 0 ? initial.time : null)
    const [playMode, setPlayMode] = useState<PlayMode>(getInitialPlayMode())
    const [showLyricMobile, setShowLyricMobile] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // 切换播放模式并保存
    const handleSwitchPlayMode = () => {
        setPlayMode(mode => {
            let next: PlayMode
            if (mode === "order") next = "repeat-one"
            else if (mode === "repeat-one") next = "shuffle"
            else next = "order"
            try {
                localStorage.setItem(PLAYMODE_KEY, next)
            } catch { }
            return next
        })
    }

    // 下一首逻辑根据播放模式调整
    const handleNext = () => {
        if (playMode === "shuffle") {
            let next = Math.floor(Math.random() * songs.length)
            // 避免和当前重复
            if (songs.length > 1 && next === currentSongIndex) {
                next = (next + 1) % songs.length
            }
            setCurrentSongIndex(next)
        } else if (playMode === "repeat-one") {
            setCurrentSongIndex(currentSongIndex) // 保持不变
        } else {
            setCurrentSongIndex(prev => (prev === songs.length - 1 ? 0 : prev + 1))
        }
        setIsPlaying(true)
    }

    // 上一首逻辑（顺序/随机模式下）
    const handlePrev = () => {
        if (playMode === "shuffle") {
            let prev = Math.floor(Math.random() * songs.length)
            if (songs.length > 1 && prev === currentSongIndex) {
                prev = (prev + 1) % songs.length
            }
            setCurrentSongIndex(prev)
        } else if (playMode === "repeat-one") {
            setCurrentSongIndex(currentSongIndex)
        } else {
            setCurrentSongIndex(prev => (prev === 0 ? songs.length - 1 : prev - 1))
        }
        setIsPlaying(true)
    }

    // 播放结束时的行为
    const handleEnded = () => {
        if (playMode === "repeat-one") {
            audioRef.current?.play()
        } else {
            handleNext()
        }
    }

    // 只在 audioSrc 变化且 pendingSeek 有值时设置 currentTime
    useEffect(() => {
        if (audioSrc && pendingSeek != null) {
            if (audioRef.current) {
                audioRef.current.currentTime = pendingSeek
            }
            setPendingSeek(null)
        }
    }, [audioSrc, pendingSeek])

    // 持续保存进度
    useEffect(() => {
        if (typeof window === "undefined") return
        const saveState = () => {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    index: currentSongIndex,
                    time: audioRef.current?.currentTime || 0,
                })
            )
        }
        saveState()
        const audio = audioRef.current
        if (audio) {
            audio.addEventListener("timeupdate", saveState)
            return () => audio.removeEventListener("timeupdate", saveState)
        }
    }, [currentSongIndex, audioSrc])

    // 旋转封面
    useEffect(() => {
        if (!isPlaying) return
        let last = performance.now()
        function animate(now: number) {
            const delta = now - last
            last = now
            rotateRef.current += delta * 0.09
            setCoverRotate(rotateRef.current)
            animFrameRef.current = requestAnimationFrame(animate)
        }
        animFrameRef.current = requestAnimationFrame(animate)
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [isPlaying])

    useEffect(() => {
        rotateRef.current = 0
        setCoverRotate(0)
    }, [currentSongIndex])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        const onPlay = () => {
            if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = "playing"
            }
        }
        const onPause = () => {
            if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = "paused"
            }
        }
        audio.addEventListener("play", onPlay)
        audio.addEventListener("pause", onPause)
        return () => {
            audio.removeEventListener("play", onPlay)
            audio.removeEventListener("pause", onPause)
        }
    }, [audioSrc])

    useEffect(() => {
        if (!("mediaSession" in navigator) || !currentSong) return

        navigator.mediaSession.metadata = new window.MediaMetadata({
            title: currentSong.title,
            artist: currentSong.artist || "Unknown",
            album: currentSong.album || "Unknown",
            artwork: currentSong.cover
                ? [
                    { src: currentSong.cover, sizes: "96x96", type: "image/png" },
                    { src: currentSong.cover, sizes: "192x192", type: "image/png" },
                ]
                : [],
        })

        navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true))
        navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false))
        navigator.mediaSession.setActionHandler("previoustrack", () => setCurrentSongIndex(prev => (prev === 0 ? songs.length - 1 : prev - 1)))
        navigator.mediaSession.setActionHandler("nexttrack", () => setCurrentSongIndex(prev => (prev === songs.length - 1 ? 0 : prev + 1)))
        navigator.mediaSession.setActionHandler("seekto", (details) => {
            if (audioRef.current && typeof details.seekTime === "number") {
                audioRef.current.currentTime = details.seekTime
            }
        })
        navigator.mediaSession.setActionHandler("seekbackward", (details) => {
            if (audioRef.current) {
                audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - (details.seekOffset || 10))
            }
        })
        navigator.mediaSession.setActionHandler("seekforward", (details) => {
            if (audioRef.current) {
                audioRef.current.currentTime = Math.min(
                    audioRef.current.duration || Infinity,
                    audioRef.current.currentTime + (details.seekOffset || 10)
                )
            }
        })
        return () => {
            navigator.mediaSession.setActionHandler("play", null)
            navigator.mediaSession.setActionHandler("pause", null)
            navigator.mediaSession.setActionHandler("previoustrack", null)
            navigator.mediaSession.setActionHandler("nexttrack", null)
        }
    }, [currentSong, isPlaying, audioSrc])

    useEffect(() => {
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    useEffect(() => {
        let cancelled = false
        const songOrPromise = songs[currentSongIndex]
        const next = () => setCurrentSongIndex(i => (i + 1) % songs.length)
        if (typeof songOrPromise === "function") {
            songOrPromise()
                .then(song => {
                    if (!cancelled) setCurrentSong(song)
                })
                .catch(() => {
                    if (!cancelled) next()
                })
        } else if (songOrPromise instanceof Promise) {
            songOrPromise
                .then(song => {
                    if (!cancelled) setCurrentSong(song)
                })
                .catch(() => {
                    if (!cancelled) next()
                })
        } else {
            setCurrentSong(songOrPromise)
        }
        return () => { cancelled = true }
    }, [currentSongIndex])

    useEffect(() => {
        if (currentSong?.src) {
            setAudioSrc(currentSong.src)
        } else {
            setAudioSrc("")
        }
    }, [currentSong])

    useEffect(() => {
        if (!currentSong?.lrc) setDisplayLrc("")
    }, [currentSongIndex, currentSong?.lrc])

    useEffect(() => {
        if (currentLrc === displayLrc) return
        setLyricFade(false)
        const timer = setTimeout(() => {
            setDisplayLrc(currentLrc)
            setLyricFade(true)
        }, 200)
        return () => clearTimeout(timer)
    }, [currentLrc, displayLrc])

    useEffect(() => {
        setCurrentLrc("")
        lastLrcRef.current = ""
        lrcSessionRef.current += 1
        const thisSession = lrcSessionRef.current

        if (lyricRef.current) {
            lyricRef.current.pause()
            lyricRef.current = null
        }

        if (!currentSong?.lrc) {
            return
        }

        const parser = new Lyric({
            lyric: currentSong.lrc,
            offset: currentSong.offset ?? 0,
            onPlay: (_lineNum: number, text: string) => {
                if (lrcSessionRef.current !== thisSession) return
                if (!isPlayingRef.current) return
                if (text !== lastLrcRef.current) {
                    lastLrcRef.current = text
                    setCurrentLrc(text)
                }
            }
        })
        lyricRef.current = parser

        if (audioRef.current) {
            parser.play(audioRef.current.currentTime * 1000)
        }

        return () => {
            lyricRef.current?.pause()
            lyricRef.current = null
        }
    }, [currentSong, audioSrc, currentSongIndex])

    useEffect(() => {
        setMarqueeActive(false)
        const timer = setTimeout(() => {
            if (lyricBoxRef.current && lyricTextRef.current) {
                const boxWidth = lyricBoxRef.current.offsetWidth
                const textWidth = lyricTextRef.current.scrollWidth
                setMarqueeActive(textWidth > boxWidth)
            }
        }, 20)
        return () => clearTimeout(timer)
    }, [displayLrc, currentSongIndex])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleTimeUpdate = () => {
            if (lyricRef.current && currentSong?.lrc) {
                const offset = currentSong.offset ?? 0
                lyricRef.current.play(audio.currentTime * 1000 - offset)
            }
        }

        const handleSeeked = () => {
            if (lyricRef.current && currentSong?.lrc) {
                const offset = currentSong.offset ?? 0
                lyricRef.current.play(audio.currentTime * 1000 - offset)
            }
        }

        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("seeked", handleSeeked)
        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.removeEventListener("seeked", handleSeeked)
        }
    }, [currentSong?.lrc, currentSong?.offset, currentSongIndex])

    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play().catch(err => {
                console.error("播放音频失败:", err)
            })
        } else {
            audioRef.current?.pause()
        }
    }, [isPlaying, audioSrc])

    const handlePlayPause = () => {
        if (audioRef.current) {
            audioRef.current.muted = false
        }
        setIsPlaying(prev => !prev)
    }

    return (
        <div className="flex items-center space-x-2 px-4 py-2">
            {/* 歌词/封面切换逻辑 */}
            {isMobile ? (
                <div style={{ position: "relative", width: "100%" }}>
                    <div
                        style={{
                            transition: "opacity 0.3s, visibility 0.3s",
                            opacity: showLyricMobile ? 1 : 0,
                            visibility: showLyricMobile ? "visible" : "hidden",
                            position: showLyricMobile ? "static" : "absolute",
                            width: "100%",
                            zIndex: 2,
                        }}
                    >
                        {/* 显示歌词，点击后切换回封面，且隐藏所有按钮和封面 */}
                        <div
                            className="relative"
                            ref={lyricBoxRef}
                            style={{ minWidth: "4rem", maxWidth: "40rem", cursor: "pointer", width: "100%" }}
                            onClick={() => setShowLyricMobile(false)}
                            title="点击切换回封面"
                        >
                            <div
                                className="w-full text-right text-sm font-medium text-slate-700 dark:text-slate-300 pr-2"
                                style={{
                                    whiteSpace: "nowrap",
                                    overflow: "visible",
                                    direction: "rtl",
                                    textAlign: "left"
                                }}
                            >
                                <span
                                    ref={lyricTextRef}
                                    style={{
                                        direction: "ltr",
                                        unicodeBidi: "plaintext",
                                        transition: "opacity 0.3s",
                                        opacity: lyricFade ? 1 : 0,
                                        display: "inline-block"
                                    }}
                                >
                                    {currentSong?.lrc
                                        ? (displayLrc || currentSong?.title + " - " + currentSong?.artist || "loading...")
                                        : currentSong?.title}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            transition: "opacity 0.3s, visibility 0.3s",
                            opacity: showLyricMobile ? 0 : 1,
                            visibility: showLyricMobile ? "hidden" : "visible",
                            position: !showLyricMobile ? "static" : "absolute",
                            width: "100%",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        {/* 显示封面和所有按钮 */}
                        {currentSong?.cover ? (
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
                                    cursor: "pointer"
                                }}
                                onClick={() => setShowLyricMobile(true)}
                                title="点击显示歌词"
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
                                onClick={() => setShowLyricMobile(true)}
                                title="点击显示歌词"
                            />
                        )}
                        {/* 按钮区 */}
                        <button onClick={handlePrev} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button onClick={handlePlayPause} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                            {isPlaying ? <CirclePause className="w-5 h-5" /> : <CirclePlay className="w-5 h-5" />}
                        </button>
                        <button onClick={handleNext} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                            <SkipForward className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSwitchPlayMode}
                            className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full"
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
                        {audioSrc ? (
                            <audio ref={audioRef} src={audioSrc} onEnded={handleEnded} preload="auto" />
                        ) : null}
                        <VolumeWidget audioRef={audioRef} />
                    </div>
                </div>
            ) : (
                // 桌面端：歌词和封面都显示
                <>
                    <div
                        className="relative"
                        ref={lyricBoxRef}
                        style={{ minWidth: "4rem", maxWidth: "40rem" }}
                    >
                        <div
                            className="w-full text-right text-sm font-medium text-slate-700 dark:text-slate-300 pr-2"
                            style={{
                                whiteSpace: "nowrap",
                                overflow: "visible",
                                direction: "rtl",
                                textAlign: "left"
                            }}
                        >
                            <span
                                ref={lyricTextRef}
                                style={{
                                    direction: "ltr",
                                    unicodeBidi: "plaintext",
                                    transition: "opacity 0.3s",
                                    opacity: lyricFade ? 1 : 0,
                                    display: "inline-block"
                                }}
                            >
                                {currentSong?.lrc
                                    ? (displayLrc || currentSong?.title + " - " + currentSong?.artist || "loading...")
                                    : currentSong?.title}
                            </span>
                        </div>
                    </div>
                    {currentSong?.cover ? (
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
                                transition: isPlaying ? undefined : "transform 0.2s linear"
                            }}
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
                            style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, marginRight: 4 }}
                        />
                    )}
                    {/* 桌面端按钮区 */}
                    <button onClick={handlePrev} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                        <SkipBack className="w-5 h-5" />
                    </button>
                    <button onClick={handlePlayPause} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                        {isPlaying ? <CirclePause className="w-5 h-5" /> : <CirclePlay className="w-5 h-5" />}
                    </button>
                    <button onClick={handleNext} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                        <SkipForward className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleSwitchPlayMode}
                        className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full"
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
                    {audioSrc ? (
                        <audio ref={audioRef} src={audioSrc} onEnded={handleEnded} preload="auto" />
                    ) : null}
                    <VolumeWidget audioRef={audioRef} />
                </>
            )}
        </div>
    )
}
