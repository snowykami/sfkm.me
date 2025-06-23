import React, { useEffect, useRef, useState } from "react";
import { useMusic } from "@/contexts/MusicContext";
import { motion } from "framer-motion";
import { BaseWindow } from "../windows/BaseWindow";

export interface DesktopLyricWidgetProps {
  id?: string;
  visible?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  shadow?: boolean;
}

export const LyricWindow: React.FC<DesktopLyricWidgetProps> = ({
  id = "desktop-lyric",
  visible = true,
  draggable = true,
  resizable = false,
  width = 480,
  height = 60,
  fontSize = 28,
  // color = "#fff",
  shadow = true,
}) => {
  const { displayLrc, currentSong } = useMusic();
  const lyricRef = useRef<HTMLDivElement>(null);

  // 新增：本地维护位置
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [size, setSize] = useState({ width, height });

  useEffect(() => {
    if (lyricRef.current) {
      lyricRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [displayLrc]);

  if (!currentSong) return null;

  return (
    <BaseWindow
      id={id}
      visible={visible}
      draggable={draggable}
      resizable={resizable}
      width={size.width}
      height={size.height}
      x={position.x}
      y={position.y}
      onDragStop={(_, d) => setPosition({ x: d.x, y: d.y })}
      onResizeStop={(_, __, ref, ___, pos) => {
        setSize({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        });
        setPosition({ x: pos.x, y: pos.y });
      }}
      zIndex={9999}
    >
      <motion.div
        ref={lyricRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: true ? 1 : 0.5, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`
    w-full h-full flex items-center justify-center
    font-semibold tracking-wide cursor-move whitespace-pre-line text-center leading-tight overflow-hidden bg-transparent select-none
    ${shadow ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]" : ""}
    bg-gradient-to-r from-pink-400 via-blue-400 to-green-400
    bg-clip-text text-transparent
  `}
        style={{
          fontSize,
          // color 不再需要，渐变色用 text-transparent + bg-clip-text
        }}
      >
        {displayLrc || currentSong.title}
      </motion.div>
    </BaseWindow>
  );
};
