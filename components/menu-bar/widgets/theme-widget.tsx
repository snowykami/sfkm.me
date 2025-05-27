"use client"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export function ThemeToggleButton() {
  const [isDark, setIsDark] = useState(false)

  // 检查系统默认主题
  const getSystemTheme = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme")
      const systemTheme = getSystemTheme()
      const theme = savedTheme || systemTheme

      setIsDark(theme === "dark")
      document.documentElement.classList.toggle("dark", theme === "dark")
    }
  }, [])

  const toggleTheme = () => {
    if (typeof window === "undefined") return
    const html = document.documentElement
    const systemTheme = getSystemTheme()
    const isNowDark = html.classList.contains("dark")
    const newTheme = isNowDark ? "light" : "dark"

    html.classList.toggle("dark")
    setIsDark(newTheme === "dark")

    // 如果切换后的主题和系统主题一致，则清除 localStorage
    if (newTheme === systemTheme) {
      localStorage.removeItem("theme")
    } else {
      localStorage.setItem("theme", newTheme)
    }
  }

  return (
    <button
      className="p-2 rounded-full hover:bg-slate-700/40 transition-colors flex items-center justify-center"
      title={isDark ? "切换为浅色模式" : "切换为深色模式"}
      onClick={toggleTheme}
      aria-label="切换主题"
      type="button"
      style={{
        transition: "box-shadow 0.2s",
        boxShadow: isDark ? undefined : undefined,
        ...(typeof window !== "undefined" && window.matchMedia(":hover").matches
          ? {
              boxShadow: isDark ? undefined : undefined
            }
          : {}),
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px 0 rgba(0,0,0,0.15)"
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = ""
      }}
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-slate-400" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-300" />
      )}
    </button>
  )
}