"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function WiFiWidget() {
  const [isConnected, setIsConnected] = useState(true)
  const [signalStrength, setSignalStrength] = useState(3) // 0-3

  useEffect(() => {
    // 模拟网络状态变化
    const timer = setInterval(() => {
      setIsConnected(Math.random() > 0.1) // 90% 连接概率
      setSignalStrength(Math.floor(Math.random() * 4))
    }, 10000)

    return () => clearInterval(timer)
  }, [])

  const getSignalBars = () => {
    const bars = []
    for (let i = 0; i < 3; i++) {
      bars.push(
        <div
          key={i}
          className={`w-0.5 rounded-full ${i < signalStrength ? "bg-slate-300 h-2" : "bg-slate-600 h-1"}`}
          style={{ height: `${4 + i * 2}px` }}
        />,
      )
    }
    return bars
  }

  return (
    <div className="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-slate-700/30 transition-colors">
      {isConnected ? (
        <div className="flex items-end space-x-0.5">{getSignalBars()}</div>
      ) : (
        <WifiOff className="w-3 h-3 text-slate-500" />
      )}
    </div>
  )
}
