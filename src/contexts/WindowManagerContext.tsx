'use client'

import type {
  ReactNode,
} from 'react'
import type { windowColorScheme } from '@/types/window'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

// 临时窗口定义接口
export interface TempWindowDefinition {
  id: string
  title: string
  content: React.ReactNode | (() => React.ReactNode)
  size?: { width: number, height: number }
  position?: { x: number, y: number }
  colorScheme?: windowColorScheme
  showClose?: boolean
  showMinimize?: boolean
  showMaximize?: boolean
  onClose?: () => void
}

export interface WindowState {
  id: string
  visible: boolean
  zIndex: number
  maximized: boolean
  minimized: boolean
  position: { x: number, y: number }
  size: { width: number, height: number }
  title: string
  isEdgeHidden?: boolean // 窗口是否隐藏到边缘
  originalPositionBeforeEdgeHide?: { x: number, y: number } // 隐藏前的原始位置
  hiddenEdge?: 'top' | 'bottom' | 'left' | 'right' // 隐藏到哪个边缘
  colorScheme?: windowColorScheme
  // 用于临时窗口的内容渲染
  customRender?: () => React.ReactNode
  // 窗口其他属性
  showClose?: boolean
  showMinimize?: boolean
  showMaximize?: boolean
  onClose?: () => void
  // 应用属性
  appProps?: Record<string, unknown>
}

interface WindowManagerContextProps {
  windows: WindowState[]
  tempWindows: TempWindowDefinition[]
  openWindow: (id: string, initial?: Partial<WindowState>) => void
  closeWindow: (id: string) => void
  bringToFront: (id: string) => void
  updateWindow: (id: string, patch: Partial<WindowState>) => void
  getWindowById: (id: string) => WindowState | undefined
  resetLocalWindows: () => void
  isMobileLayout: (id: string) => boolean
  // 临时窗口管理函数
  createTempWindow: (definition: TempWindowDefinition) => string
  closeTempWindow: (id: string) => void
  updateTempWindow: (id: string, patch: Partial<TempWindowDefinition>) => void
}

const WindowManagerContext = createContext<WindowManagerContextProps | null>(
  null,
)

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext)
  if (!ctx) {
    throw new Error(
      'useWindowManager must be used within WindowManagerProvider',
    )
  }
  return ctx
}

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [windows, setWindows] = useState<WindowState[]>(() => {
    try {
      const saved = localStorage.getItem('windows')
      return saved ? JSON.parse(saved) : []
    }
    catch {
      return []
    }
  })

  // 临时窗口状态
  const [tempWindows, setTempWindows] = useState<TempWindowDefinition[]>([])

  // 每次窗口状态变化时写入 localStorage
  useEffect(() => {
    localStorage.setItem('windows', JSON.stringify(windows))
  }, [windows])

  // 计算新窗口默认位置
  const getDefaultPosition = (
    count: number,
    size = { width: 400, height: 300 },
  ) => {
    // 屏幕中心
    const centerX = Math.max(window.innerWidth / 2 - size.width / 2, 0)
    const centerY = Math.max(window.innerHeight / 2 - size.height / 2, 0)
    const offset = 32
    let x = centerX + offset * (count % 6)
    let y = centerY + offset * (count % 6)
    // 限制窗口不超出右下边界
    x = Math.min(x, window.innerWidth - size.width)
    y = Math.min(y, window.innerHeight - size.height)
    // 限制窗口不超出左上边界
    x = Math.max(x, 0)
    y = Math.max(y, 0)
    return { x, y }
  }

  // 新增：为临时窗口计算错开的位置
  // 新增：为临时窗口计算错开的位置
  const getTempWindowPosition = useCallback(
    (size = { width: 400, height: 300 }) => {
      // 获取可见窗口的数量和位置信息
      const visibleWindows = windows.filter(w => w.visible && !w.minimized)

      // 初始位置：屏幕中心
      const centerX = Math.max(window.innerWidth / 2 - size.width / 2, 0)
      const centerY = Math.max(window.innerHeight / 2 - size.height / 2, 0)

      // 如果没有可见窗口，直接返回中心位置
      if (visibleWindows.length === 0) {
        return { x: centerX, y: centerY }
      }

      // 生成随机偏移 - 打破规律性
      const getRandomOffset = () => {
        const baseOffset = 40
        // 随机生成 0.75-1.25 之间的系数
        const multiplier = 0.75 + Math.random() * 0.5
        return Math.floor(baseOffset * multiplier)
      }

      // 错开的偏移量 - 基于可见窗口数量的动态偏移
      const baseOffset = 40 + (visibleWindows.length % 3) * 10 // 40, 50, 60 三个基础偏移量循环
      const offset = Math.min(
        baseOffset,
        Math.min(window.innerWidth, window.innerHeight) * 0.05,
      ) // 确保在小屏幕上偏移量不会太大

      // 使用斐波那契螺旋计算偏移 - 更自然的分布

      // 计算新位置的方法：螺旋式偏移 + 随机扰动
      const spiralOffset = (index: number) => {
        // 黄金角度 137.5°
        const goldenAngle = 137.5 * (Math.PI / 180)
        const distance = offset * Math.sqrt(index + 1) // 随距离增加
        const angle = index * goldenAngle

        // 添加微小随机扰动，避免严格对齐
        const randomFactor = 0.85 + Math.random() * 0.3 // 0.85-1.15的随机因子

        const xOffset = Math.cos(angle) * distance * randomFactor
        const yOffset = Math.sin(angle) * distance * randomFactor

        return { xOffset, yOffset }
      }

      // 使用最近创建的窗口位置作为参考
      const lastWindow = visibleWindows.reduce((latest, win) => {
        return latest.zIndex > win.zIndex ? latest : win
      }, visibleWindows[0])

      // 从最近的窗口开始偏移，而不总是从中心
      let baseX = lastWindow.position.x
      let baseY = lastWindow.position.y

      // 如果最近窗口处于屏幕边缘，回到中心
      if (
        baseX < 10
        || baseX > window.innerWidth - 50
        || baseY < 10
        || baseY > window.innerHeight - 50
      ) {
        baseX = centerX
        baseY = centerY
      }

      // 新窗口尝试的位置索引 - 使用可见窗口数量和临时窗口数量的组合
      const positionIndex = (visibleWindows.length + tempWindows.length) % 24 // 更多变化

      // 计算位置
      const { xOffset, yOffset } = spiralOffset(positionIndex)
      let x = baseX + xOffset
      let y = baseY + yOffset

      // 确保窗口在可视区域内
      x = Math.min(Math.max(x, 0), window.innerWidth - size.width)
      y = Math.min(Math.max(y, 0), window.innerHeight - size.height)

      // 检测是否与现有窗口重叠过多
      const checkOverlap = (testX: number, testY: number) => {
        for (const win of visibleWindows) {
          // 计算重叠区域
          const overlapX = Math.max(
            0,
            Math.min(testX + size.width, win.position.x + win.size.width)
            - Math.max(testX, win.position.x),
          )
          const overlapY = Math.max(
            0,
            Math.min(testY + size.height, win.position.y + win.size.height)
            - Math.max(testY, win.position.y),
          )
          const overlapArea = overlapX * overlapY

          // 如果重叠面积超过窗口面积的60%，则认为重叠过多
          const windowArea = size.width * size.height
          if (overlapArea > windowArea * 0.6) {
            return true
          }
        }
        return false
      }

      // 如果重叠过多，尝试其他位置
      if (checkOverlap(x, y)) {
        // 尝试最多12个其他位置 - 增加尝试次数
        for (let i = 1; i <= 12; i++) {
          // 使用不同策略生成位置
          const strategy = i % 3
          let testX, testY

          if (strategy === 0) {
            // 策略1：基于当前位置随机偏移
            testX = x + (Math.random() * 2 - 1) * getRandomOffset()
            testY = y + (Math.random() * 2 - 1) * getRandomOffset()
          }
          else if (strategy === 1) {
            // 策略2：尝试另一个螺旋点
            const { xOffset, yOffset } = spiralOffset(
              (positionIndex + i * 3) % 24,
            )
            testX = baseX + xOffset
            testY = baseY + yOffset
          }
          else {
            // 策略3：基于屏幕区域分割
            const section = i % 4 // 将屏幕分为4个象限
            testX
              = (section % 2 === 0 ? 0.25 : 0.75) * window.innerWidth
                - size.width / 2
            testY
              = (section < 2 ? 0.25 : 0.75) * window.innerHeight
                - size.height / 2
            // 添加随机扰动
            testX += (Math.random() * 2 - 1) * 30
            testY += (Math.random() * 2 - 1) * 30
          }

          // 确保窗口在可视区域内
          const adjustedX = Math.min(
            Math.max(testX, 0),
            window.innerWidth - size.width,
          )
          const adjustedY = Math.min(
            Math.max(testY, 0),
            window.innerHeight - size.height,
          )

          if (!checkOverlap(adjustedX, adjustedY)) {
            x = adjustedX
            y = adjustedY
            break // 找到不重叠的位置
          }
        }
      }

      return { x, y }
    },
    [windows, tempWindows.length],
  )

  // 关闭临时窗口 - 定义在这里是为了避免循环依赖
  const closeTempWindow = useCallback((id: string) => {
    // 从临时窗口列表移除
    setTempWindows(prev => prev.filter(w => w.id !== id))
  }, [])

  // 关闭窗口
  const closeWindow = useCallback(
    (id: string) => {
      setWindows((ws) => {
        const win = ws.find(w => w.id === id)

        // 如果窗口有自定义关闭函数，先调用它
        if (win?.onClose) {
          win.onClose()
        }

        const newWindows = ws.map(w =>
          w.id === id ? { ...w, visible: false } : w,
        )
        // 检查是否还有可见窗口
        const anyVisible = newWindows.some(w => w.visible)
        if (!anyVisible && typeof window !== 'undefined') {
          window.location.hash = ''
        }
        return newWindows
      })

      // 如果是临时窗口，也从临时窗口列表中移除
      closeTempWindow(id)
    },
    [closeTempWindow],
  )

  // 打开窗口
  const openWindow = useCallback(
    (id: string, initial: Partial<WindowState> = {}) => {
      setWindows((ws) => {
        const exist = ws.find(w => w.id === id)
        if (exist) {
          return ws.map(w =>
            w.id === id
              ? {
                  ...w,
                  visible: true,
                  minimized: false,
                  ...initial,
                }
              : w,
          )
        }
        if (ws.find(w => w.id === id))
          return ws
        const maxZ = ws.reduce((max, w) => Math.max(max, w.zIndex), 100)
        const size = initial.size ?? { width: 400, height: 300 }
        const position
          = initial.position ?? getDefaultPosition(ws.length, size)
        return [
          ...ws,
          {
            id,
            title: initial.title ?? '',
            visible: true,
            zIndex: maxZ + 1,
            maximized: false,
            minimized: false,
            position,
            size,
            ...initial,
          },
        ]
      })
    },
    [],
  )

  // 置顶窗口
  const bringToFront = useCallback((id: string) => {
    setWindows((ws) => {
      const maxZ = ws.reduce((max, w) => Math.max(max, w.zIndex), 100)
      return ws.map(w => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w))
    })
    // 修改浏览器 URL 的哈希
    if (typeof window !== 'undefined') {
      window.location.hash = id
    }
  }, [])

  // 更新窗口属性
  const updateWindow = useCallback(
    (id: string, patch: Partial<WindowState>) => {
      setWindows(ws => ws.map(w => (w.id === id ? { ...w, ...patch } : w)))
    },
    [],
  )

  // 检查是否为移动布局
  const isMobileLayout = useCallback(
    (id: string) => {
      const window = windows.find(w => w.id === id)
      if (!window)
        return false
      const result = window.size.height / window.size.width >= 1.6
      return result
    },
    [windows],
  )

  // 通过ID查找窗口
  const getWindowById = useCallback(
    (id: string) => windows.find(w => w.id === id),
    [windows],
  )

  // 重置本地存储的窗口状态
  const resetLocalWindows = useCallback(() => {
    localStorage.removeItem('windows')
    setWindows([])
  }, [])

  // 创建临时窗口 - 使用新的位置计算逻辑
  const createTempWindow = useCallback(
    (definition: TempWindowDefinition) => {
      // 生成唯一ID
      const id = definition.id || `temp-window-${Date.now()}`

      // 确定窗口大小
      const size = definition.size ?? { width: 400, height: 300 }

      // 使用新的位置计算方法，如果未指定位置
      const position = definition.position ?? getTempWindowPosition(size)

      // 添加到临时窗口列表
      setTempWindows(prev => [...prev, { ...definition, id }])

      // 创建常规窗口状态
      const windowState: Partial<WindowState> = {
        id,
        title: definition.title,
        size,
        position,
        colorScheme: definition.colorScheme,
        showClose: definition.showClose !== false, // 默认显示关闭按钮
        showMinimize: definition.showMinimize,
        showMaximize: definition.showMaximize,
        customRender: () => {
          const content = definition.content
          if (typeof content === 'function') {
            return content()
          }
          return content
        },
        onClose: () => {
          if (definition.onClose)
            definition.onClose()
          closeTempWindow(id)
        },
      }

      // 打开窗口
      openWindow(id, windowState)

      return id
    },
    [getTempWindowPosition, openWindow, closeTempWindow],
  )

  // 更新临时窗口
  const updateTempWindow = useCallback(
    (id: string, patch: Partial<TempWindowDefinition>) => {
      // 更新临时窗口列表
      setTempWindows(prev =>
        prev.map(w => (w.id === id ? { ...w, ...patch } : w)),
      )

      // 更新对应的窗口状态
      const windowPatch: Partial<WindowState> = {}
      if (patch.title)
        windowPatch.title = patch.title
      if (patch.size)
        windowPatch.size = patch.size
      if (patch.position)
        windowPatch.position = patch.position
      if (patch.colorScheme)
        windowPatch.colorScheme = patch.colorScheme
      if (patch.showClose !== undefined)
        windowPatch.showClose = patch.showClose
      if (patch.showMinimize !== undefined)
        windowPatch.showMinimize = patch.showMinimize
      if (patch.showMaximize !== undefined)
        windowPatch.showMaximize = patch.showMaximize

      if (patch.content) {
        windowPatch.customRender = () => {
          const content = patch.content
          if (typeof content === 'function') {
            return content()
          }
          return content
        }
      }

      if (Object.keys(windowPatch).length > 0) {
        updateWindow(id, windowPatch)
      }
    },
    [updateWindow],
  )

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        tempWindows,
        openWindow,
        closeWindow,
        bringToFront,
        updateWindow,
        getWindowById,
        resetLocalWindows,
        isMobileLayout,
        createTempWindow,
        closeTempWindow,
        updateTempWindow,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  )
}
