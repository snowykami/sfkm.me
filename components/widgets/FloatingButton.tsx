"use client"

import { useState, useEffect, useRef, ReactNode } from "react"

export type FloatingMenuItem = {
  label: string
  onClick: () => void
  active?: boolean
  className?: string
}

export interface FloatingActionButtonProps {
  icon: ReactNode
  menuItems: FloatingMenuItem[]
  buttonClassName?: string
  menuClassName?: string
  position?: {
    right?: string
    bottom?: string
  }
}

export default function FloatingActionButton({
  icon,
  menuItems,
  buttonClassName = "p-3 rounded-full bg-slate-500 dark:bg-slate-700/90 shadow-lg hover:bg-slate-700/90 transition-colors",
  menuClassName = "absolute right-0 bottom-14 min-w-[140px] bg-slate-500 dark:bg-slate-700/90 rounded-lg shadow-lg border border-slate-700/50 z-50 animate-pop-in",
  position = { right: "right-4", bottom: "bottom-6" },
}: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className={`fixed ${position.right} ${position.bottom} z-[9999]`}>
      <button
        ref={buttonRef}
        className={buttonClassName}
        onClick={() => setOpen(v => !v)}
      >
        {icon}
      </button>
      {open && (
        <div ref={menuRef} className={menuClassName}>
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={`px-4 py-2 text-slate-300 text-sm hover:bg-slate-700/50 cursor-pointer transition-colors ${
                item.active ? "font-bold text-blue-400" : ""
              } ${item.className || ""}`}
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}