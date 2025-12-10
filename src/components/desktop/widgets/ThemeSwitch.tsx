'use client'
import { Moon, Sun } from 'lucide-react'
import { useCallback } from 'react'
import { useDevice } from '@/contexts/DeviceContext'
import BaseWidget from './BaseWidget'

export function ThemeSwitch() {
  const { mode, toggleMode } = useDevice()

  const handleToggle = useCallback(() => {
    toggleMode()
  }, [toggleMode])

  return (
    <BaseWidget
      title={mode === 'dark' ? '切换为浅色模式' : '切换为深色模式'}
      onClick={handleToggle}
      aria-label="切换主题"
    >
      {mode === 'dark'
        ? (
            <Moon className="w-5 h-5 text-slate-400" />
          )
        : (
            <Sun className="w-5 h-5 text-yellow-300" />
          )}
    </BaseWidget>
  )
}
