"use client"

import type React from "react"
// import LiteyukiLabSvg from "./public/liteyuki-lab.svg"
import { useState, useEffect } from "react"
import { TopMenuBar } from "./components/menu-bar/top-menu-bar"

// base components
import DraggableWindow from "./components/windows/DraggableWindow"
import MobileSlider from "./components/windows/MobileSlider"
// components
import ProfileContent from "./components/windows/Profile"
import ProjectsContent from "./components/windows/Projects"
import SkillsContent from "./components/windows/Skills"
import ContactsContent from "./components/windows/Contacts"
import Dock from "./components/windows/Dock"

// float button
import { MobileLangFloatButton } from "@/components/widgets/MobileLangFloatButton"
import { MobileThemeFloatButton } from "@/components/widgets/ThemeFloatButton"


import { useTranslation } from "react-i18next"



const ID_TO_HASH = {
  profile: "#profile",
  projects: "#projects",
  skills: "#skills",
  contact: "#contact",
}
const HASH_TO_ID = {
  "#profile": "profile",
  "#projects": "projects",
  "#skills": "skills",
  "#contact": "contact",
}

// 智能窗口布局计算函数
function calculateOptimalLayout(
  windowCount: number,
  screenWidth: number,
  screenHeight: number,
  forceRows?: number
) {
  const MIN_WINDOW_WIDTH = 220 // 你可以根据实际体验调整
  const MAX_WINDOW_WIDTH = 384
  let WINDOW_WIDTH = MAX_WINDOW_WIDTH
  let WINDOW_HEIGHT = 500
  const MIN_MARGIN = 30
  const DOCK_HEIGHT = 80
  const MENU_BAR_HEIGHT = 28

  const availableWidth = screenWidth - MIN_MARGIN * 2
  const availableHeight = screenHeight - MIN_MARGIN * 2 - DOCK_HEIGHT - MENU_BAR_HEIGHT

  let rows: number
  let actualWindowsPerRow: number

  if (forceRows) {
    rows = forceRows
    actualWindowsPerRow = Math.ceil(windowCount / rows)
  } else {
    const maxWindowsPerRow = Math.floor(availableWidth / (MIN_WINDOW_WIDTH + MIN_MARGIN))
    actualWindowsPerRow = Math.min(maxWindowsPerRow, windowCount)
    rows = Math.ceil(windowCount / actualWindowsPerRow)
  }

  // 重新计算窗口宽度，保证不会重叠
  WINDOW_WIDTH = Math.min(
    MAX_WINDOW_WIDTH,
    Math.max(
      MIN_WINDOW_WIDTH,
      Math.floor((availableWidth - actualWindowsPerRow * MIN_MARGIN) / actualWindowsPerRow)
    )
  )

  // 动态调整窗口高度
  if (rows > 1) {
    WINDOW_HEIGHT = Math.max(
      200,
      Math.floor((availableHeight - (rows + 1) * MIN_MARGIN) / rows)
    )
  }

  const totalWindowWidth = actualWindowsPerRow * WINDOW_WIDTH
  const totalMarginWidth = availableWidth - totalWindowWidth
  const horizontalSpacing = totalMarginWidth / (actualWindowsPerRow + 1)

  const totalWindowHeight = rows * WINDOW_HEIGHT
  const totalMarginHeight = availableHeight - totalWindowHeight
  const verticalSpacing = Math.max(MIN_MARGIN, totalMarginHeight / (rows + 1))

  const positions = []

  for (let i = 0; i < windowCount; i++) {
    const row = Math.floor(i / actualWindowsPerRow)
    const col = i % actualWindowsPerRow

    const isLastRow = row === rows - 1
    const windowsInThisRow = isLastRow ? windowCount - row * actualWindowsPerRow : actualWindowsPerRow
    const rowOffset = isLastRow
      ? ((actualWindowsPerRow - windowsInThisRow) * (WINDOW_WIDTH + horizontalSpacing)) / 2
      : 0

    const x = horizontalSpacing + col * (WINDOW_WIDTH + horizontalSpacing) + rowOffset
    const y = MENU_BAR_HEIGHT + verticalSpacing + row * (WINDOW_HEIGHT + verticalSpacing)

    positions.push({
      x: Math.round(x),
      y: Math.round(y),
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
    })
  }

  return positions
}
export default function Component() {
  const { t } = useTranslation()
  const initialHeight = 500 // 初始高度
  const initialWidth = 384 // 初始宽度
  const [windows, setWindows] = useState([
    {
      id: "profile",
      title: "profile.title",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      isClosing: false,
      isMinimizing: false,
      x: 50,
      y: 50,
      z: 1000,
      height: initialHeight, // 初始高度
      width: initialWidth, // 初始宽度
    },
    {
      id: "projects",
      title: "projects.title",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      isClosing: false,
      isMinimizing: false,
      x: 450,
      y: 50,
      z: 999,
      height: initialHeight, // 初始高度
      width: initialWidth, // 初始宽度
    },
    {
      id: "skills",
      title: "skills.title",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      isClosing: false,
      isMinimizing: false,
      x: 50,
      y: 350,
      z: 998,
      height: initialHeight, // 初始高度
      width: initialWidth, // 初始宽度
    },
    {
      id: "contact",
      title: "contacts.title",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      isClosing: false,
      isMinimizing: false,
      x: 450,
      y: 350,
      z: 997,
      height: initialHeight, // 初始高度
      width: initialWidth, // 初始宽度
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
      if (!mobile && !isLayoutCalculated) {
        // 判断宽高比
        const ratio = window.innerWidth / window.innerHeight
        const forceRows = ratio < 1.4 ? 2 : 1 // 竖屏或接近正方形用双行，否则单行
        const positions = calculateOptimalLayout(
          windows.length,
          window.innerWidth,
          window.innerHeight,
          forceRows
        )
        setWindows((prev) =>
          prev.map((window, index) => ({
            ...window,
            x: positions[index]?.x || window.x,
            y: positions[index]?.y || window.y,
            height: positions[index]?.height || window.height,
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
            height: positions[index]?.height || window.height,
          })),
        )
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isLayoutCalculated, isMobile, windows.length])

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isClosing: true } : w)))
    setTimeout(() => {
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isVisible: false, isClosing: false } : w)))
      // 清空 hash，防止 handleHashChange 重新打开
      if (window.location.hash === ID_TO_HASH[id as keyof typeof ID_TO_HASH]) {
        window.location.hash = ""
      }
    }, 300)
  }

  const openWindow = (id: string) => {
    // 计算当前所有窗口的最大 z
    const maxZ = Math.max(...windows.map((w) => w.z))
    const newZ = maxZ + 1
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, isVisible: true, isMinimized: false, isClosing: false, isMinimizing: false, z: newZ }
          : w,
      ),
    )
    window.location.hash = ID_TO_HASH[id as keyof typeof ID_TO_HASH] || ""
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
    window.location.hash = ID_TO_HASH[id as keyof typeof ID_TO_HASH] || ""
  }

  const focusWindow = (id: string) => {
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.z))
      const newZ = maxZ + 1
      return prev.map((w) => (w.id === id ? { ...w, z: newZ } : w))
    })
  }

  const restoreWindow = (id: string) => {
    const maxZ = Math.max(...windows.map((w) => w.z))
    const newZ = maxZ + 1
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
        return <ContactsContent />
      default:
        return null
    }
  }

  // 移动端处理 - 修复索引计算
  const handleMobileWindowSelect = (windowId: string) => {
    const allWindowIndex = windows.findIndex((w) => w.id === windowId)
    if (allWindowIndex !== -1) {
      setMobileCurrentIndex(allWindowIndex)
      window.location.hash = ID_TO_HASH[windowId as keyof typeof ID_TO_HASH] || ""
    }
  }

  // 获取所有窗口（不只是可见的）用于移动端滑动
  const allWindows = windows
  // 窗口内容获取函数
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      const id = HASH_TO_ID[hash as keyof typeof HASH_TO_ID]
      if (!id) return

      if (isMobile) {
        const idx = windows.findIndex((w) => w.id === id)
        if (idx !== -1) setMobileCurrentIndex(idx)
      } else {
        setWindows((prev) =>
          prev.map((w) => {
            if (w.id === id) {
              // 只有窗口原本不可见时才最大化
              if (!w.isVisible) {
                return { ...w, isVisible: true, isMinimized: false, isMaximized: true }
              }
              // 如果窗口已可见，保持原状态
              return { ...w, isVisible: true, isMinimized: false }
            } else {
              return { ...w, isMaximized: false }
            }
          })
        )
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    handleHashChange()
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [isMobile, windows])

  const maximizedWindow = windows.find(w => w.isVisible && w.isMaximized)
  // 如果没有最大化窗口，找z值最大的可见且未最小化窗口
  const topWindow = !maximizedWindow
    ? windows
      .filter(w => w.isVisible && !w.isMinimized)
      .sort((a, b) => b.z - a.z)[0]
    : null


  const currentTitle = t(maximizedWindow?.title || topWindow?.title || "Snowykami")
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
      style={{
        backgroundImage: "url('https://cdn.liteyuki.org/blog/background.png')",
      }}
    >
      {/* 顶部菜单栏 */}
      <TopMenuBar title={currentTitle} />

      {/* 浮动按钮 */}
      <MobileLangFloatButton />
      <MobileThemeFloatButton />


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
            initialHeight={window.height}
            initialWidth={window.width}
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
      <Dock
        windows={windows}
        isMobile={isMobile}
        mobileCurrentIndex={mobileCurrentIndex}
        handleMobileWindowSelect={handleMobileWindowSelect}
        focusWindow={focusWindow}
        restoreWindow={restoreWindow}
        openWindow={openWindow}
      />
      {/* 添加自定义动画样式 */}

    </div>
  )
}