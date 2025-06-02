"use client";
import React, { useEffect, useRef } from "react";
import { useMusic } from "@/contexts/MusicContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { t } from "i18next";

export default function LyricScroller({ wid }: { wid: string }) {
  const { lrcLines, currentLrcLine } = useMusic();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { isMobile: isMobileDevice } = useDevice();
  const { isMobileLayout } = useWindowManager();
  const isMobile = isMobileDevice || isMobileLayout(wid);

  useEffect(() => {
    if (
      containerRef.current &&
      lineRefs.current[currentLrcLine] &&
      lrcLines.length > 0
    ) {
      const container = containerRef.current;
      const target = lineRefs.current[currentLrcLine];
      const containerHeight = container.clientHeight;
      const targetOffset =
        // 当前歌词控制位
        (target?.offsetTop ?? 0) - containerHeight * 0.35 + (target?.clientHeight ?? 0) / 2;

      // 自定义平滑滚动
      const start = container.scrollTop;
      const change = targetOffset - start;
      const duration = 500; // 动画时长（毫秒）
      let startTime: number | null = null;

      function animateScroll(timestamp: number) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeInOutQuad 缓动
        const ease = progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
        container.scrollTop = start + change * ease;
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      }

      requestAnimationFrame(animateScroll);
    }
  }, [currentLrcLine, lrcLines.length]);

  return (
    <div
      ref={containerRef}
      className={`
      h-full overflow-y-auto
      px-0 py-6
      text-base
      leading-10
      relative
      transition-colors
      max-w-full /* 添加最大宽度限制 */
    `}
    >
      {lrcLines.length === 0 ? (
        <div className="text-center text-slate-400 dark:text-slate-500">{t("music.nolyric")}</div>
      ) : (
        lrcLines.map((line, idx) => (
          <div
            key={line.time + line.text + idx}
            ref={el => { lineRefs.current[idx] = el; }}
            className={`
            ${isMobile ? "text-center" : "text-left"} 
            select-none 
            px-2 /* 增加水平内边距 */
            py-1 
            rounded
            transition-all 
            duration-300 
            ease-[cubic-bezier(.4,2,.6,1)]
            w-full /* 确保宽度受限 */
            ${idx === currentLrcLine
                ? `text-blue-500 dark:text-blue-400 font-bold ${isMobile ? "text-1xl" : "text-2xl"} bg-blue-500/10 dark:bg-blue-400/10 opacity-100
                 break-words whitespace-pre-wrap /* 允许活动歌词换行 */`
                : `text-slate-800 dark:text-slate-200 font-normal text-1xl opacity-60 
                 overflow-hidden break-words whitespace-pre-wrap /* 允许非活动歌词也换行 */
                 ${!isMobile ? "text-ellipsis max-h-10" : ""} /* 桌面端限制高度 */`
              }
          `}
          >
            {line.text}
          </div>
        ))
      )}
    </div>
  );
}