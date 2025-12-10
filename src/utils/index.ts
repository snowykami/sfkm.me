/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象，其属性会合并到目标对象
 * @returns 合并后的新对象
 */
export function deepMerge<
  T extends Record<string, unknown>,
  S extends Record<string, unknown>,
>(target: T, source: S): T & S {
  // 创建目标对象的拷贝
  const output = { ...target } as Record<string, unknown>

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key]
      const targetValue = key in target ? target[key] : undefined

      if (isObject(sourceValue)) {
        // 如果目标对象也有这个键并且也是对象，则递归合并
        if (isObject(targetValue)) {
          output[key] = deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue,
          )
        }
        else {
          // 源是对象但目标不是对象（或不存在），直接复制
          output[key] = { ...sourceValue }
        }
      }
      else {
        // 不是对象就直接覆盖
        output[key] = sourceValue
      }
    })
  }

  return output as T & S
}

/**
 * 检查值是否为对象（非null、非数组的对象）
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
