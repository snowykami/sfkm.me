import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, ExternalLink} from "lucide-react"
import { Button } from "../ui/button"

export default function ProjectsContent() {
  const projects = [
    {
      name: "Liteyuki Bot",
      description: "轻量级跨平台的Python聊天机器人框架",
      tech: ["Python", "FastAPI", "WebSocket", "NoneBot2"],
      status: "活跃开发",
      link: "https://bot.liteyuki.org"
    },
    {
      name: "Magipoke APP",
      description: "涵盖学校生活的多功能应用",
      tech: ["Go", "CloudWeGo", "Kotlin", "Swift", "Objective-C"],
      status: "活跃开发",
      link: "https://app.redrock.team/#/"
    },
    {
      name: "Server Status",
      description: "现代化的服务器状态监控面板",
      tech: ["Vue.js", "Go", "Tailwind"],
      status: "已完成",
      link: "https://status.liteyuki.org"
    },
    {
      name: "Litedoc",
      description: "便捷的Python模块markdown文档生成工具",
      tech: ["Python", "Markdown", "vitepress"],
      status: "已完成",
      link: "https://github.com/LiteyukiStudio/litedoc"
    },
  ]

  return (
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Briefcase className="w-5 h-5 text-slate-400 mr-2" />
          <h2 className="text-lg font-semibold text-white">项目展示</h2>
        </div>

        {projects.map((project, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                {/* 项目名称加链接 */}
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white hover:underline"
                >
                  {project.name}
                </a>
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                  {project.status}
                </Badge>
              </div>
              <p className="text-slate-300 text-sm mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-1">
                {project.tech.map((tech, i) => (
                  <Badge key={i} className="text-xs bg-slate-700/50 text-slate-300 border-slate-600/50">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-200">
          <ExternalLink className="w-4 h-4 mr-2" />
          查看更多项目
        </Button>
      </div>
    </CardContent>
  )
}