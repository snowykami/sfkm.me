"use client"

import { useState, useEffect } from "react"
import { Cloud, Sun, CloudRain, CloudSnow } from "lucide-react"

interface WeatherData {
  temperature: number
  condition: "sunny" | "cloudy" | "rainy" | "snowy"
  location: string
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 22,
    condition: "sunny",
    location: "北京",
  })

  // 模拟天气数据更新
  useEffect(() => {
    const conditions: WeatherData["condition"][] = ["sunny", "cloudy", "rainy", "snowy"]
    const timer = setInterval(() => {
      setWeather((prev) => ({
        ...prev,
        temperature: Math.floor(Math.random() * 30) + 5,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
      }))
    }, 300000) // 30秒更新一次

    return () => clearInterval(timer)
  }, [])

  const getWeatherIcon = () => {
    switch (weather.condition) {
      case "sunny":
        return <Sun className="h-5 text-yellow-500 dark:text-yellow-300" />
      case "cloudy":
        return <Cloud className="h-5 text-slate-500 dark:text-slate-300" />
      case "rainy":
        return <CloudRain className="h-5 text-blue-500 dark:text-blue-300" />
      case "snowy":
        return <CloudSnow className="h-5 text-slate-500 dark:text-slate-300" />
      default:
        return <Sun className="h-5 text-yellow-500 dark:text-slate-300" />
    }
  }

  return (
    <div className="flex items-center space-x-1 px-2 py-1 rounded cursor-pointer hover:bg-slate-700/30 transition-colors">
      {getWeatherIcon()}
      <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{weather.temperature}°</span>
    </div>
  )
}
