"use client"

import { useState, useEffect } from "react"

export function TimeWidget() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      weekday: "short",
    })
  }

  return (
    <div className="flex items-end px-2 py-1 rounded cursor-pointer hover:bg-slate-700/30 transition-colors">
      <div className="text-slate-400 text-sm leading-none mt-0.5">{formatDate(time)}</div>
      <span className="mx-1"></span>
      <div className="text-slate-300 text-sm font-medium leading-none">{formatTime(time)}</div>
    </div>
  )
}
