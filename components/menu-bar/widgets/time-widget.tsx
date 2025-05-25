import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export function TimeWidget() {
  const [time, setTime] = useState<Date | null>(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    setTime(new Date()) // 首次渲染
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 语言映射
  const localeMap: Record<string, string> = {
    zh: "zh-CN",
    en: "en-US",
    ja: "ja-JP",
  }
  const locale = localeMap[i18n.language] || "zh-CN"

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      weekday: "short",
    })
  }

  // 只在客户端渲染
  if (!time) return null

  return (
    <div className="flex items-end px-2 py-1 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/30 transition-colors">
      <div className="text-slate-700 dark:text-slate-300 text-sm leading-none mt-0.5">{formatDate(time)}</div>
      <span className="mx-1"></span>
      <div className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-none">{formatTime(time)}</div>
    </div>
  )
}