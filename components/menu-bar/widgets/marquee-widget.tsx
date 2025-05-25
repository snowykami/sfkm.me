import { t } from "i18next"
import { useEffect, useRef, useState } from "react"

export function Marquee() {
  const texts = [
    t("marquee.sentence1"),
    t("marquee.sentence2"),
    t("marquee.sentence3"),
    t("marquee.sentence4"),
  ]
  const [index, setIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [, setWidth] = useState(0)
  const textRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算文本宽度
  useEffect(() => {
    if (textRef.current) {
      setWidth(textRef.current.offsetWidth)
      setOffset(containerRef.current ? containerRef.current.offsetWidth : 0)
    }
  }, [index])

  // 滚动动画
  useEffect(() => {
    let raf: number
    let start: number | null = null
    const duration = 8000 // 每条滚动时长
    const containerW = containerRef.current ? containerRef.current.offsetWidth : 0
    const textW = textRef.current ? textRef.current.offsetWidth : 0

    function animate(ts: number) {
      if (start === null) start = ts
      const elapsed = ts - start
      // 从右侧外部滚到左侧外部
      const totalDistance = containerW + textW
      const progress = Math.min(elapsed / duration, 1)
      setOffset(containerW - totalDistance * progress)
      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        setTimeout(() => {
          setIndex((i) => (i + 1) % texts.length)
          setOffset(containerW)
        }, 500)
      }
    }
    setOffset(containerW)
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line
  }, [index])

  return (
    <div
      ref={containerRef}
      className="relative w-[160px] h-6 overflow-hidden flex items-center select-none"
      style={{ minWidth: 0 }}
    >
      <div
        ref={textRef}
        className="absolute whitespace-nowrap text-slate-600 dark:text-slate-300 text-sm transition-colors"
        style={{
          transform: `translateX(${offset}px)`,
          willChange: "transform",
        }}
      >
        {texts[index]}
      </div>
    </div>
  )
}