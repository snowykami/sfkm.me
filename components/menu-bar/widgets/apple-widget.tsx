"use client"

import { useState } from "react"
import Image from "next/image"

export function AppleWidget() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-colors hover:bg-slate-700/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640"
        alt="Apple Logo"
        className="w-4 h-4 rounded-full"
        width={16}
        height={16}
      />

      {/* 下拉菜单 */}
      {isHovered && (
        <div className="absolute top-7 left-4 bg-slate-800/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-700/50 py-2 min-w-[200px] z-50">
          <div className="px-4 py-2 text-slate-300 text-sm hover:bg-slate-700/50 cursor-pointer">关于此名片</div>
          <div className="border-t border-slate-700/50 my-1"></div>
          <div className="px-4 py-2 text-slate-300 text-sm hover:bg-slate-700/50 cursor-pointer">语言设置</div>
          <div className="px-4 py-2 text-slate-300 text-sm hover:bg-slate-700/50 cursor-pointer">强制退出</div>
        </div>
      )}
    </div>
  )
}
