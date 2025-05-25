"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import i18n from "@/src/i18n"
import AboutCardWindow from "@/components/windows/About"

export function AppleWidget() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭主菜单和二级菜单
  useEffect(() => {
    if (!menuOpen && !aboutOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
        setLangMenuOpen(false)
      }
      // DraggableWindow 自带点击遮罩关闭，无需在这里处理 aboutOpen
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen, aboutOpen])

  // 关闭网页
  const handleForceQuit = () => {
    window.close()
  }

  // 可用语言
  const languages = Object.keys(i18n.options.resources || {})

  // 居中弹窗位置
  const getCenterPos = () => {
    if (typeof window === "undefined") return { x: 200, y: 150 }
    return {
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 150,
    }
  }

  return (
    <div className="relative flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-colors hover:bg-slate-700/50">
      <div
        onClick={() => setMenuOpen(v => !v)}
        className="w-full h-full flex items-center justify-center"
      >
        <Image
          src="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640"
          alt="Apple Logo"
          className="w-4 h-4 rounded-full"
          width={16}
          height={16}
        />
      </div>

      {/* 下拉菜单 */}
      <div
        ref={menuRef}
        className={`absolute top-7 left-4 min-w-[200px] z-50 transition-all duration-200
          ${menuOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
          }
        `}
        style={{
          background: "rgba(30,41,59,0.95)",
          backdropFilter: "blur(8px)",
          borderRadius: "0.5rem",
          boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
          border: "1px solid rgba(51,65,85,0.5)",
        }}
      >
        {/* 关于 */}
        <div
          className="px-4 py-2 text-slate-300 text-sm hover:bg-slate-700/50 cursor-pointer transition-colors"
          onClick={() => {
            setAboutOpen(true)
            setMenuOpen(false)
          }}
        >
          关于此名片
        </div>
        <div className="border-t border-slate-700/50 my-1"></div>
        {/* 语言设置 */}
        <div
          className="px-4 py-2 text-slate-300 text-sm hover:bg-slate-700/50 cursor-pointer transition-colors flex justify-between items-center"
          onClick={() => setLangMenuOpen(v => !v)}
        >
          语言设置
          <span className="ml-2 text-xs">{langMenuOpen ? "▲" : "▼"}</span>
        </div>
        {/* 二级语言菜单 */}
        {langMenuOpen && (
          <div className="pl-4">
            {languages.map(lng => (
              <div
                key={lng}
                className={`px-4 py-2 text-slate-300 text-sm hover:bg-slate-700/50 cursor-pointer transition-colors ${i18n.language === lng ? "font-bold text-blue-400" : ""
                  }`}
                onClick={() => {
                  i18n.changeLanguage(lng)
                  localStorage.setItem("language", lng)
                  setMenuOpen(false)
                  setLangMenuOpen(false)
                }}
              >
                {lng === "zh" && "简体中文"}
                {lng === "en" && "English"}
                {lng === "ja" && "日本語"}
                {!["zh", "en", "ja"].includes(lng) && lng}
              </div>
            ))}
          </div>
        )}
        {/* 强制退出 */}
        <div
          className="px-4 py-2 text-slate-300 text-sm hover:bg-red-700/50 cursor-pointer transition-colors"
          onClick={handleForceQuit}
        >
          强制退出
        </div>
      </div>

      {/* 关于弹窗，复用 DraggableWindow */}
      {aboutOpen && (
        <AboutCardWindow
          isVisible={aboutOpen}
          initialX={getCenterPos().x}
          initialY={getCenterPos().y}
          onClose={() => setAboutOpen(false)}
        />
      )}
    </div>
  )
}