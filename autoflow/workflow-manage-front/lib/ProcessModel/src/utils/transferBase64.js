/**
 * base64转字符串
 * @param str
 * @returns {string}
 */
export function decode(str) {
  const binaryStr = atob(str)
  const decodeStr = decodeURI(binaryStr)
  return decodeStr
}

/**
 * 字符串转base64
 * @param str
 * @returns {string}
 */
export function encode(str) {
  const encode = encodeURI(str)
  const base64 = btoa(encode)
  return base64
}
