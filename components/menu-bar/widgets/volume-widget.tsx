import { useState, useEffect } from "react"
import { Volume2, VolumeX, Volume1 } from "lucide-react"

interface VolumeWidgetProps {
  audioRef?: React.RefObject<HTMLAudioElement | null>
}

export function VolumeWidget({ audioRef }: VolumeWidgetProps) {
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)

  // 同步音量和静音状态到 audio 元素
  useEffect(() => {
    if (audioRef && audioRef.current) {
      audioRef.current.volume = volume / 100
      audioRef.current.muted = isMuted
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
    setVolume(Number(e.target.value))
    if (isMuted && Number(e.target.value) > 0) {
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
        value={isMuted ? 0 : volume}
        onChange={handleVolumeChange}
        className="w-16 h-1 accent-slate-500"
        title="音量"
      />
    </div>
  )
}