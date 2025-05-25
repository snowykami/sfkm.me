import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award } from "lucide-react"
import { Progress } from "../ui/progress"

export default function SkillsContent() {
  const skills = [
    { name: "Python", level: 90, category: "后端" },
    { name: "Go", level: 80, category: "后端" },
    { name: "TypeScript", level: 85, category: "前端" },
    { name: "Vue.js", level: 80, category: "前端" },
    { name: "FastAPI", level: 85, category: "后端" },
    { name: "Docker", level: 80, category: "运维" },
    { name: "Kubernetes", level: 50, category: "运维" },
    { name: "Linux", level: 80, category: "运维" },
    { name: "PostgreSQL", level: 70, category: "数据库" },
    { name: "Redis", level: 75, category: "数据库" },
  ]

  return (
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Award className="w-5 h-5 text-slate-400 mr-2" />
          <h2 className="text-lg font-semibold text-white">技能详情</h2>
        </div>

        {skills.map((skill, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-200 font-medium">{skill.name}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                  {skill.category}
                </Badge>
                <span className="text-slate-400 text-sm">{skill.level}%</span>
              </div>
            </div>
            <Progress value={skill.level} className="h-2 bg-slate-700" />
          </div>
        ))}

        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h3 className="text-slate-200 font-medium mb-2">学习中</h3>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Rust</Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Kubernetes</Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Machine Learning</Badge>
          </div>
        </div>
      </div>
    </CardContent>
  )
}