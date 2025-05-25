"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Github,

  Mail,
  MapPin,
  Twitter,
  Code,
  User,
  FolderOpen,
  MessageCircle,
  ExternalLink,
  Calendar,
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  MessageCircleMore,
  Tv,
  HeadphonesIcon
} from "lucide-react"
// import LiteyukiLabSvg from "./public/liteyuki-lab.svg"
import { useState, useRef, useCallback, useEffect } from "react"
import { TopMenuBar } from "./components/menu-bar/top-menu-bar"

interface WindowProps {
  id: string
  title: string
  initialX: number
  initialY: number
  initialZ: number
  isVisible: boolean
  isMinimized: boolean
  isMaximized: boolean
  isClosing: boolean
  isMinimizing: boolean
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onFocus: () => void
  children: React.ReactNode
}

function DraggableWindow({
  id,
  title,
  initialX,
  initialY,
  initialZ,
  isVisible,
  isMinimized,
  isMaximized,
  isClosing,
  isMinimizing,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children,
}: WindowProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [zIndex, setZIndex] = useState(initialZ)
  const [isDragging, setIsDragging] = useState(false)
  const [savedPosition, setSavedPosition] = useState({ x: initialX, y: initialY })
  const [isMobile, setIsMobile] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const currentPositionRef = useRef({ x: initialX, y: initialY })
  const animationFrameRef = useRef<number | null>(null)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // 更新位置当初始位置改变时
  useEffect(() => {
    setPosition({ x: initialX, y: initialY })
    setSavedPosition({ x: initialX, y: initialY })
    currentPositionRef.current = { x: initialX, y: initialY }
  }, [initialX, initialY])

  // 更新 z-index 当窗口被聚焦时
  useEffect(() => {
    setZIndex(initialZ)
  }, [initialZ])

  const handleWindowClick = (e: React.MouseEvent) => {
    // 不管点击的是什么元素，只要不是关闭按钮就聚焦窗口
    if (!(e.target as HTMLElement).closest(".window-controls")) {
      onFocus()
    }
  }

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!windowRef.current || isMaximized || isMobile) return

      const newX = clientX - dragOffsetRef.current.x
      const newY = clientY - dragOffsetRef.current.y

      // 边界限制 - 考虑顶部菜单栏高度
      const topOffset = isMobile ? 0 : 28 // 菜单栏高度
      const maxX = window.innerWidth - 400
      const maxY = window.innerHeight - 600

      const constrainedX = Math.max(0, Math.min(newX, maxX))
      const constrainedY = Math.max(topOffset, Math.min(newY, maxY))

      // 更新当前位置引用
      currentPositionRef.current = { x: constrainedX, y: constrainedY }

      // 直接更新 DOM 样式，避免 React 重新渲染
      windowRef.current.style.left = `${constrainedX}px`
      windowRef.current.style.top = `${constrainedY}px`
    },
    [isMaximized, isMobile],
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".window-controls") || isMaximized || isMobile) {
      return
    }

    e.preventDefault()
    setIsDragging(true)

    // 聚焦窗口并置顶
    onFocus()

    // 计算鼠标相对于窗口的偏移
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }

    // 初始化当前位置
    currentPositionRef.current = { x: position.x, y: position.y }

    // 禁用过渡动画
    if (windowRef.current) {
      windowRef.current.style.transition = "none"
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        updatePosition(moveEvent.clientX, moveEvent.clientY)
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)

      // 恢复过渡动画
      if (windowRef.current) {
        windowRef.current.style.transition = "transform 0.2s ease, box-shadow 0.2s ease"
      }

      // 取消动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // 更新 React 状态为最终位置
      const finalPosition = currentPositionRef.current
      setPosition(finalPosition)
      setSavedPosition(finalPosition)

      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMinimize()
  }

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isMaximized) {
      setSavedPosition(position)
    } else {
      setPosition(savedPosition)
      // 确保DOM位置也更新
      if (windowRef.current) {
        windowRef.current.style.left = `${savedPosition.x}px`
        windowRef.current.style.top = `${savedPosition.y}px`
      }
    }
    onMaximize()
  }

  if (!isVisible || isMinimized) return null

  // 移动端样式
  const mobileStyle = isMobile
    ? {
      left: "0px",
      top: "0px",
      width: "100vw",
      height: "100vh",
      borderRadius: "0px",
    }
    : null

  const windowStyle = isMaximized
    ? {
      left: "0px",
      top: "28px", // 为菜单栏留出空间
      width: "100vw",
      height: "calc(100vh - 28px)",
      borderRadius: "0px",
    }
    : mobileStyle || {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: "384px",
      height: "auto",
      borderRadius: "16px",
    }

  return (
    <div
      ref={windowRef}
      className={`fixed bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-700/30 overflow-hidden ${isClosing ? "animate-window-close" : isMinimizing ? "animate-window-minimize" : "animate-window-open"
        }`}
      style={{
        ...windowStyle,
        zIndex: initialZ + 1000, // 添加基础偏移，确保在其他元素之上
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        transition: isDragging
          ? "none"
          : "transform 0.2s ease, box-shadow 0.2s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease, left 0.3s ease, top 0.3s ease",
        boxShadow: isDragging ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        willChange: isDragging ? "transform" : "auto",
      }}
      onClick={handleWindowClick}
    >
      {/* 标题栏 */}
      <div
        className={`bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center select-none ${isMaximized || isMobile ? "cursor-default" : "cursor-grab active:cursor-grabbing"
          }`}
        onMouseDown={handleMouseDown}
      >
        <div className="window-controls flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center group"
            onClick={handleClose}
          >
            <div className="w-1.5 h-0.5 bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rotate-45 absolute"></div>
            <div className="w-1.5 h-0.5 bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -rotate-45 absolute"></div>
          </div>
          {!isMobile && (
            <>
              <div
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center group"
                onClick={handleMinimize}
              >
                <div className="w-1.5 h-0.5 bg-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
              <div
                className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center group"
                onClick={handleMaximize}
              >
                {isMaximized ? (
                  <div className="relative">
                    <div className="w-1 h-1 border border-green-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="w-1 h-1 border border-green-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-0.5 -left-0.5"></div>
                  </div>
                ) : (
                  <div className="w-1.5 h-1.5 border border-green-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 text-center pointer-events-none">
          <span className="text-slate-300 text-sm font-medium">{title}</span>
        </div>

        <div className="w-[60px]" />
      </div>

      {/* 内容区域 */}
      <div
        className={`overflow-y-auto ${isMaximized || isMobile ? "h-[calc(100vh-88px)]" : "max-h-[500px]"}`}
        style={{
          transition: isDragging ? "none" : "height 0.3s ease",
        }}
        onClick={handleWindowClick}
      >
        {children}
      </div>
    </div>
  )
}

// 移动端滑动容器组件
function MobileSlider({
  windows,
  currentIndex,
  onIndexChange,
  getWindowContent,
}: {
  windows: any[]
  currentIndex: number
  onIndexChange: (index: number) => void
  getWindowContent: (id: string) => React.ReactNode
}) {
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentIndex < windows.length - 1) {
      onIndexChange(currentIndex + 1)
    }
    if (isRightSwipe && currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < windows.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }

  // 计算正确的滑动距离
  const slidePercentage = (100 / windows.length) * currentIndex

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-40">
      {/* 标题栏 */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-600/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-300" />
        </button>

        <div className="flex-1 text-center">
          <span className="text-slate-300 text-sm font-medium">{windows[currentIndex]?.title}</span>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === windows.length - 1}
          className="p-2 rounded-lg bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-600/50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* 滑动容器 */}
      <div
        ref={sliderRef}
        className="flex h-[calc(100vh-60px)] transition-transform duration-300 ease-out pb-24"
        style={{
          transform: `translateX(-${slidePercentage}%)`,
          width: `${windows.length * 100}%`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {windows.map((window, index) => (
          <div
            key={window.id}
            className="h-full overflow-y-auto flex-shrink-0"
            style={{ width: `${100 / windows.length}%` }}
          >
            {getWindowContent(window.id)}
          </div>
        ))}
      </div>

      {/* 页面指示器 */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {windows.map((_, index) => (
          <button
            key={index}
            onClick={() => onIndexChange(index)}
            className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-slate-300" : "bg-slate-600"
              }`}
          />
        ))}
      </div>
    </div>
  )
}

// 智能窗口布局计算函数
function calculateOptimalLayout(windowCount: number, screenWidth: number, screenHeight: number) {
  const WINDOW_WIDTH = 384
  const WINDOW_HEIGHT = 500 // 估算窗口高度
  const MIN_MARGIN = 30 // 最小边距
  const DOCK_HEIGHT = 80 // Dock 高度
  const MENU_BAR_HEIGHT = 28 // 菜单栏高度

  // 可用空间
  const availableWidth = screenWidth - MIN_MARGIN * 2
  const availableHeight = screenHeight - MIN_MARGIN * 2 - DOCK_HEIGHT - MENU_BAR_HEIGHT

  // 计算每行可以放几个窗口
  const maxWindowsPerRow = Math.floor(availableWidth / (WINDOW_WIDTH + MIN_MARGIN))
  const actualWindowsPerRow = Math.min(maxWindowsPerRow, windowCount)

  // 计算行数
  const rows = Math.ceil(windowCount / actualWindowsPerRow)

  // 计算实际间距（居中对齐）
  const totalWindowWidth = actualWindowsPerRow * WINDOW_WIDTH
  const totalMarginWidth = availableWidth - totalWindowWidth
  const horizontalSpacing = totalMarginWidth / (actualWindowsPerRow + 1)

  // 计算垂直间距
  const totalWindowHeight = rows * WINDOW_HEIGHT
  const totalMarginHeight = availableHeight - totalWindowHeight
  const verticalSpacing = Math.max(MIN_MARGIN, totalMarginHeight / (rows + 1))

  const positions = []

  for (let i = 0; i < windowCount; i++) {
    const row = Math.floor(i / actualWindowsPerRow)
    const col = i % actualWindowsPerRow

    // 如果是最后一行且窗口数量不足，居中对齐
    const isLastRow = row === rows - 1
    const windowsInThisRow = isLastRow ? windowCount - row * actualWindowsPerRow : actualWindowsPerRow
    const rowOffset = isLastRow
      ? ((actualWindowsPerRow - windowsInThisRow) * (WINDOW_WIDTH + horizontalSpacing)) / 2
      : 0

    const x = horizontalSpacing + col * (WINDOW_WIDTH + horizontalSpacing) + rowOffset
    const y = MENU_BAR_HEIGHT + verticalSpacing + row * (WINDOW_HEIGHT + verticalSpacing)

    positions.push({ x: Math.round(x), y: Math.round(y) })
  }

  return positions
}

export default function Component() {
  const [windows, setWindows] = useState([
    {
      id: "profile",
      title: "个人名片",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      isClosing: false,
      isMinimizing: false,
      x: 50,
      y: 50,
      z: 1000,
    },
    {
      id: "projects",
      title: "项目展示",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      isClosing: false,
      isMinimizing: false,
      x: 450,
      y: 50,
      z: 999,
    },
    {
      id: "skills",
      title: "技能详情",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      isClosing: false,
      isMinimizing: false,
      x: 50,
      y: 350,
      z: 998,
    },
    {
      id: "contact",
      title: "联系方式",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      isClosing: false,
      isMinimizing: false,
      x: 450,
      y: 350,
      z: 997,
    },
  ])

  const [isMobile, setIsMobile] = useState(false)
  const [mobileCurrentIndex, setMobileCurrentIndex] = useState(0)
  const [isLayoutCalculated, setIsLayoutCalculated] = useState(false)

  // 检测移动端和计算布局
  useEffect(() => {
    const checkMobileAndCalculateLayout = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // 只在桌面端计算布局
      if (!mobile && !isLayoutCalculated) {
        const positions = calculateOptimalLayout(windows.length, window.innerWidth, window.innerHeight)

        setWindows((prev) =>
          prev.map((window, index) => ({
            ...window,
            x: positions[index]?.x || window.x,
            y: positions[index]?.y || window.y,
          })),
        )

        setIsLayoutCalculated(true)
      }
    }

    // 初始计算
    checkMobileAndCalculateLayout()

    // 监听窗口大小变化
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // 如果从移动端切换到桌面端，重新计算布局
      if (!mobile && isMobile) {
        const positions = calculateOptimalLayout(windows.length, window.innerWidth, window.innerHeight)

        setWindows((prev) =>
          prev.map((window, index) => ({
            ...window,
            x: positions[index]?.x || window.x,
            y: positions[index]?.y || window.y,
          })),
        )
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isLayoutCalculated, isMobile, windows.length])

  const closeWindow = (id: string) => {
    // 先触发关闭动画
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isClosing: true } : w)))

    // 300ms 后真正关闭窗口
    setTimeout(() => {
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isVisible: false, isClosing: false } : w)))
    }, 300)
  }

  const openWindow = (id: string) => {
    const newZ = Date.now()
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isVisible: true, isMinimized: false, isClosing: false, isMinimizing: false, z: newZ } : w,
      ),
    )
  }

  const minimizeWindow = (id: string) => {
    // 先触发最小化动画
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimizing: true } : w)))

    // 400ms 后真正最小化窗口
    setTimeout(() => {
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true, isMinimizing: false } : w)))
    }, 400)
  }

  const maximizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)))
  }

  const focusWindow = (id: string) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.z))
      const newZ = maxZ + 1
      return prev.map((w) => (w.id === id ? { ...w, z: newZ } : w))
    })
  }

  const restoreWindow = (id: string) => {
    const newZ = Date.now()
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: false, z: newZ } : w)))
  }

  const getWindowContent = (id: string) => {
    switch (id) {
      case "profile":
        return <ProfileContent />
      case "projects":
        return <ProjectsContent />
      case "skills":
        return <SkillsContent />
      case "contact":
        return <ContactContent />
      default:
        return null
    }
  }

  // 移动端处理 - 修复索引计算
  const handleMobileWindowSelect = (windowId: string) => {
    // 在所有窗口中找到对应的索引
    const allWindowIndex = windows.findIndex((w) => w.id === windowId)
    if (allWindowIndex !== -1) {
      setMobileCurrentIndex(allWindowIndex)
    }
  }

  // 获取所有窗口（不只是可见的）用于移动端滑动
  const allWindows = windows

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        backgroundImage: "url('https://cdn.liteyuki.org/blog/background.png')",
      }}
    >
      {/* 顶部菜单栏 */}
      <TopMenuBar />

      {/* 深色玻璃板覆盖层 */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-none" />

      {/* 移动端滑动视图 */}
      {isMobile && (
        <MobileSlider
          windows={allWindows}
          currentIndex={mobileCurrentIndex}
          onIndexChange={setMobileCurrentIndex}
          getWindowContent={getWindowContent}
        />
      )}

      {/* 桌面端窗口 */}
      {!isMobile &&
        windows.map((window) => (
          <DraggableWindow
            key={window.id}
            id={window.id}
            title={window.title}
            initialX={window.x}
            initialY={window.y}
            initialZ={window.z}
            isVisible={window.isVisible}
            isMinimized={window.isMinimized}
            isMaximized={window.isMaximized}
            isClosing={window.isClosing}
            isMinimizing={window.isMinimizing}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
            onMaximize={() => maximizeWindow(window.id)}
            onFocus={() => focusWindow(window.id)}
          >
            {getWindowContent(window.id)}
          </DraggableWindow>
        ))}

      {/* Dock */}
      <div
        className={`absolute ${isMobile ? "bottom-2" : "bottom-4"} left-1/2 transform -translate-x-1/2 bg-slate-800/60 backdrop-blur-md rounded-2xl px-4 py-2 border border-slate-600/50 z-50`}
      >
        <div className="flex items-center space-x-3">
          {windows.map((window, index) => (
            <div
              key={window.id}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 relative ${isMobile
                ? index === mobileCurrentIndex
                  ? "bg-slate-600/50 border border-slate-500/50"
                  : "bg-slate-700/30 hover:bg-slate-600/40"
                : window.isVisible && !window.isMinimized
                  ? "bg-slate-600/50 border border-slate-500/50"
                  : "bg-slate-700/30 hover:bg-slate-600/40"
                }`}
              onClick={() => {
                if (isMobile) {
                  handleMobileWindowSelect(window.id)
                } else {
                  if (window.isVisible && !window.isMinimized) {
                    focusWindow(window.id)
                  } else if (window.isMinimized) {
                    restoreWindow(window.id)
                  } else {
                    openWindow(window.id)
                  }
                }
              }}
            >
              {window.id === "profile" && <User className="w-5 h-5 text-slate-300" />}
              {window.id === "projects" && <FolderOpen className="w-5 h-5 text-slate-300" />}
              {window.id === "skills" && <Code className="w-5 h-5 text-slate-300" />}
              {window.id === "contact" && <MessageCircle className="w-5 h-5 text-slate-300" />}

              {/* 最小化指示器 */}
              {!isMobile && window.isMinimized && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
              )}

              {/* 活动指示器 */}
              {!isMobile && window.isVisible && !window.isMinimized && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-slate-300 rounded-full"></div>
              )}

              {/* 移动端当前页指示器 */}
              {isMobile && index === mobileCurrentIndex && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-slate-300 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 添加自定义动画样式 */}
      <style jsx>{`
        @keyframes window-open {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes window-close {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.95) translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: scale(0.7) translateY(-30px);
          }
        }

        @keyframes window-minimize {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 0;
            transform: scale(0.3) translateY(calc(100vh - 100px)) translateX(calc(50vw - 50px));
          }
        }

        .animate-window-open {
          animation: window-open 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-window-close {
          animation: window-close 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .animate-window-minimize {
          animation: window-minimize 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>
    </div>
  )
}

function ProfileContent() {
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
        <p className="text-slate-300 font-medium mb-2">远野千束</p>
        <div className="flex items-center text-slate-400 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span>中国 重庆</span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-slate-300 text-sm leading-relaxed text-center">
          很高兴认识你！
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">标签</h3>
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

function ProjectsContent() {
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

function SkillsContent() {
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

function ContactContent() {
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
