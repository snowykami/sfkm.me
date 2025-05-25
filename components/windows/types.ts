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