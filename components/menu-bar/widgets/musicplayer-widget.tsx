import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { CirclePlay, CirclePause, SkipForward, SkipBack } from "lucide-react"
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


type SongOrPromise = Song | Promise<Song> | (() => Promise<Song>)

// 工具函数,从网易云音乐获取歌曲信息和歌词
async function fetchSongFromNCM(mid: string, offset: number = 0): Promise<Song> {
    console.log(`Fetching song with mid: ${mid}, offset: ${offset}`)
    const songResponse = await fetch(`https://music.0013107.xyz/music/?action=netease&module=get_url&mids=${mid}`)
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
        lrc: lrcData.lyric || "",
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
    () => fetchSongFromNCM("2616952326"),   // 夢で逢いましょう
    () => fetchSongFromNCM("1991282192"),   // Automaton Waltz - Plum - Melodic Artist
    () => fetchSongFromNCM("29163452"),     // 君恋し - EasyPop / 巡音ルカ
    () => fetchSongFromNCM("1906977699"),   // まっすぐ - 大原ゆい子
    () => fetchSongFromNCM("472219448"),    // 心拍数#0822 - H△G
    () => fetchSongFromNCM("1819778023"), // Classy Kitty
    () => fetchSongFromNCM("2118709322", -2500),   // 乙女的ストーキング - なるみや
    () => fetchSongFromNCM("2100334024"),   // 轻涟 La vaguelette - HOYO-MiX
]

export function MusicPlayerWidget() {
    const [currentSongIndex, setCurrentSongIndex] = useState(0)
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

    // 封面旋转效果
    const [coverRotate, setCoverRotate] = useState(0)
    const rotateRef = useRef(0)
    const animFrameRef = useRef<number>(0)
    // 用于唯一标识当前歌词解析器
    const lrcSessionRef = useRef(0)

    useEffect(() => {
        if (!isPlaying) return
        let last = performance.now()
        function animate(now: number) {
            const delta = now - last
            last = now
            // 4秒一圈，360/4000 = 0.09 deg/ms
            rotateRef.current += delta * 0.09
            setCoverRotate(rotateRef.current)
            animFrameRef.current = requestAnimationFrame(animate)
        }
        animFrameRef.current = requestAnimationFrame(animate)
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        }
    }, [isPlaying])

    // 切歌时重置角度
    useEffect(() => {
        rotateRef.current = 0
        setCoverRotate(0)
    }, [currentSongIndex])

    // Media Session API 整合
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
            artist: currentSong.artist || "Unknown", // 你可以补充歌手名
            album: currentSong.album || "Unknown", // 你可以补充专辑名
            artwork: currentSong.cover
                ? [
                    { src: currentSong.cover, sizes: "96x96", type: "image/png" },
                    { src: currentSong.cover, sizes: "192x192", type: "image/png" },
                ]
                : [],
        })

        navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true))
        navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false))
        navigator.mediaSession.setActionHandler("previoustrack", handlePrev)
        navigator.mediaSession.setActionHandler("nexttrack", handleNext)
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
        // 清理
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

    // 切歌时请求歌曲信息
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

    // 音频地址加载
    useEffect(() => {
        if (currentSong?.src) {
            setAudioSrc(currentSong.src)
        } else {
            setAudioSrc("")
        }
    }, [currentSong])

    // 歌曲切换时立即清空歌词显示
    useEffect(() => {
        setDisplayLrc("")
    }, [currentSongIndex])

    // 歌词切换动画
    useEffect(() => {
        if (currentLrc === displayLrc) return
        setLyricFade(false)
        const timer = setTimeout(() => {
            setDisplayLrc(currentLrc)
            setLyricFade(true)
        }, 200)
        return () => clearTimeout(timer)
    }, [currentLrc, displayLrc])

    // 歌词加载和同步（只允许一个歌词解析器生效）
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

        // 创建新的歌词解析实例
        const parser = new Lyric({
            lyric: currentSong.lrc,
            offset: currentSong.offset ?? 0,
            onPlay: (_lineNum: number, text: string) => {
                if (lrcSessionRef.current !== thisSession) return // 已切歌
                if (!isPlayingRef.current) return
                if (text !== lastLrcRef.current) {
                    lastLrcRef.current = text
                    setCurrentLrc(text)
                }
            }
        })
        lyricRef.current = parser

        // 歌曲切换时立即同步到当前播放进度
        if (audioRef.current) {
            parser.play(audioRef.current.currentTime * 1000)
        }

        return () => {
            lyricRef.current?.pause()
            lyricRef.current = null
        }
    }, [currentSong, audioSrc, currentSongIndex])

    // 跑马灯动画
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

    // 歌词和播放进度同步
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        // 进度变化时同步歌词
        const handleTimeUpdate = () => {
            if (lyricRef.current && currentSong?.lrc) {
                const offset = currentSong.offset ?? 0
                lyricRef.current.play(audio.currentTime * 1000 - offset)
            }
        }

        // 拖动进度条时也要同步歌词
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

    // 播放/暂停时控制 audio
    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play().catch(err => {
                console.log("播放错误：", err)
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

    const handlePrev = () => {
        setCurrentSongIndex(prev => (prev === 0 ? songs.length - 1 : prev - 1))
        setIsPlaying(true)
    }

    const handleNext = () => {
        setCurrentSongIndex(prev => (prev === songs.length - 1 ? 0 : prev + 1))
        setIsPlaying(true)
    }


    return (
        <div className="flex items-center space-x-2 px-4 py-2">
            <div
                className="relative"
                ref={lyricBoxRef}
                style={{ minWidth: "8rem", maxWidth: "16rem" }}
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
            {/* 封面图，放在上一首按钮左侧 */}
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
                        alt="cover"
                        width={18}
                        height={18}
                        className="rounded-full"
                        style={{ minWidth: 18, minHeight: 18 }}
                        unoptimized
                    />
                    {/* 可选：水印 */}
                </div>
            ) : (
                <div
                    className="rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-700"
                    style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, marginRight: 4 }}
                />
            )}
            <button onClick={handlePrev} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={handlePlayPause} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                {isPlaying ? <CirclePause className="w-5 h-5" /> : <CirclePlay className="w-5 h-5" />}
            </button>
            <button onClick={handleNext} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                <SkipForward className="w-5 h-5" />
            </button>
            {audioSrc ? (
                <audio ref={audioRef} src={audioSrc} onEnded={handleNext} />
            ) : null}
            <VolumeWidget audioRef={audioRef} />
        </div>
    )
}