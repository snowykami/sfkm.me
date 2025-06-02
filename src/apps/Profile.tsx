
import { MapPin, } from "lucide-react"
import { t } from "i18next"
import { useEffect, useState, useRef } from "react"
import { CardContent } from "@/components/ui/Card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import config from "@/config"

const gradientClasses = [
  "bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400",
  "bg-gradient-to-r from-pink-400 via-red-400 to-yellow-400",
  "bg-gradient-to-r from-green-400 via-teal-400 to-blue-400",
  "bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400",
]


export default function ProfileContent() {
  const [descIndex, setDescIndex] = useState(0)
  const [gradientIndex, setGradientIndex] = useState(0) // 昵称背景渐变索引
  const [fade, setFade] = useState(true)
  // 添加引用以跟踪是否已装载
  const isMounted = useRef(true)

  // 昵称背景渐变变化
  useEffect(() => {
    const timer = setInterval(() => {
      setGradientIndex(i => (i + 1) % gradientClasses.length)
    }, 2000)
    return () => {
      clearInterval(timer)
      isMounted.current = false
    }
  }, [])

  // 描述文本变化
  useEffect(() => {
    let fadeTimer: NodeJS.Timeout
    const timer = setInterval(() => {
      setFade(false)
      fadeTimer = setTimeout(() => {
        setDescIndex((prev) => (prev + 1) % config.profile.descriptions.length)
        setFade(true)
      }, 400)
    }, 3500)

    return () => {
      clearInterval(timer)
      clearTimeout(fadeTimer)
    }
  }, []) // 保持空依赖数组

  return (
    <CardContent className="p-8 transition-colors">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flip-container group w-24 h-24 mb-4 ring-4 ring-slate-300/50 dark:ring-slate-600/50 rounded-full overflow-hidden">
          <div className="flipper">
            {/* 正面：显示正常头像，圆形边框 */}
            <div className="front">
              <Avatar className="w-full h-full">
                <AvatarImage src="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640" alt="Snowykami Profile" />
                <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  SK
                </AvatarFallback>
              </Avatar>
            </div>
            {/* 反面：可以自定义背景或图标，这里示例使用占位图 */}
            <div className="back">
              <Avatar className="w-full h-full" style={{ transform: "scaleX(-1)" }}>
                <AvatarImage src="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640" alt="Back Face" />
                <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-purple-600 to-blue-500 text-white">
                  SK
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        {/* 大昵称 */}
        <div className="w-full max-w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
          <h1
            className={`text-2xl font-bold mb-1 ${gradientClasses[gradientIndex]} bg-clip-text text-transparent leading-relaxed py-1 min-w-[12rem] px-4 transition-colors duration-700`}
            style={{ fontFamily: "'Pacifico', cursive" }}
          >
            Snowykami
          </h1>
        </div>

        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{t("profile.location")}</span>
        </div>
      </div>

      <div className="mb-6 min-h-[40px]">
        <p
          className={`text-slate-600 dark:text-slate-300 text-sm leading-relaxed text-center transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}
        >
          {t(config.profile.descriptions[descIndex])}
        </p>
      </div>
      {/* 标签区域 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">
          {t("profile.tag")}
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {config.profile.skillBadges.map(badge => (
            <Badge key={badge.key} className={badge.className}>
              {badge.label}
            </Badge>
          ))}
        </div>
      </div>
      {/* 分割线 */}
      <div className="mt-6 pt-6 border-t border-slate-300 dark:border-slate-700/50">
        <div className="flex justify-center">
        </div>
      </div>
      {/* 应用区域 */}
      <div className="mt-2 flex flex-col items-center">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          {t("profile.sites")}
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 justify-items-center mx-auto">
          {config.profile.sites.map(app => (
            <a
              key={app.label}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 hover:scale-105 transition-transform duration-200">
                <app.icon className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </div>
              <div className="mt-1 w-16 text-center overflow-hidden">
                <div className="whitespace-nowrap animate-marquee text-sm">
                  {app.label}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
      {/* 分割线 */}
      <div className="mt-8 pt-6">
        <div className="flex justify-center">
          <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
        </div>
      </div>
      {/* 头像动效 */}
      <style jsx>{`
  .flip-container {
    perspective: 1000px;
  }
  .flipper {
    transition: 0.6s;
    transform-style: preserve-3d;
    position: relative;
    width: 100%;
    height: 100%;
  }
  .flip-container:hover .flipper {
    transform: rotateY(180deg);
  }
  .front, .back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
  }
  .back {
    transform: rotateY(180deg);
  }
`}</style>
    </CardContent>
  )
}