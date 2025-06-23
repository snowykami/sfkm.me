import { Volume2, VolumeX, Volume1 } from "lucide-react";
import BaseWidget from "./BaseWidget";
import { useMusic } from "@/contexts/MusicContext"; // 从 MusicContext 导入 useMusic

// 移除 VOLUME_KEY 和 MUTE_KEY 常量，它们现在在 MusicContext 中定义

export function VolumeWidget() {
  // 从 useMusic hook 获取音量状态和控制函数
  const { volume, isMuted, handleVolumeChange, handleToggleMute } = useMusic();
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-5 text-slate-500 dark:text-slate-300" />;
    } else if (volume < 50) {
      return <Volume1 className="h-5 text-slate-500 dark:text-slate-300" />;
    } else {
      return <Volume2 className="h-5 text-slate-500 dark:text-slate-300" />;
    }
  };
  // 修改 handleVolumeChange，调用 context 提供的 handleVolumeChange
  const handleVolumeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    handleVolumeChange(v); // 调用 context 的函数
  };

  return (
    <BaseWidget title={isMuted ? "已静音" : `音量：${volume}`}>
      <div
        className="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={handleToggleMute} // 调用 context 的函数
      >
        {getVolumeIcon()}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        // 使用 context 的 volume 状态
        value={volume}
        // 调用修改后的 handleVolumeInputChange
        onChange={handleVolumeInputChange}
        className="w-16 h-1 accent-slate-500"
        title="音量"
      />
    </BaseWidget>
  );
}
