"use client"

import { useState, useEffect } from "react"
import { AppleWidget } from "./widgets/apple-widget"
import { TimeWidget } from "./widgets/time-widget"
import { WeatherWidget } from "./widgets/weather-widget"
import { VolumeWidget } from "./widgets/volume-widget"
import { t } from "i18next"
// import { NotificationWidget } from "./widgets/notification-widget"

interface TopMenuBarProps {
  className?: string
  title?: string    // 新增
}

export function TopMenuBar({ className = "", title = "Window Title" }: TopMenuBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (isMobile) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/30 z-[9999] ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2 max-h-9">
        {/* 左侧区域 */}
        <div className="flex items-center space-x-4">
          <AppleWidget />
          <span className="text-slate-300 text-sm font-medium">{title}</span>
        </div>
        {/* 右侧状态区域 */}
        <div className="flex items-center space-x-1">
          <VolumeWidget />
          <WeatherWidget />
          <TimeWidget />
        </div>
      </div>
    </div>
  )
}