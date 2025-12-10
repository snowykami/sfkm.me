import React from 'react'

export interface BaseWidgetProps {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLDivElement>
  title?: string // 新增
}

/**
 * BaseWidget 作为所有顶栏小部件的基础组件，统一样式和交互。
 */
const BaseWidget: React.FC<BaseWidgetProps> = ({
  className = '',
  style,
  children,
  onClick,
  title, // 新增
}) => {
  return (
    <div
      className={`flex items-center px-2 py-1 rounded hover:bg-slate-400 dark:hover:bg-slate-700 transition-colors cursor-pointer select-none ${className}`}
      style={style}
      onClick={onClick}
      title={title} // 新增
    >
      {children}
    </div>
  )
}

export default BaseWidget
