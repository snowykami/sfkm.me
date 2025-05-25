import type React from "react"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import {
  Github,
  Mail,
  Twitter,
  MessageCircle,
  ExternalLink,
  Calendar,
  MessageCircleMore,
  Tv,
  HeadphonesIcon
} from "lucide-react"


export default function ContactsContent() {
  const contacts = [
    { icon: Mail, label: "邮箱", value: "a@sfkm.me", link: "mailto:a@sfkm.me" },
    { icon: Github, label: "GitHub", value: "github.com/snowykami", link: "https://github.com/snowykami" },
    { icon: MessageCircleMore, label: "轻雪社区", value: "snowykami@lab.liteyuki.icu", link: "https://lab.liteyuki.icu/@snowykami" },
    { icon: Tv, label: "bilibili", value: "snowykami", link: "https://space.bilibili.com/233938750" },
    {icon: HeadphonesIcon, label: "网易云音乐", value: "snowykami", link: "https://music.163.com/#/user/home?id=1491388449"},
    { icon: Twitter, label: "X", value: "@snowykami1145", link: "https://x.com/snowykami1145" },
  ]
  // 统一判断在线状态
  const startHour = 9 // 在线开始时间
  const endHour = 24 // 在线结束时间
  const hour = new Date().getHours()
  const isOnline = hour >= startHour && hour < endHour
  return (
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <MessageCircle className="w-5 h-5 text-slate-400 mr-2" />
          <h2 className="text-lg font-semibold text-white">联系方式</h2>
        </div>

        {contacts.map((contact, index) => (
          <div
            key={index}
            className="flex items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
          >
            <contact.icon className="w-5 h-5 text-slate-400 mr-3" />
            <div className="flex-1">
              <p className="text-slate-200 font-medium">{contact.label}</p>
              <p className="text-slate-400 text-sm">{contact.value}</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600">
              <a href={contact.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        ))}

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-blue-300 font-medium">在线状态</span>
          </div>
          <p className="text-slate-300 text-sm">通常在北京时间 {startHour}:00-{endHour}:00 在线</p>
          <div className="flex items-center mt-2">
            <div className={`w-2 h-2 ${isOnline ? "bg-green-400" : "bg-gray-400"} rounded-full mr-2`}></div>
            <span
              className={`text-sm ${isOnline ? "text-green-400" : "text-gray-400"}`}
            >
              {isOnline ? "当前在线" : "当前离线"}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  )
}
