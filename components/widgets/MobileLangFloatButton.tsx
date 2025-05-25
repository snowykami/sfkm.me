"use client"

import { useEffect, useState, useRef } from "react"
import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

export function MobileLangFloatButton() {
    const { i18n } = useTranslation()
    const [isMobile, setIsMobile] = useState(false)
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const languages = Object.keys(i18n.options.resources || {})

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // 点击外部关闭菜单
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    if (!isMobile) return null

    return (
        <div className="fixed right-4 bottom-6 z-[9999]">
            <button
                className="p-3 rounded-full bg-slate-800/90 shadow-lg hover:bg-slate-700/90 transition-colors"
                onClick={() => setOpen(v => !v)}
            >
                <Globe className="w-6 h-6 text-slate-200" />
            </button>
            {open && (
                <div
                    ref={menuRef}
                    className="absolute right-0 bottom-14 min-w-[140px] bg-slate-800/95 rounded-lg shadow-lg border border-slate-700/50 z-50 animate-pop-in"
                >
                    {languages.map(lng => (
                        <div
                            key={lng}
                            className={`px-4 py-2 text-slate-300 text-sm hover:bg-slate-700/50 cursor-pointer transition-colors ${i18n.language === lng ? "font-bold text-blue-400" : ""
                                }`}
                            onClick={() => {
                                i18n.changeLanguage(lng)
                                localStorage.setItem("i18nextLng", lng)
                                setOpen(false)
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
        </div>
    )
}