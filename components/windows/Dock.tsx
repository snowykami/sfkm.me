import { User, Award, MessageCircle, PanelsTopLeft, Users } from "lucide-react"

interface WindowItem {
  id: string
  isVisible: boolean
  isMinimized: boolean
  // 根据需要补充其它字段
}

interface DockProps {
  windows: WindowItem[]
  isMobile: boolean
  mobileCurrentIndex: number
  handleMobileWindowSelect: (id: string) => void
  focusWindow: (id: string) => void
  restoreWindow: (id: string) => void
  openWindow: (id: string) => void
}

export default function Dock({
  windows,
  isMobile,
  mobileCurrentIndex,
  handleMobileWindowSelect,
  focusWindow,
  restoreWindow,
  openWindow,
}: DockProps) {
  return (
    <div
      className={`absolute ${
        isMobile ? "bottom-3" : "bottom-6"
      } left-1/2 transform -translate-x-1/2 bg-slate-100/90 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl px-6 py-3 border border-slate-300/50 dark:border-slate-600/50 z-50`}
    >
      <div className="flex items-center space-x-3">
        {windows.map((window, index) => (
          <div
            key={window.id}
            className={`w-14 h-14 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 relative ${
              isMobile
                ? index === mobileCurrentIndex
                  ? "bg-slate-300/50 border border-slate-400/50 dark:bg-slate-600/50 dark:border-slate-500/50"
                  : "bg-slate-300/30 hover:bg-slate-300/40 dark:bg-slate-700/30 dark:hover:bg-slate-600/40"
                : window.isVisible && !window.isMinimized
                ? "bg-slate-300/50 border border-slate-400/50 dark:bg-slate-600/50 dark:border-slate-500/50"
                : "bg-slate-300/30 hover:bg-slate-300/40 dark:bg-slate-700/30 dark:hover:bg-slate-600/40"
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
            {window.id === "profile" && (
              <User className="w-6 h-6 text-slate-800 dark:text-slate-300" />
            )}
            {window.id === "projects" && (
              <PanelsTopLeft className="w-6 h-6 text-slate-800 dark:text-slate-300" />
            )}
            {window.id === "skills" && (
              <Award className="w-6 h-6 text-slate-800 dark:text-slate-300" />
            )}
            {window.id === "contact" && (
              <MessageCircle className="w-6 h-6 text-slate-800 dark:text-slate-300" />
            )}
            {window.id === "friends" && (
              <Users className="w-6 h-6 text-slate-800 dark:text-slate-300" />
            )}

            {/* 如果需要，可以添加更多窗口图标 */}

            {/* 最小化指示器 */}
            {!isMobile && window.isMinimized && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
            )}

            {/* 活动指示器 */}
            {!isMobile && window.isVisible && !window.isMinimized && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-slate-600 dark:bg-slate-300 rounded-full"></div>
            )}

            {/* 移动端当前页指示器 */}
            {isMobile && index === mobileCurrentIndex && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-slate-600 dark:bg-slate-300 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}