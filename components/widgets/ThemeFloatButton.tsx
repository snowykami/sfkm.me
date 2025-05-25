"use client"

import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export function MobileThemeFloatButton() {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // 确保只在客户端挂载后渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 仅在移动设备显示
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // 初始化主题状态，防止 SSR 与客户端不一致
  useEffect(() => {
    if (typeof window !== "undefined") {
      const html = document.documentElement
      setIsDark(html.classList.contains("dark"))
    }
  }, [mounted])

  if (!mounted || !isMobile) return null

  const toggleTheme = () => {
    if (typeof window === "undefined") return
    const html = document.documentElement
    const newTheme = html.classList.contains("dark") ? "light" : "dark"
    if (newTheme === "dark") {
      html.classList.add("dark")
    } else {
      html.classList.remove("dark")
    }
    localStorage.setItem("theme", newTheme)
    setIsDark(newTheme === "dark")
  }

  return (
    <div className="fixed right-4 bottom-20 z-[5000]">
      <button
        onClick={toggleTheme}
        className="p-3 rounded-full bg-slate-500/90 dark:bg-slate-700/90 shadow-lg hover:bg-slate-700/90 transition-colors"
        title={isDark ? "切换为浅色模式" : "切换为深色模式"}
      >
        {isDark ? (
          <Moon className="w-6 h-6 text-slate-200" />
        ) : (
          <Sun className="w-6 h-6 text-yellow-300" />
        )}
      </button>
    </div>
  )
}