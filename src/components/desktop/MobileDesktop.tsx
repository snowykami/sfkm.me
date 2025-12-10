'use client'
import { t } from 'i18next'
import { ChevronLeft, ChevronRight, Home, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import config from '@/config'
import { useApps } from '@/contexts/AppContext'
import { useDevice } from '@/contexts/DeviceContext'
import MobileWindow from '../windows/MobileWindow'

export default function MobileDesktop() {
  const { apps } = useApps()
  const { isMobile, mode } = useDevice()
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isOpening, setIsOpening] = useState(false) // 控制桌面图标动画
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const [windowAnim, setWindowAnim] = useState<'in' | 'out' | null>(null)
  const [background, setBackground] = React.useState<string | undefined>()
  const [, setDragOffset] = useState(0)
  const [, setIsDragging] = useState(false)

  // 动态背景
  useEffect(() => {
    let mounted = true
    Promise.resolve(config.background?.({ isMobile, mode })).then((bg) => {
      if (mounted)
        setBackground(bg as string)
    })
    return () => {
      mounted = false
    }
  }, [isMobile, mode])

  // 页面加载时根据 hash 自动打开
  useEffect(() => {
    if (!isMobile)
      return

    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '')
      let idx = -1
      if (hash === 'home') {
        setCurrentIndex(null)
        setWindowAnim(null)
        return
      }
      if (hash) {
        idx = apps.findIndex(app => app.id === hash)
      }
      if (idx >= 0) {
        setCurrentIndex(idx)
        setWindowAnim('in')
      }
      else {
        window.location.hash = '#profile'
      }
    }

    // 初始执行一次
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [apps, isMobile])

  // 进入窗口时自动淡入
  useEffect(() => {
    if (currentIndex !== null)
      setWindowAnim('in')
  }, [currentIndex])

  if (!isMobile)
    return null

  // 滑动手势
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    setTouchEnd(e.targetTouches[0].clientX)
    setIsDragging(true)
    setDragOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.targetTouches[0].clientX
    setTouchEnd(currentX)
    setDragOffset(currentX - touchStart)
  }

  const handleTouchEnd = () => {
    if (currentIndex === null)
      return
    const distance = touchEnd - touchStart
    const threshold = 60 // 滑动阈值
    if (distance > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
    else if (distance < -threshold && currentIndex < apps.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    setIsDragging(false)
    setDragOffset(0)
    setTouchStart(0)
    setTouchEnd(0)
  }

  // 桌面图标点击
  const handleAppClick = (idx: number) => {
    setIsOpening(true)
    setTimeout(() => {
      setWindowAnim('in')
      setCurrentIndex(idx)
      window.location.hash = apps[idx].id
      setIsOpening(false)
    }, 300) // 图标动画时长
  }

  // 上/下切换
  const goToPrevious = () => {
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      window.location.hash = apps[currentIndex - 1].id
    }
  }
  const goToNext = () => {
    if (currentIndex !== null && currentIndex < apps.length - 1) {
      setCurrentIndex(currentIndex + 1)
      window.location.hash = apps[currentIndex + 1].id
    }
  }

  // 滑动百分比
  const slidePercentage
    = currentIndex === null ? 0 : (100 / apps.length) * currentIndex

  // 关闭按钮
  const handleClose = () => {
    setWindowAnim('out')
    setTimeout(() => {
      setCurrentIndex(null)
      window.location.hash = '#home' // 这里改成 #home
    }, 300) // 动画时长
  }

  // 桌面视图部分
  if (currentIndex === null) {
    return (
      <div
        className="fixed inset-0 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md z-40 px-4 pt-0 transition-all duration-300"
        style={{
          backgroundImage: background,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          <div className="flex flex-wrap gap-4 mt-8 justify-center">
            {apps.map((app, idx) => (
              <div key={app.id} className="flex flex-col items-center w-16">
                <button
                  className={`w-15 h-15 rounded-xl flex items-center justify-center bg-white/90 dark:bg-slate-800/90 shadow transition-transform duration-300 ${isOpening ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}
                  onClick={() => handleAppClick(idx)}
                >
                  {app.icon}
                </button>
                <span
                  className="relative block w-16 text-xs mt-2 text-white dark:text-slate-200 drop-shadow-lg truncate text-center"
                  style={{ lineHeight: '1.2' }}
                  title={t(app.label) || app.id}
                >
                  <span
                    className="absolute inset-0 left-0 right-0 bottom-0 w-full h-full bg-black/50 rounded px-1 pointer-events-none"
                    aria-hidden="true"
                  >
                  </span>
                  <span className="relative z-10">
                    {t(app.label) || app.id}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 窗口视图部分（加动画）
  return (
    <div
      className={`
                fixed inset-0 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md z-40 flex flex-col
                transition-all duration-300
                ${windowAnim === 'in' ? 'opacity-100 scale-100 pointer-events-auto' : ''}
                ${windowAnim === 'out' ? 'opacity-0 scale-95 pointer-events-none' : ''}
            `}
      style={{
        backgroundImage: background,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 顶部标题栏 */}
      <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-300/60 dark:border-slate-700/50 px-4 py-2 flex items-center justify-between">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800 dark:text-slate-300" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-slate-800 dark:text-slate-300 text-sm font-bold">
            {t(apps[currentIndex]?.label) || apps[currentIndex]?.id}
          </span>
        </div>
        <button
          onClick={goToNext}
          disabled={currentIndex === apps.length - 1}
          className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/50 dark:hover:bg-slate-600/50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-800 dark:text-slate-300" />
        </button>
      </div>

      {/* 滑动窗口区域 */}
      <div
        className="flex-1 flex transition-transform duration-300 ease-out pb-0 overflow-y-auto"
        style={{
          transform: `translateX(-${slidePercentage}%)`,
          width: `${apps.length * 100}%`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {apps.map((app, idx) => (
          <div
            key={app.id}
            className="h-full flex-shrink-0 relative" // 这里加 relative
            style={{ width: `${100 / apps.length}%` }}
          >
            <MobileWindow
              id={app.id}
              visible={currentIndex === idx}
              scrollable={true}
            >
              <app.entry windowId={app.id} />
            </MobileWindow>
          </div>
        ))}
      </div>
      {/* 页面指示器，绝对定位在窗口底部 */}
      <div className="absolute left-1/2 bottom-1 transform -translate-x-1/2 z-50 flex space-x-2">
        {/* 桌面按钮 */}
        <button
          onClick={() => {
            setCurrentIndex(null)
            window.location.hash = '#home'
          }}
          className={`
            w-2 h-2 flex items-center justify-center rounded-full transition-colors
            ${
    currentIndex === null
      ? 'bg-slate-800 dark:bg-slate-300 text-white dark:text-slate-800'
      : 'bg-slate-400 dark:bg-slate-600 text-white'
    }
            focus:outline-none
        `}
          style={{ cursor: 'pointer' }}
          aria-label="回到桌面"
        >
          <Home className="w-1.5 h-1.5" />
        </button>
        {/* 其它页面指示器 */}
        {apps.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              window.location.hash = apps[index].id
            }}
            className={`
                w-2 h-2 rounded-full transition-colors
                ${
          index === currentIndex
            ? 'bg-slate-800 dark:bg-slate-300'
            : 'bg-slate-400 dark:bg-slate-600'
          }
                focus:outline-none
            `}
            style={{ cursor: 'pointer' }}
            aria-label={`切换到第${index + 1}页`}
          />
        ))}
      </div>

      {/* 统一关闭按钮 */}
      <div
        className="fixed bottom-1 left-19/20 z-[9999]"
        style={{ transform: 'translateX(-50%)' }}
      >
        <button
          className={`
                        ${
    mode === 'dark'
      ? 'bg-white/80 text-slate-700 hover:bg-gray-100/90'
      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700/90'
    }
                        backdrop-blur-md 
                        rounded-full w-8 h-8 
                        flex items-center justify-center 
                        shadow-lg
                        transition-colors duration-200
                        active:scale-95
                    `}
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
