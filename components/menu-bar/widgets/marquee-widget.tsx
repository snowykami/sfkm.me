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
  const textRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0) // 使用ref来存储当前偏移量，避免状态更新引起的渲染循环
  const animationRef = useRef<number>(0) // 存储动画帧ID

  // 计算初始尺寸
  useEffect(() => {
    if (textRef.current && containerRef.current) {
      const containerW = containerRef.current.offsetWidth
      offsetRef.current = containerW // 设置初始位置
      setOffset(containerW) // 初始化状态
    }
  }, [index])

  // 滚动动画
  useEffect(() => {
    let start: number | null = null
    const duration = 8000 // 每条滚动时长

    // 在组件挂载或索引改变时重置动画
    function resetAnimation() {
      // 取消现有动画
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      if (containerRef.current && textRef.current) {
        const containerW = containerRef.current.offsetWidth
        offsetRef.current = containerW
        setOffset(containerW) // 只在初始化和重置时设置状态
        
        // 延迟开始新动画，确保状态已更新
        setTimeout(() => {
          start = null
          animationRef.current = requestAnimationFrame(animate)
        }, 50)
      }
    }

    function animate(timestamp: number) {
      if (!containerRef.current || !textRef.current) return
      
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      
      const containerW = containerRef.current.offsetWidth
      const textW = textRef.current.offsetWidth
      const totalDistance = containerW + textW
      const progress = Math.min(elapsed / duration, 1)
      
      // 计算新的偏移量
      offsetRef.current = containerW - totalDistance * progress
      
      // 只在动画帧中更新DOM，避免使用setState
      textRef.current.style.transform = `translateX(${offsetRef.current}px)`
      
      if (progress < 1) {
        // 继续动画
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // 动画完成，等待一段时间后切换到下一条文本
        setTimeout(() => {
          setIndex((i) => (i + 1) % texts.length)
          // 新的文本会触发useEffect，重置动画
        }, 500)
      }
    }

    // 启动动画
    resetAnimation()

    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [index, texts.length]) // 只在索引或文本数量变化时重新启动动画

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
          transform: `translateX(${offset}px)`, // 初始位置由状态控制
          willChange: "transform",
        }}
      >
        {texts[index]}
      </div>
    </div>
  )
}