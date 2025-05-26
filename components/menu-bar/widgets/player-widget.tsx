// 播放器组件
import React, { useState, useRef, useEffect } from "react"
import { CirclePlay, CirclePause, SkipForward, SkipBack } from "lucide-react"
import LyricParser from "lyric-parser"
import { VolumeWidget } from "./volume-widget"

// fetchFrom和src二选一，优先判断src，若为null则使用fetchFrom从异步函数获取URL
interface Song {
    title: string
    src?: string
    fetchFrom?: () => Promise<string>   // 解析的音频url
    lrc?: string
    lrcFetchFrom?: () => Promise<string>    // 解析的歌词文本/不是url
    cover?: string
    offset?: number // 歌词偏移，单位毫秒
}

type LyricLine = {
    time: number
    txt: string
}

async function getUrlFromNCM(mid: string): Promise<string> {
    const response = await fetch(`https://music.0013107.xyz/music/?action=netease&module=get_url&mids=${mid}`)
    if (!response.ok) {
        throw new Error("获取歌曲 URL 失败")
    }
    const data = await response.json()
    return data.data[0].url.replace("http://", "https://") // 确保使用 HTTPS
}

async function getLRCFromNCM(mid: string): Promise<string> {
    const response = await fetch(`https://ncm.api.liteyuki.org/api/song/media?id=${mid}`)
    if (!response.ok) {
        throw new Error("获取歌词失败")
    }
    const data = await response.json()
    return data.lyric || ""
}

const songs: Song[] = [
    {
        title: "夜に駆ける(初音ミク ver.) - Ayase, 初音ミク",
        fetchFrom: () => getUrlFromNCM("1466019525"),
        lrcFetchFrom: () => getLRCFromNCM("1466019525"),
    },
    {
        title: "希望有羽毛和翅膀 - 知更鸟 / HOYO-MiX / Chevy",
        fetchFrom: () => getUrlFromNCM("2155423468"),
        lrcFetchFrom: () => getLRCFromNCM("2155423468"),
        offset: -6500,
    },
    {
        title: "君恋し - EasyPop / 巡音ルカ",
        fetchFrom: () => getUrlFromNCM("29163452"),
        lrcFetchFrom: () => getLRCFromNCM("29163452"),
    },
    {
        title: "まっすぐ - 大原ゆい子",
        fetchFrom: () => getUrlFromNCM("1906977699"),
        lrcFetchFrom: () => getLRCFromNCM("1906977699"),
    },
    {
        title: "心拍数#0822 - H△G",
        fetchFrom: () => getUrlFromNCM("472219448"),
        lrcFetchFrom: () => getLRCFromNCM("472219448"),
    },
    {
        title: "乙女的ストーキング - なるみや",
        fetchFrom: () => getUrlFromNCM("2118709322"),
        lrcFetchFrom: () => getLRCFromNCM("2118709322"),
    },
    {
        title: "轻涟 La vaguelette - HOYO-MiX",
        fetchFrom: () => getUrlFromNCM("2100334024"),
        lrcFetchFrom: () => getLRCFromNCM("2100334024"),
    }
]

export function PlayerWidget() {
    const [currentSongIndex, setCurrentSongIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentLrc, setCurrentLrc] = useState("")
    const [audioSrc, setAudioSrc] = useState<string>("")
    const [, setMarqueeActive] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const lyricParserRef = useRef<LyricParser | null>(null)
    const lastLrcRef = useRef("")
    const lyricBoxRef = useRef<HTMLDivElement>(null)
    const lyricTextRef = useRef<HTMLDivElement>(null)
    const isPlayingRef = useRef(isPlaying)
    const [lyricFade, setLyricFade] = useState(true) // 控制歌词淡入淡出
    // 歌词切换时动画
    useEffect(() => {
        setLyricFade(false) // 先淡出
        const timer = setTimeout(() => {
            setLyricFade(true) // 再淡入
        }, 200) // 200ms淡出，再淡入
        return () => clearTimeout(timer)
    }, [currentLrc, currentSongIndex])

    useEffect(() => {
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    // 歌曲切换或播放时，优先用src，否则用fetchFrom
    useEffect(() => {
        let cancelled = false
        const song = songs[currentSongIndex]
        async function resolveSrc() {
            if (song.src) {
                setAudioSrc(song.src)
            } else if (song.fetchFrom) {
                const url = await song.fetchFrom()
                song.src = url // 缓存直链，避免重复请求
                if (!cancelled) setAudioSrc(url)
            } else {
                setAudioSrc("")
            }
        }
        if (isPlaying) {
            resolveSrc()
        }
        return () => { cancelled = true }
    }, [currentSongIndex, isPlaying])

    // 歌词加载和同步
    useEffect(() => {
        setCurrentLrc("")
        lastLrcRef.current = ""
        lyricParserRef.current = null
        const currentSong = songs[currentSongIndex]
        let isActive = true // 标志当前 effect 是否有效

        async function loadLrc() {
            let lrcText = ""
            try {
                if (currentSong?.lrc) {
                    lrcText = await fetch(currentSong.lrc).then(res => res.text())
                } else if (currentSong?.lrcFetchFrom) {
                    lrcText = await currentSong.lrcFetchFrom() // 这里直接拿到歌词文本
                }
            } catch (err) {
                if (!isActive) return
                console.error("加载歌词失败", err)
                lyricParserRef.current = null
                setCurrentLrc("")
                return
            }
            if (!isActive) return
            lyricParserRef.current = new LyricParser(
                lrcText,
                (line: LyricLine) => {
                    if (!isActive) return
                    if (!isPlayingRef.current) return
                    if (line.txt !== lastLrcRef.current) {
                        lastLrcRef.current = line.txt
                        console.log("当前歌词：", line.txt)
                        setCurrentLrc(line.txt)
                    }
                }
            )
            if (audioRef.current) {
                const offset = songs[currentSongIndex]?.offset ?? 0
                lyricParserRef.current.seek(audioRef.current.currentTime * 1000 - offset)
            }
        }

        if (currentSong?.lrc || currentSong?.lrcFetchFrom) {
            loadLrc()
        }

        return () => {
            isActive = false // 切歌时让旧回调失效
        }
    }, [currentSongIndex, audioSrc])

    // 跑马灯动画控制：歌词变化或歌曲切换时判断是否需要动画
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
    }, [currentLrc, currentSongIndex])

    // 歌词和播放进度同步（只绑定一次）
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        const handleTimeUpdate = () => {
            if (lyricParserRef.current) {
                const offset = songs[currentSongIndex]?.offset ?? 0
                lyricParserRef.current.seek(audio.currentTime * 1000 - offset)
            }
        }
        audio.addEventListener("timeupdate", handleTimeUpdate)
        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate)
        }
    }, [currentSongIndex])

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
                        style={{
                            direction: "ltr",
                            unicodeBidi: "plaintext",
                            transition: "opacity 0.3s",
                            opacity: lyricFade ? 1 : 0,
                            display: "inline-block"
                        }}
                    >
                        {(songs[currentSongIndex]?.lrc || songs[currentSongIndex]?.lrcFetchFrom)
                            ? (currentLrc || songs[currentSongIndex]?.title || "loading...")
                            : songs[currentSongIndex]?.title}
                    </span>
                </div>
            </div>
            <button onClick={handlePrev} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                <SkipBack className="w-5 h-5" />
            </button>
            <button onClick={handlePlayPause} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                {isPlaying ? <CirclePause className="w-5 h-5" /> : <CirclePlay className="w-5 h-5" />}
            </button>
            <button onClick={handleNext} className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full">
                <SkipForward className="w-5 h-5" />
            </button>
            {/* 只有audioSrc有值时才渲染audio，避免空字符串警告 */}
            {audioSrc ? (
                <audio ref={audioRef} src={audioSrc} onEnded={handleNext} />
            ) : null}
            <VolumeWidget audioRef={audioRef} />
        </div>
    )
}