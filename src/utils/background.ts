export function getBackgroundWithOpacity(color: string) {
  // 从 RGB 或 HEX 提取颜色部分
  let r = 107
  let g = 114
  let b = 128 // 默认灰色

  try {
    if (color.startsWith('rgb')) {
      const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (matches) {
        r = Number.parseInt(matches[1], 10)
        g = Number.parseInt(matches[2], 10)
        b = Number.parseInt(matches[3], 10)
      }
    }
    else if (color.startsWith('#')) {
      r = Number.parseInt(color.slice(1, 3), 16)
      g = Number.parseInt(color.slice(3, 5), 16)
      b = Number.parseInt(color.slice(5, 7), 16)
    }
  }
  catch (e) {
    console.error('Error parsing color:', e)
  }

  // 返回带有不同透明度的 rgba 值
  return {
    light: `rgba(${r}, ${g}, ${b}, 0.15)`,
    medium: `rgba(${r}, ${g}, ${b}, 0.25)`,
    dark: `rgba(${r}, ${g}, ${b}, 0.4)`,
  }
}
