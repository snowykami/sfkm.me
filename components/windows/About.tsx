import Image from "next/image"
import DraggableWindow from "@/components/windows/DraggableWindow"

interface AboutCardWindowProps {
  isVisible: boolean
  initialX: number
  initialY: number
  onClose: () => void
}

export default function AboutCardWindow({
  isVisible,
  initialX,
  initialY,
  onClose,
}: AboutCardWindowProps) {
  return (
    <DraggableWindow
      id="about"
      title="关于此名片"
      initialX={initialX}
      initialY={initialY}
      initialZ={99999}
      isVisible={isVisible}
      isMinimized={false}
      isMaximized={false}
      isClosing={false}
      isMinimizing={false}
      onClose={onClose}
      onMinimize={() => {}}
      onMaximize={() => {}}
      onFocus={() => {}}
      showMaximize={false}
      showMinimize={false}
    >
      <div className="flex flex-col items-center p-6 bg-slate-900/80 rounded-xl shadow-2xl min-w-[320px] max-w-[90vw]">
        <Image
          src="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640"
          alt="avatar"
          width={72}
          height={72}
          className="rounded-full mb-4 shadow-lg border-2 border-slate-200 dark:border-slate-700"
        />
        <div className="font-bold text-2xl text-slate-100 mb-1">Snowykami</div>
        <div className="text-sm text-slate-400 mb-4">个人名片 · macOS 风格</div>
        <div className="text-slate-200 mb-6 text-center leading-relaxed">
          这是一个仿 macOS 风格的个人名片页面，支持多窗口、Dock、菜单栏、主题切换等功能。
          最初是由vercel v0生成，后续由作者本人进行维护和更新(不太会react qwq)。
        </div>
        <button
          className="px-6 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition font-medium shadow"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </DraggableWindow>
  )
}