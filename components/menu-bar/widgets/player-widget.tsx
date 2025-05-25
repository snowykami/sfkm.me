// 播放器组件
import React, { useState, useRef, useEffect, } from "react"
import { CirclePlay, CirclePause, SkipForward, SkipBack } from "lucide-react"
import LyricParser from "lyric-parser"
import { VolumeWidget } from "./volume-widget"

interface Song {
    title: string
    src: string
    lrc?: string
    cover?: string
}

type LyricLine = {
    time: number
    txt: string
}

const songs: Song[] = [
    {
        title: "あの夢をなぞって(初音ミク Ver.) - Ayase, 初音ミク",
        src: "https://drive.liteyuki.org/f/aMTO/Ayase%2C%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF%20-%20%E3%81%82%E3%81%AE%E5%A4%A2%E3%82%92%E3%81%AA%E3%81%9D%E3%82%99%E3%81%A3%E3%81%A6%20%28%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF%20Ver.%29.flac",
        lrc: "https://drive.liteyuki.org/f/gKik/Ayase%2C%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF%20-%20%E3%81%82%E3%81%AE%E5%A4%A2%E3%82%92%E3%81%AA%E3%81%9D%E3%82%99%E3%81%A3%E3%81%A6%20%28%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF%20Ver.%29.lrc"
    },
    {
        title: "不因寂寞才想你 - 1个球",
        src: "https://drive.liteyuki.org/f/JEhn/1%E4%B8%AA%E7%90%83%20-%20%E4%B8%8D%E6%98%AF%E5%9B%A0%E4%B8%BA%E5%AF%82%E5%AF%9E%E6%89%8D%E6%83%B3%E4%BD%A0.flac",
        lrc: "https://drive.liteyuki.org/f/lKfn/1%E4%B8%AA%E7%90%83%20-%20%E4%B8%8D%E6%98%AF%E5%9B%A0%E4%B8%BA%E5%AF%82%E5%AF%9E%E6%89%8D%E6%83%B3%E4%BD%A0.lrc"
    },
    {
        title: "爱言叶III - DECO*27, 初音ミク",
        src: "https://drive.liteyuki.org/f/DdSL/DECO27%2C%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF%20-%20%E6%84%9B%E8%A8%80%E8%91%89III.flac",
        lrc: "https://drive.liteyuki.org/f/OVCz/DECO27%2C%E5%88%9D%E9%9F%B3%E3%83%9F%E3%82%AF%20-%20%E6%84%9B%E8%A8%80%E8%91%89III.lrc"
    },
    {
        title: "同担☆拒否 - HoneyWorks, かぴ",
        src: "https://drive.liteyuki.org/f/B9Un/HoneyWorks%2C%E3%81%8B%E3%81%B2%E3%82%9A%20-%20%E5%90%8C%E6%8B%85%E2%98%86%E6%8B%92%E5%90%A6.flac",
        lrc: "https://drive.liteyuki.org/f/3Bum/HoneyWorks%2C%E3%81%8B%E3%81%B2%E3%82%9A%20-%20%E5%90%8C%E6%8B%85%E2%98%86%E6%8B%92%E5%90%A6.lrc"
    },
]

export function PlayerWidget() {
    const [currentSongIndex, setCurrentSongIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentLrc, setCurrentLrc] = useState("")
    const [, setMarqueeActive] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const lyricParserRef = useRef<LyricParser | null>(null)
    const lastLrcRef = useRef("")
    const lyricBoxRef = useRef<HTMLDivElement>(null)
    const lyricTextRef = useRef<HTMLDivElement>(null)
    const isPlayingRef = useRef(isPlaying)
    useEffect(() => {
        isPlayingRef.current = isPlaying
    }, [isPlaying])

    // 歌词加载和同步
    useEffect(() => {
        setCurrentLrc("")
        lastLrcRef.current = ""
        lyricParserRef.current = null
        const currentSong = songs[currentSongIndex]
        let isActive = true // 标志当前 effect 是否有效
        if (currentSong?.lrc) {
            fetch(currentSong.lrc)
                .then(res => res.text())
                .then(text => {
                    lyricParserRef.current = new LyricParser(
                        text,
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
                        lyricParserRef.current.seek(audioRef.current.currentTime * 1000)
                    }
                })
                .catch(err => {
                    if (!isActive) return
                    console.error("加载歌词失败", err)
                    lyricParserRef.current = null
                    setCurrentLrc("")
                })
        }
        return () => {
            isActive = false // 切歌时让旧回调失效
        }
    }, [currentSongIndex])

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
                lyricParserRef.current.seek(audio.currentTime * 1000)
            }
        }
        audio.addEventListener("timeupdate", handleTimeUpdate)
        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate)
        }
    }, [])

    // 播放/暂停时控制 audio
    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play().catch(err => {
                console.log("播放错误：", err)
            })
        } else {
            audioRef.current?.pause()
        }
    }, [isPlaying, currentSongIndex])

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
                        overflow: "visible", // 不裁剪
                        direction: "rtl",    // 让文本右端对齐容器右侧，左侧无限延伸
                        textAlign: "left"    // 让内容从右往左自然排列
                    }}
                >
                    <span style={{ direction: "ltr", unicodeBidi: "plaintext" }}>
                        {songs[currentSongIndex]?.lrc
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
            <audio ref={audioRef} src={songs[currentSongIndex]?.src} onEnded={handleNext} />
            <VolumeWidget audioRef={audioRef} />
        </div>
    )
}