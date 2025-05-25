"use client"

import { useState } from "react"
import { Volume2, VolumeX, Volume1 } from "lucide-react"

export function VolumeWidget() {
  const [volume, ] = useState(75)
  const [isMuted, setIsMuted] = useState(false)

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-5 text-slate-400" />
    } else if (volume < 50) {
      return <Volume1 className="h-5 text-slate-300" />
    } else {
      return <Volume2 className="h-5 text-slate-300" />
    }
  }

  const handleClick = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div
      className="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-slate-700/30 transition-colors"
      onClick={handleClick}
    >
      {getVolumeIcon()}
    </div>
  )
}
