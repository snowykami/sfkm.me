import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BaseWidget from './BaseWidget'

export function DatetimeWidget() {
  const [time, setTime] = useState<Date | null>(null)
  const { i18n } = useTranslation()

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const localeMap: Record<string, string> = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
  }
  const locale = localeMap[i18n.language] || 'zh-CN'

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    })
  }

  if (!time)
    return null

  return (
    <BaseWidget
      title={`${formatDate(time)} ${formatTime(time)}`}
      className="whitespace-nowrap"
    >
      <span className="text-slate-700 dark:text-slate-300 text-sm leading-none mt-0.5">
        {formatDate(time)}
      </span>
      <span className="mx-1"></span>
      <span className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-none">
        {formatTime(time)}
      </span>
    </BaseWidget>
  )
}
