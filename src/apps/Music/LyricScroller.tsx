import React, { useEffect, useRef, useState } from "react";
import { useMusic } from "@/contexts/MusicContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useWindowManager } from "@/contexts/WindowManagerContext";
import { t } from "i18next";

// 工具：hex/rgb转hsl
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}
function hslToHex(h: number, s: number, l: number) {
  l = Math.max(0, Math.min(1, l));
  s = Math.max(0, Math.min(1, s));
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else[r, g, b] = [c, 0, x];
  const toHex = (v: number) => {
    const h = Math.round((v + m) * 255).toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// 主题色衍生
function deriveLyricThemeColors(themeColor: string) {
  // 默认灰色
  let r = 107, g = 114, b = 128;
  if (themeColor.startsWith("rgb")) {
    const arr = themeColor.match(/\d+/g);
    if (arr && arr.length >= 3) {
      r = +arr[0]; g = +arr[1]; b = +arr[2];
    }
  } else if (themeColor.startsWith("#")) {
    const rgb = hexToRgb(themeColor);
    if (rgb) { r = rgb.r; g = rgb.g; b = rgb.b; }
  }
  const [h, s, l] = rgbToHsl(r, g, b);
  // 其他歌词（更深/更亮）
  const otherDayText = hslToHex(h, s * 0.5, Math.max(0.25, l * 0.35));
  const dayText = hslToHex(h, Math.min(1, s * 1.2), Math.max(0.8, l * 0.8));
  const dayBg = hslToHex(h, s * 0.15, 0.4) + "80"; // 0.94透明度
  
  const otherNightText = hslToHex(h, s * 0.3, Math.max(0.8, l * 0.35));
  const nightText = hslToHex(h, Math.min(1, s * 1.2), Math.max(0.8, l * 0.7));
  const nightBg = hslToHex(h, s * 0.18, 0.5) + "50"; // 0.9透明度
  
  return { dayText, dayBg, nightText, nightBg, otherDayText, otherNightText };
}

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
    otherDayText: "oklch(70.4% 0.04 256.788)",
    otherNightText: "oklch(92.9% 0.013 255.508)",
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
                  : (mode === "dark" ? lyricTheme.otherNightText : lyricTheme.otherDayText),
                background: isCurrent
                  ? (mode === "dark" ? lyricTheme.nightBg : lyricTheme.dayBg)
                  : "transparent",
                filter: isCurrent ? "drop-shadow(0 2px 8px #60a5fa44)" : undefined,
                fontSize: isCurrent ? "1.35rem" : "1.25rem"
              }}
            >
              {line.text}
            </div>
          );
        })
      )}
    </div>
  );
}