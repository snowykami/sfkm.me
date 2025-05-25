import type React from "react"
// import LiteyukiLabSvg from "./public/liteyuki-lab.svg"
import { useState, useRef, useCallback, useEffect } from "react"

export default function DraggableWindow({
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