import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, ExternalLink } from "lucide-react"
import { Button } from "../ui/button"
import { t } from "i18next"



export default function ProjectsContent() {
  const projects = [
    {
      name: t("projects.liteyukibot.name"),
      description: t("projects.liteyukibot.description"),
      tech: ["Python", "FastAPI", "WebSocket", "NoneBot2"],
      status: t("projects.status.active"),
      link: "https://bot.liteyuki.org"
    },
    {
      name: t("projects.magipoke.name"),
      description: t("projects.magipoke.description"),
      tech: ["Go", "CloudWeGo", "Kotlin", "Swift", "Objective-C"],
      status: t("projects.status.active"),
      link: "https://app.redrock.team/#/"
    },
    {
      name: t("projects.serverstatus.name"),
      description: t("projects.serverstatus.description"),
      tech: ["Vue.js", "Go", "Tailwind"],
      status: t("projects.status.completed"),
      link: "https://status.liteyuki.org"
    },
    {
      name: t("projects.litedoc.name"),
      description: t("projects.litedoc.description"),
      tech: ["Python", "Markdown", "vitepress"],
      status: t("projects.status.completed"),
      link: "https://github.com/LiteyukiStudio/litedoc"
    },
  ]

  return (
    <CardContent className="p-6 transition-colors">
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Briefcase className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t("projects.title")}</h2>
        </div>

        {projects.map((project, index) => (
          <Card
            key={index}
            className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                {/* 项目名称加链接 */}
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-800 dark:text-white hover:underline"
                >
                  {project.name}
                </a>
                <Badge
                  variant="outline"
                  className="text-xs text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                >
                  {project.status}
                </Badge>
              </div>
              <p className="text-slate-950 dark:text-slate-300 text-sm mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-1">
                {project.tech.map((tech, i) => (
                  <Badge
                    key={i}
                    className="text-xs bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/50"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button className="w-full mt-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors">
          <ExternalLink className="w-4 h-4 mr-2" />
          {t("projects.explore")}
        </Button>
      </div>
    </CardContent>
  )
}