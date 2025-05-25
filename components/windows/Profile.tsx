import { CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { t } from "i18next"
import { useEffect, useState } from "react"

const descriptions = [
  t("profile.description1"),
  t("profile.description2"),
  t("profile.description3"),
  t("profile.description4"),
  t("profile.description5"),
]


type SkillBadge = {
  key: string
  label: string
  className: string
}
const skillBadges: SkillBadge[] = [
  { key: "python", label: "Python", className: "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border-teal-500/30" },
  { key: "go", label: "Go", className: "bg-sky-400/20 text-sky-300 hover:bg-sky-400/30 border-sky-400/30" },
  { key: "docker", label: "Docker", className: "bg-blue-400/20 text-blue-200 hover:bg-blue-400/30 border-blue-400/30" },
  { key: "k8s", label: "Kubernetes", className: "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-indigo-500/30" },
  { key: "cloud", label: "Cloud Native", className: "bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 border-cyan-400/30" },
  { key: "typescript", label: "TypeScript", className: "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30" },
  { key: "vue", label: "Vue.js", className: "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30" },
  { key: "linux", label: "Linux", className: "bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border-gray-500/30" },
  { key: "devops", label: "DevOps", className: "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border-purple-500/30" },
]

export default function ProfileContent() {
  const [descIndex, setDescIndex] = useState(0)
  const [fade, setFade] = useState(true)
  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setDescIndex((prev) => (prev + 1) % descriptions.length)
        setFade(true)
      }, 400) // 动画时长
    }, 3500)
    return () => clearInterval(timer)
  }, [])
  return (
    <CardContent className="p-8">
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar className="w-24 h-24 mb-4 ring-4 ring-slate-600/50">
          <AvatarImage src="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640" alt="Snowykami Profile" />
          <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            SK
          </AvatarFallback>
        </Avatar>

        <h1 className="text-2xl font-bold text-white mb-1">Snowykami</h1>
        <p className="text-slate-300 font-medium mb-2">{t("profile.subname")}</p>
        <div className="flex items-center text-slate-400 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{t("profile.location")}</span>
        </div>
      </div>

      <div className="mb-6 min-h-[40px]">
        <p
          className={`text-slate-300 text-sm leading-relaxed text-center transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}
        >
          {descriptions[descIndex]}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">{t("profile.tag")}</h3>
        <div className="flex flex-wrap gap-2">
          {skillBadges.map(badge => (
            <Badge key={badge.key} className={badge.className}>
              {badge.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700/50">
        <div className="flex justify-center">
          <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
        </div>
      </div>
    </CardContent>
  )
}