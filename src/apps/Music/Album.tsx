"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMusic } from "@/contexts/MusicContext";
import { useDevice } from "@/contexts/DeviceContext";
import { t } from "i18next";
import { useWindowManager } from "@/contexts/WindowManagerContext";

const MIN_DIAMETER = 120;
const MAX_DIAMETER = 300;
// 移除 wid prop
export function Album({ wid }: { wid: string }) {
  const { currentSong, coverRotate, isPlaying } = useMusic();
  const containerRef = useRef<HTMLDivElement>(null);
  const [diameter, setDiameter] = useState(200);
  const { isMobile: isMobileDevice } = useDevice();
  const { isMobileLayout } = useWindowManager();

  const isMobile = isMobileDevice || isMobileLayout(wid);

  // 根据父容器宽度动态设置圆盘直径，但限制最大直径
  useEffect(() => {
    function updateDiameter() {
      if (containerRef.current && containerRef.current.parentElement) {
        const parentWidth = containerRef.current.parentElement.offsetWidth;
        const calculatedDiameter = Math.floor(
          parentWidth * (isMobile ? 0.45 : 0.6),
        );
        setDiameter(
          Math.min(MAX_DIAMETER, Math.max(MIN_DIAMETER, calculatedDiameter)),
        );
      }
    }
    updateDiameter();

    // 使用 ResizeObserver 监听父容器变化
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    const observer = new window.ResizeObserver(updateDiameter);
    observer.observe(parent);

    return () => observer.disconnect();
  }, [isMobile]);

  if (!currentSong?.cover) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center bg-gray-200 text-gray-400 rounded-full mx-auto"
        style={{
          width: diameter,
          height: diameter,
          fontSize: diameter / 8,
        }}
      >
        {t("music.nocover")}
      </div>
    );
  }

  // 封面图片和中心点尺寸
  const coverSize = diameter * 0.618;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center mx-auto"
      style={{
        width: diameter,
        height: diameter,
      }}
    >
      {/* 黑胶唱片 */}
      <div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full shadow-xl"
        style={{
          width: diameter,
          height: diameter,
          background: "radial-gradient(circle at 60% 40%, #222 70%, #444 100%)",
          border: `${Math.max(6, diameter * 0.04)}px solid #222`,
          transform: `rotate(${coverRotate}deg)`,
          transition: isPlaying
            ? "none"
            : "transform 0.3s cubic-bezier(.4,2,.6,1)",
        }}
      >
        {/* 唱片中心的专辑封面 */}
        <Image
          src={currentSong.cover}
          alt={currentSong.title}
          width={coverSize}
          height={coverSize}
          className="rounded-full border-4 border-white object-cover shadow-md bg-white"
          style={{
            width: coverSize,
            height: coverSize,
            zIndex: 2,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
