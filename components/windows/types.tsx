export interface WindowProps {
  id: string
  title: string
  initialX: number
  initialY: number
  initialZ: number
  initialHeight?: number
  initialWidth?: number
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
  showClose?: boolean
  showMinimize?: boolean
  showMaximize?: boolean
  windowType?: "default" | "mobile"
}