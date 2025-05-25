"use client"

import { useState, useEffect } from "react"
import { Battery, BatteryLow, Zap } from "lucide-react"

export function BatteryWidget() {
  const [batteryLevel, setBatteryLevel] = useState(85)
  const [isCharging, setIsCharging] = useState(false)

  useEffect(() => {
    // 模拟电池状态变化
    const timer = setInterval(() => {
      setBatteryLevel((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1
        return Math.max(0, Math.min(100, prev + change))
      })
      setIsCharging(Math.random() > 0.7)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const getBatteryColor = () => {
    if (isCharging) return "text-green-400"
    if (batteryLevel < 20) return "text-red-400"
    if (batteryLevel < 50) return "text-yellow-400"
    return "text-slate-300"
  }

  return (
    <div className="flex items-center space-x-1 px-2 py-1 rounded cursor-pointer hover:bg-slate-700/30 transition-colors">
      <div className="relative">
        {isCharging ? (
          <Zap className={`${getBatteryColor()}`} />
        ) : batteryLevel < 20 ? (
          <BatteryLow className={`${getBatteryColor()}`} />
        ) : (
          <Battery className={`${getBatteryColor()}`} />
        )}
      </div>
      <span className={`text-xs font-medium ${getBatteryColor()}`}>{batteryLevel}%</span>
    </div>
  )
}
