"use client"

import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import FloatingActionButton, { FloatingMenuItem } from "./FloatingButton"

export function MobileLangFloatButton() {
  const { i18n } = useTranslation()
  const languages = Object.keys(i18n.options.resources || {})

  const menuItems: FloatingMenuItem[] = languages.map(lng => ({
    label:
      lng === "zh"
        ? "简体中文"
        : lng === "en"
        ? "English"
        : lng === "ja"
        ? "日本語"
        : lng,
    onClick: () => {
      i18n.changeLanguage(lng)
      localStorage.setItem("language", lng)
    },
    active: i18n.language === lng,
  }))

  // 添加 mounted 状态，避免 SSR 时 window 不一致
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // 仅在移动设备显示
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (!mounted || !isMobile) return null

  return (
    <FloatingActionButton
      icon={<Globe className="w-6 h-6 text-slate-200" />}
      menuItems={menuItems}
    />
  )
}