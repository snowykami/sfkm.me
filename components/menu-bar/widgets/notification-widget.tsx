"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing } from "lucide-react"

export function NotificationWidget() {
  const [hasNotifications, setHasNotifications] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    // 模拟通知状态
    const timer = setInterval(() => {
      const shouldHaveNotifications = Math.random() > 0.6
      setHasNotifications(shouldHaveNotifications)
      setNotificationCount(shouldHaveNotifications ? Math.floor(Math.random() * 5) + 1 : 0)
    }, 15000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-slate-700/30 transition-colors">
      {hasNotifications ? <BellRing className="w-3 h-3 text-blue-400" /> : <Bell className="w-3 h-3 text-slate-400" />}

      {notificationCount > 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold leading-none">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        </div>
      )}
    </div>
  )
}
