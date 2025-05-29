import { useState, useEffect } from "react"
import { Volume2, VolumeX, Volume1 } from "lucide-react"

const VOLUME_KEY = "musicplayer_volume"
const MUTE_KEY = "musicplayer_muted"

interface VolumeWidgetProps {
  audioRef?: React.RefObject<HTMLAudioElement | null>
}

export function VolumeWidget({ audioRef }: VolumeWidgetProps) {
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)

  // 初始化时读取本地存储
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem(VOLUME_KEY)
      const savedMuted = localStorage.getItem(MUTE_KEY)
      if (savedVolume !== null) {
        const v = parseInt(savedVolume)
        if (!isNaN(v) && v >= 0 && v <= 100) setVolume(v)
      }
      if (savedMuted !== null) {
        setIsMuted(savedMuted === "true")
      }
    }
  }, [])

  // 同步音量和静音状态到 audio 元素，并存储
  useEffect(() => {
    if (audioRef && audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
      audioRef.current.muted = isMuted
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(VOLUME_KEY, String(volume))
      localStorage.setItem(MUTE_KEY, String(isMuted))
    }
  }, [volume, isMuted, audioRef])

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-5 text-slate-500 dark:text-slate-300" />
    } else if (volume < 50) {
      return <Volume1 className="h-5 text-slate-500 dark:text-slate-300" />
    } else {
      return <Volume2 className="h-5 text-slate-500 dark:text-slate-300" />
    }
  }

  const handleMuteClick = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    if (v > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={handleMuteClick}
      >
        {getVolumeIcon()}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={handleVolumeChange}
        className="w-16 h-1 accent-slate-500"
        title="音量"
      />
    </div>
  )
}