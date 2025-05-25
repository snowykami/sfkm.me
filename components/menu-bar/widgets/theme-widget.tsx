"use client"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggleButton() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 检查 localStorage 中存储的主题
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme")
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      
      // 优先使用存储的主题,否则使用系统主题
      const theme = savedTheme || (systemTheme ? "dark" : "light")
      
      setIsDark(theme === "dark")
      document.documentElement.classList.toggle("dark", theme === "dark")
    }
  }, [])

  const toggleTheme = () => {
    if (typeof window === "undefined") return
    const html = document.documentElement
    const newTheme = html.classList.contains("dark") ? "light" : "dark"
    
    html.classList.toggle("dark")
    localStorage.setItem("theme", newTheme)
    setIsDark(newTheme === "dark")
  }

  return (
    <button
      className="p-2 rounded-full hover:bg-slate-700/40 transition-colors flex items-center justify-center"
      title={isDark ? "切换为浅色模式" : "切换为深色模式"}
      onClick={toggleTheme}
      aria-label="切换主题"
      type="button"
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-slate-400" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-300" />
      )}
    </button>
  )
}