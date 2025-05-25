import type React from "react"
import { useState, useRef, useEffect } from "react"
import { WindowProps } from "./types"
import { Rnd } from "react-rnd"
import { t } from "i18next"



export default function DraggableWindow({
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
  showClose = true,
  showMinimize = true,
  showMaximize = true,
}: WindowProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY })
  const [size, setSize] = useState({ width: 384, height: 500 })
  const [isDragging, setIsDragging] = useState(false)
  const [savedPosition, setSavedPosition] = useState({ x: initialX, y: initialY })
  const [isMobile, setIsMobile] = useState(false)
  const windowRef = useRef<HTMLDivElement>(null)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // 更新位置和尺寸当初始值改变时
  useEffect(() => {
    setPosition({ x: initialX, y: initialY })
    setSavedPosition({ x: initialX, y: initialY })
  }, [initialX, initialY])
  useEffect(() => {
    setSize({ width: 384, height: 600 })
  }, [isMaximized, isMobile])

  // 最大化/还原时位置处理
  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isMaximized) {
      setSavedPosition(position)
    } else {
      setPosition(savedPosition)
    }
    onMaximize()
  }

  const handleWindowClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest(".window-controls")) {
      onFocus()
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMinimize()
  }

  if (!isVisible || isMinimized) return null

  // 最大化或移动端样式
  const maximizedStyle = isMaximized
    ? {
      left: 0,
      top: 35, // 顶栏高度改为60px
      width: window.innerWidth || 800, // 默认宽度
      height: (window.innerHeight - 35) || 600, // 高度减去顶栏高度
      borderRadius: 0,
    }
    : isMobile
      ? {
        left: 0,
        top: 0,
        width: window.innerWidth || 800,
        height: window.innerHeight || 600,
        borderRadius: 0,
      }
      : {}

  return (
    <Rnd
      size={
        isMaximized || isMobile
          ? {
            width: maximizedStyle.width ?? 800,
            height: maximizedStyle.height ?? 600,
          }
          : size
      }
      position={
        isMaximized || isMobile
          ? {
            x: maximizedStyle.left ?? 0,
            y: maximizedStyle.top ?? 0,
          }
          : position
      }
      minWidth={320}
      minHeight={200}
      bounds="window"
      disableDragging={isMaximized || isMobile}
      enableResizing={!isMaximized && !isMobile}
      style={{
        zIndex: initialZ + 1000,
        borderRadius: (isMaximized || isMobile) ? 0 : 16,
        overflow: "hidden",
        position: "fixed",
        boxShadow: isDragging
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          : "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
        transition: isDragging
          ? "none"
          : "transform 0.2s ease, box-shadow 0.2s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease, left 0.3s ease, top 0.3s ease",
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        willChange: isDragging ? "transform" : "auto",
      }}
      onDragStart={() => {
        setIsDragging(true)
        onFocus() // 拖拽时置顶
      }}
      onDragStop={(_, d) => {
        setIsDragging(false)
        setPosition({ x: d.x, y: d.y })
      }}
      onResizeStop={(_, __, ref, ___, pos) => {
        setSize({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        })
        setPosition(pos)
      }}
      dragHandleClassName="window-drag-handle"
    >
      <div
        ref={windowRef}
        // 滑条
        className={`
    bg-slate-100/90 dark:bg-slate-800/90
    backdrop-blur-md
    shadow-2xl
    border border-slate-300/60 dark:border-slate-700/30
    overflow-hidden
    ${isClosing ? "animate-window-close" : isMinimizing ? "animate-window-minimize" : "animate-window-open"}
  `}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={handleWindowClick}
      >
        {/* 标题栏 */}
        <div
          className={`
      window-drag-handle
      bg-slate-300/80 dark:bg-slate-800/80
      backdrop-blur-sm
      border-b border-slate-300/60 dark:border-slate-800/50
      px-4 py-3 flex items-center select-none relative
      ${isMaximized || isMobile
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing"
            }
    `}
        >
          <div className="window-controls flex items-center space-x-2">
            {/* 关闭按钮 */}
            {showClose && (
              <div
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center group"
                onClick={handleClose}
              >
                <div className="w-1.5 h-0.5 bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rotate-45 absolute"></div>
                <div className="w-1.5 h-0.5 bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -rotate-45 absolute"></div>
              </div>
            )}
            {/* 最小化按钮 */}
            {showMinimize && !isMobile && (
              <div
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 flex items-center justify-center group"
                onClick={handleMinimize}
              >
                <div className="w-1.5 h-0.5 bg-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            )}
            {/* 最大化按钮 */}
            {showMaximize && !isMobile && (
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
            )}
          </div>
          {/* 绝对居中标题 */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-max pointer-events-none z-0">
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t(title)}</span>
          </div>

          <div className="w-[60px]" />
        </div>

        {/* 内容区域 */}
        <div
          className="overflow-y-auto custom-scrollbar flex-1 text-slate-800 dark:text-slate-200"
          style={{
            transition: isDragging ? "none" : "height 0.3s ease",
          }}
          onClick={handleWindowClick}
        >
          {children}
        </div>
      </div>
    </Rnd>
  )
}