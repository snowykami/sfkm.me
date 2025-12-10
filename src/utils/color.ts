export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}
export function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [h * 360, s, l]
}
export function hslToHex(h: number, s: number, l: number) {
  l = Math.max(0, Math.min(1, l))
  s = Math.max(0, Math.min(1, s))
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60)
    [r, g, b] = [c, x, 0]
  else if (h < 120)
    [r, g, b] = [x, c, 0]
  else if (h < 180)
    [r, g, b] = [0, c, x]
  else if (h < 240)
    [r, g, b] = [0, x, c]
  else if (h < 300)
    [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const toHex = (v: number) => {
    const h = Math.round((v + m) * 255).toString(16)
    return h.length === 1 ? `0${h}` : h
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// 主题色衍生
export function deriveLyricThemeColors(themeColor: string) {
  // 默认灰色
  let r = 107
  let g = 114
  let b = 128
  if (themeColor.startsWith('rgb')) {
    const arr = themeColor.match(/\d+/g)
    if (arr && arr.length >= 3) {
      r = +arr[0]
      g = +arr[1]
      b = +arr[2]
    }
  }
  else if (themeColor.startsWith('#')) {
    const rgb = hexToRgb(themeColor)
    if (rgb) {
      r = rgb.r
      g = rgb.g
      b = rgb.b
    }
  }
  const [h, s, l] = rgbToHsl(r, g, b)

  // 亮色模式
  // 色相/饱和度/亮度
  const dayText = hslToHex(h, Math.min(1, s * 1.5), 0.4)
  const dayOtherText = hslToHex(h, Math.min(0.3, s * 0.3), 0.45)
  const dayBg = `${hslToHex(h, s * 0.15, 0.4)}80`
  const dayProgress = hslToHex(h, Math.min(0.8, s * 0.8), Math.max(0.6, l * 0.6))
  // 深色模式
  const nightText = hslToHex(h, Math.min(1, s * 1.3), 0.7)
  const nightOtherText = hslToHex(h, Math.min(0.3, s * 0.3), 0.6)
  const nightBg = `${hslToHex(h, s * 0.18, 0.4)}50`
  const nightProgress = hslToHex(h, Math.min(1, s * 0.6), 0.65)

  return {
    dayText,
    dayBg,
    nightText,
    nightBg,
    dayOtherText,
    nightOtherText,
    dayProgress,
    nightProgress,
  }
}

const DEFAULT_COVER_COLOR = 'rgb(100, 100, 100)'

export async function getAlbumCoverColor(cover: string): Promise<string> {
  if (!cover) {
    return DEFAULT_COVER_COLOR
  }

  try {
    // 1. 加载图片
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = cover || ''
    })

    // 2. 创建小尺寸画布 (提高性能)
    const size = 32 // 更小的尺寸，足够获取整体色调
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx)
      return DEFAULT_COVER_COLOR

    // 3. 绘制并执行高斯模糊
    ctx.drawImage(img, 0, 0, size, size)

    // 应用高斯模糊 (多次应用低半径模糊比单次应用高半径模糊效果更好)
    for (let i = 0; i < 3; i++) {
      ctx.filter = 'blur(2px)'
      ctx.drawImage(canvas, 0, 0)
    }
    ctx.filter = 'none'

    // 4. 最终再次绘制到一个极小的画布上，获取平均色
    const finalSize = 1 // 1x1 像素，即整体平均色
    const smallCanvas = document.createElement('canvas')
    smallCanvas.width = finalSize
    smallCanvas.height = finalSize
    const smallCtx = smallCanvas.getContext('2d')
    if (!smallCtx)
      return DEFAULT_COVER_COLOR

    // 绘制模糊后的图像到1x1画布，自动获得平均色
    smallCtx.drawImage(canvas, 0, 0, size, size, 0, 0, finalSize, finalSize)

    // 5. 获取平均颜色
    const pixel = smallCtx.getImageData(0, 0, 1, 1).data
    const r = pixel[0]
    const g = pixel[1]
    const b = pixel[2]

    // 6. 如果颜色太暗或太亮，进行调整
    const avgLuminance = (r + g + b) / 3
    if (avgLuminance < 40) {
      // 太暗，提亮
      const factor = 40 / avgLuminance
      return `rgb(${Math.min(255, Math.round(r * factor))}, 
                        ${Math.min(255, Math.round(g * factor))}, 
                        ${Math.min(255, Math.round(b * factor))})`
    }
    else if (avgLuminance > 220) {
      // 太亮，降低亮度
      const factor = 220 / avgLuminance
      return `rgb(${Math.round(r * factor)}, 
                        ${Math.round(g * factor)}, 
                        ${Math.round(b * factor)})`
    }

    return `rgb(${r}, ${g}, ${b})`
  }
  catch (error) {
    console.error('Failed to get album cover color:', error)
    return DEFAULT_COVER_COLOR
  }
}
