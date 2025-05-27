import React, { useState, useRef, useEffect } from "react"
import { CirclePlay, CirclePause, SkipForward, SkipBack } from "lucide-react"
import { VolumeWidget } from "./volume-widget"
import LyricParser, { LyricLine } from "lyric-parser"

// Song 类型
interface Song {
    title: string
    src: string
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
        title: `${songData.data[0].song} - ${songData.data[0].singer}` || "Unknown",
        src: songData.data[0].url.replace("http://", "https://"),
        lrc: lrcData.lyric || "",
        cover: songData.data[0].cover,
        offset,
    }
}

// 歌曲列表，支持常量和懒加载
const songs: SongOrPromise[] = [
    // 懒加载
    () => fetchSongFromNCM("2155423468", -6000), // 希望有羽毛和翅膀
    () => fetchSongFromNCM("1944651767"),   // Antler - 鹿角
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
    const [, setMarqueeActive] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const lyricParserRef = useRef<LyricParser | null>(null)
    const lastLrcRef = useRef("")
    const lyricBoxRef = useRef<HTMLDivElement>(null)
    const lyricTextRef = useRef<HTMLDivElement>(null)
    const isPlayingRef = useRef(isPlaying)
    const [lyricFade, setLyricFade] = useState(true)
    const [displayLrc, setDisplayLrc] = useState("")


    // 歌词切换时动画
    useEffect(() => {
        setLyricFade(false)
        const timer = setTimeout(() => setLyricFade(true), 200)
        return () => clearTimeout(timer)
    }, [currentLrc, currentSongIndex])
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
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    // 切换曲目时，无论是否播放，都请求元信息，失败自动切下一首
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

    // 歌词加载和同步
    useEffect(() => {
        setCurrentLrc("")
        lastLrcRef.current = ""
        lyricParserRef.current = null
        let isActive = true

        async function loadLrc() {
            let lrcText = ""
            try {
                if (currentSong?.lrc) {
                    lrcText = currentSong.lrc
                }
            } catch (err) {
                if (!isActive) return
                console.error("加载歌词失败", err)
                lyricParserRef.current = null
                setCurrentLrc("")
                return
            }
            if (!isActive) return
            if (!lrcText) return
            lyricParserRef.current = new LyricParser(
                lrcText,
                (line: LyricLine) => {
                    if (!isActive) return
                    if (!isPlayingRef.current) return
                    if (line.txt !== lastLrcRef.current) {
                        lastLrcRef.current = line.txt
                        setCurrentLrc(line.txt)
                    }
                }
            )
            if (audioRef.current) {
                const offset = currentSong?.offset ?? 0
                lyricParserRef.current.seek(audioRef.current.currentTime * 1000 - offset)
            }
        }

        if (currentSong?.lrc) {
            loadLrc()
        }

        return () => {
            isActive = false
        }
    }, [currentSong, audioSrc])

    // 跑马灯动画控制
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

    // 歌词和播放进度同步
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        const handleTimeUpdate = () => {
            if (lyricParserRef.current) {
                const offset = currentSong?.offset ?? 0
                lyricParserRef.current.seek(audio.currentTime * 1000 - offset)
            }
        }
        audio.addEventListener("timeupdate", handleTimeUpdate)
        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate)
        }
    }, [currentSong?.offset, currentSongIndex])

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
                            ? (displayLrc || currentSong?.title || "loading...")
                            : currentSong?.title}
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
            {audioSrc ? (
                <audio ref={audioRef} src={audioSrc} onEnded={handleNext} />
            ) : null}
            <VolumeWidget audioRef={audioRef} />
        </div>
    )
}