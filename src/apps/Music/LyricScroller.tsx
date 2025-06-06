import React, { useEffect, useRef, useState } from "react";
import { useMusic } from "@/contexts/MusicContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { t } from "i18next";
import { deriveLyricThemeColors } from "@/utils/color";

// 工具：hex/rgb转hsl

export default function LyricScroller({ wid }: { wid: string }) {
  const { lrcLines, currentLrcLine, getAlbumCoverColor } = useMusic();
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { isMobile: isMobileDevice, mode } = useDevice();
  const { isMobileLayout } = useWindowManager();
  const isMobile = isMobileDevice || isMobileLayout(wid);

  // 主题色衍生
  const [lyricTheme, setLyricTheme] = useState({
    dayText: "oklch(62.3% 0.214 259.815)",
    dayBg: "oklch(80.9% 0.105 251.813)",
    nightText: "oklch(70.7% 0.165 254.624)",
    nightBg: "oklch(54.6% 0.245 262.881)",
    dayOtherText: "oklch(70.4% 0.04 256.788)",
    nightOtherText: "oklch(92.9% 0.013 255.508)",
  });

  // 切歌时更新主题色
  useEffect(() => {
    let mounted = true;
    getAlbumCoverColor().then(color => {
      if (!mounted) return;
      setLyricTheme(deriveLyricThemeColors(color));
    });
    return () => { mounted = false; };
  }, [getAlbumCoverColor]);

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
        (target?.offsetTop ?? 0) - containerHeight * 0.35 + (target?.clientHeight ?? 0) / 2;

      const start = container.scrollTop;
      const change = targetOffset - start;
      const duration = 500;
      let startTime: number | null = null;

      function animateScroll(timestamp: number) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
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
        max-w-full
      `}
    >
      {lrcLines.length === 0 ? (
        <div className="text-center text-slate-600 dark:text-slate-500">{t("music.nolyric")}</div>
      ) : (
        lrcLines.map((line, idx) => {
          const offset = idx - currentLrcLine;
          let style = "";
          if (offset === 0) {
            style = "opacity-100 scale-90 translate-y-0 z-10";
          } else if (Math.abs(offset) === 1) {
            style = "opacity-80 scale-90 " + (offset > 0 ? "translate-y-4" : "-translate-y-4") + " z-0";
          } else if (Math.abs(offset) === 2) {
            style = "opacity-60 scale-90 " + (offset > 0 ? "translate-y-8" : "-translate-y-8") + " z-0";
          } else {
            style = "opacity-40 scale-90 " + (offset > 0 ? "translate-y-12" : "-translate-y-12") + " z-0";
          }
          const isCurrent = idx === currentLrcLine;
          return (
            <div
              key={line.time + line.text + idx}
              ref={el => { lineRefs.current[idx] = el; }}
              className={`
                ${isMobile ? "text-center" : "text-left"}
                select-none px-2 py-0.5 rounded
                transition-all duration-500 ease-[cubic-bezier(.4,2,.6,1)]
                w-full
                font-bold
                ${style}
              `}
              style={{
                color: isCurrent
                  ? (mode === "dark" ? lyricTheme.nightText : lyricTheme.dayText)
                  : (mode === "dark" ? lyricTheme.nightOtherText : lyricTheme.dayOtherText),
                background: isCurrent
                  ? (mode === "dark" ? lyricTheme.nightBg : lyricTheme.dayBg)
                  : "transparent",
                filter: isCurrent ? "drop-shadow(0 2px 8px #60a5fa44)" : undefined,
                fontSize: isCurrent ? "1.35rem" : "1.25rem"
              }}
            >
              {t(line.text)}
            </div>
          );
        })
      )}
    </div>
  );
}