import { t } from 'i18next'
import { Briefcase, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import config from '@/config'

export default function ProjectsContent() {
  return (
    <CardContent className="p-6 transition-colors">
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Briefcase className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {t('projects.title')}
          </h2>
        </div>
        {config.projects.map((project, index) => (
          <Card
            key={index}
            className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 transition-colors"
          >
            <CardContent className="pt-0 pb-0 px-3">
              <div className="flex items-start justify-between mb-2">
                {/* 项目名称加链接 */}
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-800 dark:text-white hover:underline"
                >
                  {t(project.name)}
                </a>
                <Badge
                  variant="outline"
                  className="text-xs text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                >
                  {t(`projects.status.${project.status}`)}
                </Badge>
              </div>
              <p className="text-slate-950 dark:text-slate-300 text-sm mb-3">
                {t(project.description)}
              </p>
              <div className="flex flex-wrap gap-1">
                {project.tags?.map((tech, i) =>
                  // 如果是字符串，则使用Badge，否则直接显示(默认传来时已经是React节点)
                  typeof tech === 'string'
                    ? (
                        <Badge
                          key={i}
                          className="text-xs bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/50"
                        >
                          {t(tech)}
                        </Badge>
                      )
                    : (
                        <span
                          key={i}
                          className="text-xs bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/50"
                        >
                          {tech}
                        </span>
                      ),
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        <Button className="w-full mt-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors">
          <ExternalLink className="w-4 h-4 mr-2" />
          {t('projects.explore')}
        </Button>
      </div>
    </CardContent>
  )
}
