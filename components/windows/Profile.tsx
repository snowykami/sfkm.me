import { CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { t } from "i18next"

export default function ProfileContent() {
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

      <div className="mb-6">
        <p className="text-slate-300 text-sm leading-relaxed text-center">
          很高兴认识你！
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">{t("profile.tag")}</h3>
        <div className="flex flex-wrap gap-2">
          {/* 此处是个人介绍的标签部分 */}
          <Badge className="bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border-teal-500/30">Python</Badge>
          <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30">TypeScript</Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30">Vue.js</Badge>
          <Badge className="bg-sky-400/20 text-sky-300 hover:bg-sky-400/30 border-sky-400/30">Go</Badge>
          <Badge className="bg-blue-400/20 text-blue-200 hover:bg-blue-400/30 border-blue-400/30">Docker</Badge>
          <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-indigo-500/30">Kubernetes</Badge>
          <Badge className="bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400/30 border-cyan-400/30">Cloud Native</Badge>
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