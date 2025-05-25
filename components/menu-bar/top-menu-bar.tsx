"use client"

import { useState, useEffect } from "react"
import { AppleWidget } from "./widgets/apple-widget"
import { TimeWidget } from "./widgets/time-widget"
import { WeatherWidget } from "./widgets/weather-widget"
import { Marquee } from "./widgets/marquee-widget"
import { ThemeToggleButton } from "./widgets/theme-widget"
import { PlayerWidget } from "./widgets/player-widget"

interface TopMenuBarProps {
  className?: string
  title?: string
}

export function TopMenuBar({ className = "", title = "Window Title" }: TopMenuBarProps) {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // 等待组件挂载后再根据 isMobile 渲染数据
  if (!mounted) return null
  if (isMobile) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md border-b border-slate-300/30 dark:border-slate-700/30 z-[9999] transition-colors ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2 max-h-9 min-h-9">
        {/* 左侧区域 */}
        <div className="flex items-center space-x-4">
          <AppleWidget />
          <span className="text-slate-600 dark:text-slate-300 text-sm font-bold transition-colors">
            {title}
          </span>
        </div>
        {/* 右侧状态区域 */}
        <div className="flex items-center space-x-1">
          <PlayerWidget />
          <Marquee />
          <WeatherWidget />
          <ThemeToggleButton />
          <TimeWidget />
        </div>
      </div>
    </div>
  )
}