export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}
export function hslToHex(h: number, s: number, l: number) {
  l = Math.max(0, Math.min(1, l));
  s = Math.max(0, Math.min(1, s));
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => {
    const h = Math.round((v + m) * 255).toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// 主题色衍生
export function deriveLyricThemeColors(themeColor: string) {
  // 默认灰色
  let r = 107,
    g = 114,
    b = 128;
  if (themeColor.startsWith("rgb")) {
    const arr = themeColor.match(/\d+/g);
    if (arr && arr.length >= 3) {
      r = +arr[0];
      g = +arr[1];
      b = +arr[2];
    }
  } else if (themeColor.startsWith("#")) {
    const rgb = hexToRgb(themeColor);
    if (rgb) {
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    }
  }
  const [h, s, l] = rgbToHsl(r, g, b);

  // 其他歌词（更深/更亮）
  const dayText = hslToHex(h, Math.min(1, s * 1.5), 0.85);
  const dayOtherText = hslToHex(h, Math.min(0.3, s * 0.3), 0.3);
  const dayBg = hslToHex(h, s * 0.15, 0.4) + "80"; // 0.94透明度
  const dayProgress = hslToHex(
    h,
    Math.min(0.8, s * 0.8),
    Math.max(0.6, l * 0.6),
  );

  // 深色模式
  const nightText = hslToHex(h, Math.min(1, s * 1.3), 0.7);
  const nightOtherText = hslToHex(h, Math.min(0.3, s * 0.3), 0.6);
  const nightBg = hslToHex(h, s * 0.18, 0.4) + "50"; // 0.9透明度
  const nightProgress = hslToHex(h, Math.min(1, s * 0.6), 0.65); // 0.9透明度

  return {
    dayText,
    dayBg,
    nightText,
    nightBg,
    dayOtherText,
    nightOtherText,
    dayProgress,
    nightProgress,
  };
}
