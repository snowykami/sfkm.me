import Image from "next/image"
import DraggableWindow from "@/components/windows/DraggableWindow"
import { t } from "i18next"

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
      title={t("about.title")}
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
      <div className="flex flex-col items-center p-6 rounded-xl shadow-2xl min-w-[320px] max-w-[90vw]">
        <Image
          src="https://q.qlogo.cn/g?b=qq&nk=2751454815&s=640"
          alt="avatar"
          width={72}
          height={72}
          className="rounded-full mb-4 shadow-lg border-2 border-slate-200 dark:border-slate-700"
        />
        <div className="font-bold text-2xl text-slate-800 dark:text-slate-100 mb-1">Snowykami</div>
        <div className="text-sm text-slate-800 dark:text-slate-400 mb-4">{t("about.title")}</div>
        <div className="text-slate-700 dark:text-slate-200 mb-6 text-center leading-relaxed max-w-[340px]">
          <p className="mb-2">{t("about.description1")}</p>
          <p className="mb-2">{t("about.description2")}</p>
          <p dangerouslySetInnerHTML={{ __html: t("about.description3") }} />
        </div>
        <button
          className="px-6 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition font-medium shadow"
          onClick={onClose}
        >
          {t("ui.close")}
        </button>
      </div>
    </DraggableWindow>
  )
}