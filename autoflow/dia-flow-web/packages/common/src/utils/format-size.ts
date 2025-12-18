/**
 * 大小格式化
 * @param bytes 字节大小
 * @param fixed 保留位数 minUnit 最小显示单位
 * @return 返回格式化后的大小字符串
 */
export function formatSize(bytes: number, fixed = 2, minUnit = 'B'): string {
    if (bytes === undefined) {
        return ''
    }

    const [size, unit] = transFormBytes(bytes, { minUnit })

    if (bytes === size) {
        return `${size} ${unit}`
    }
    const sizeStr = size.toString()

    if (sizeStr.indexOf('.') === -1) {
        return `${sizeStr} ${unit}`
    }
    const indexOfPoint = sizeStr.indexOf('.')
    // 不使用toFixed(fixed)，避免类似4.9998被入为5.00
    return `${sizeStr.slice(0, indexOfPoint + fixed + 1)} ${unit}`
}

/**
 * 转换字节数
 * @param bytes 字节大小
 * @param units 单位集合
 * @param minUnit 最小单位
 * @return size 大小 unit单位
 */

export function transFormBytes(bytes: number, { minUnit = 'B' }): [number, string] {
    // 单位集合
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    // 最小显示单位
    const minUnitIndex = units.indexOf(minUnit)
    // 下标，用来计算适合单位的下标
    let index
    for (index = minUnitIndex; index <= units.length; index += 1) {
        if (index === units.length || bytes < 1024 ** (index + 1)) {
            break
        }
    }

    return [bytes / 1024 ** index, units[index]]
}
