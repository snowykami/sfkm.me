export const getBackgroundWithOpacity = (color: string) => {
    // 从 RGB 或 HEX 提取颜色部分
    let r = 107, g = 114, b = 128; // 默认灰色
    
    try {
        if (color.startsWith('rgb')) {
            const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (matches) {
                r = parseInt(matches[1], 10);
                g = parseInt(matches[2], 10);
                b = parseInt(matches[3], 10);
            }
        } else if (color.startsWith('#')) {
            r = parseInt(color.slice(1, 3), 16);
            g = parseInt(color.slice(3, 5), 16);
            b = parseInt(color.slice(5, 7), 16);
        }
    } catch (e) {
        console.error("Error parsing color:", e);
    }
    
    // 返回带有不同透明度的 rgba 值
    return {
        light: `rgba(${r}, ${g}, ${b}, 0.15)`,
        medium: `rgba(${r}, ${g}, ${b}, 0.25)`,
        dark: `rgba(${r}, ${g}, ${b}, 0.4)`
    };
};