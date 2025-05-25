import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award } from "lucide-react"
import { Progress } from "../ui/progress"
import { t } from "i18next"

export default function SkillsContent() {
  const skills = [
    { name: "Python", level: 90, category: "backend" },
    { name: "Go", level: 80, category: "backend" },
    { name: "TypeScript", level: 85, category: "frontend" },
    { name: "Vue.js", level: 80, category: "frontend" },
    { name: "FastAPI", level: 85, category: "backend" },
    { name: "Docker", level: 80, category: "devops" },
    { name: "Kubernetes", level: 50, category: "devops" },
    { name: "Linux", level: 80, category: "database" },
    { name: "PostgreSQL", level: 70, category: "database" },
    { name: "Redis", level: 75, category: "database" },
  ]

  return (
    <CardContent className="p-6 transition-colors">
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Award className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t("skills.title")}</h2>
        </div>

        {skills.map((skill, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 dark:text-slate-200 font-medium">{skill.name}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600">
                  {t("skills."+skill.category)}
                </Badge>
                <span className="text-slate-500 dark:text-slate-400 text-sm">{skill.level}%</span>
              </div>
            </div>
            <Progress value={skill.level} className="h-2 bg-slate-200 dark:bg-slate-700" />
          </div>
        ))}

        <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
          <h3 className="text-slate-700 dark:text-slate-200 font-medium mb-2">{t("skills.learning")}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30">Rust</Badge>
            <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30">Kubernetes</Badge>
            <Badge className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30">Machine Learning</Badge>
          </div>
        </div>
      </div>
    </CardContent>
  )
}