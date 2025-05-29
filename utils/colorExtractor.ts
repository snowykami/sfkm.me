export interface DominantColors {
  primary: string;
  secondary: string;
  tertiary: string;
  isDark: boolean;
}

/**
 * 从图片URL提取主要颜色
 */
export async function extractColorsFromImage(imageUrl: string): Promise<DominantColors> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        // 创建画布
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法创建Canvas上下文"));
          return;
        }

        // 调整画布大小 - 使用较小的尺寸提高性能
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, size, size);
        
        // 获取像素数据
        const imageData = ctx.getImageData(0, 0, size, size).data;
        
        // 颜色映射和频率
        const colorMap: Record<string, number> = {};
        let totalBrightness = 0;
        
        // 分析每个像素
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          
          // 跳过透明像素
          if (imageData[i + 3] < 128) continue;
          
          // 量化颜色以减少颜色数量
          const quantizedR = Math.round(r / 16) * 16;
          const quantizedG = Math.round(g / 16) * 16;
          const quantizedB = Math.round(b / 16) * 16;
          
          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
          
          colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
          
          // 计算亮度用于确定图片整体是明还是暗
          totalBrightness += (r + g + b) / 3;
        }
        
        // 排序获取前三个最常见颜色
        const sortedColors = Object.entries(colorMap)
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color);
        
        // 将rgb转换为hex格式
        const toHex = (colorStr: string) => {
          const [r, g, b] = colorStr.split(',').map(Number);
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        };
        
        // 计算平均亮度
        const avgBrightness = totalBrightness / (size * size);
        const isDark = avgBrightness < 128;
        
        resolve({
          primary: toHex(sortedColors[0] || "0,0,0"),
          secondary: toHex(sortedColors[1] || "0,0,0"),
          tertiary: toHex(sortedColors[2] || "0,0,0"),
          isDark
        });
      } catch (error) {
        console.error("提取颜色时出错:", error);
        // 返回默认颜色
        resolve({
          primary: "#3b82f6",
          secondary: "#8b5cf6",
          tertiary: "#6366f1",
          isDark: false
        });
      }
    };
    
    img.onerror = () => {
      console.error("加载图片失败:", imageUrl);
      // 返回默认颜色
      resolve({
        primary: "#3b82f6",
        secondary: "#8b5cf6",
        tertiary: "#6366f1",
        isDark: false
      });
    };
    
    img.src = imageUrl;
  });
}