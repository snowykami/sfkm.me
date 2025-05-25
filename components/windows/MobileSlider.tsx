
import { ChevronLeft, ChevronRight } from "lucide-react"
import React, { useState, useRef } from "react"
// 移动端滑动组件
interface WindowItem {
  id: string
  title: string
  isVisible: boolean
  isMinimized: boolean
  // 你可以根据实际需要补充其它字段
}

export default function MobileSlider({
  windows,
  currentIndex,
  onIndexChange,
  getWindowContent,
}: {
  windows: WindowItem[]
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
        {windows.map((window, ) => (
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