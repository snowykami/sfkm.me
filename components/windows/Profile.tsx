import { CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, ExternalLink, Github} from "lucide-react"
import { t } from "i18next"
import { useEffect, useState } from "react"

// 建议 descriptions 用 key 数组，渲染时再 t(key)，避免 hydration 问题
const descriptionKeys = [
  "profile.description1",
  "profile.description2",
  "profile.description3",
  "profile.description4",
  "profile.description5",
  "profile.description6",
]

// 定义应用数组
const apps = [
  { label: "Blog", url: "https://blog.sfkm.me", icon: ExternalLink },
  { label: "GitHub", url: "https://github.com/snowykami", icon: Github },
  { label: "AList", url: "https://als.liteyuki.org", icon: ExternalLink },
  { label: "CDN", url: "https://cdn.liteyuki.org", icon: ExternalLink },
]

type SkillBadge = {
  key: string
  label: string
  className: string
}
const skillBadges: SkillBadge[] = [
  // 浅色和深色都适配
  { key: "python", label: "Python", className: "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-500/30 border-teal-200 dark:border-teal-500/30" },
  { key: "go", label: "Go", className: "bg-sky-100 dark:bg-sky-400/20 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-400/30 border-sky-200 dark:border-sky-400/30" },
  { key: "docker", label: "Docker", className: "bg-blue-100 dark:bg-blue-400/20 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-400/30 border-blue-200 dark:border-blue-400/30" },
  { key: "k8s", label: "Kubernetes", className: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 border-indigo-200 dark:border-indigo-500/30" },
  { key: "cloud", label: "Cloud Native", className: "bg-cyan-100 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-400/30 border-cyan-200 dark:border-cyan-400/30" },
  { key: "typescript", label: "TypeScript", className: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 border-blue-200 dark:border-blue-500/30" },
  { key: "vue", label: "Vue.js", className: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 border-emerald-200 dark:border-emerald-500/30" },
  { key: "linux", label: "Linux", className: "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500/30 border-gray-200 dark:border-gray-500/30" },
  { key: "devops", label: "DevOps", className: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 border-purple-200 dark:border-purple-500/30" },
]

export default function ProfileContent() {
  const [descIndex, setDescIndex] = useState(0)
  const [fade, setFade] = useState(true)
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setDescIndex((prev) => (prev + 1) % descriptionKeys.length)
        setFade(true)
      }, 400)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

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
        <h1
          className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-relaxed min-h-[2.5rem]"
          style={{ fontFamily: "'Pacifico', cursive" }}
        >
          Snowykami
        </h1>

        {/* <p className="text-slate-500 dark:text-slate-300 font-medium mb-2">{t("profile.subname")}</p> */}
        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{t("profile.location")}</span>
        </div>
      </div>

      <div className="mb-6 min-h-[40px]">
        <p
          className={`text-slate-600 dark:text-slate-300 text-sm leading-relaxed text-center transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}
        >
          {t(descriptionKeys[descIndex])}
        </p>
      </div>
      {/* 标签区域 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">
          {t("profile.tag")}
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {skillBadges.map(badge => (
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
          {apps.map(app => (
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