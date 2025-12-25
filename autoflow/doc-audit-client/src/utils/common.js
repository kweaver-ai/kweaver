/**
 * 获取字符串的字符长度
 * @param {*} str
 */
export function getBLen(str) {
  // 把双字节的替换成两个单字节的然后再获得长度
  if (str === null) return 0
  if (typeof str !== 'string') str += ''
  return str.replace(/[^\x00-\xff]/g, '01').length
}

/**
 * 格式化文件名
 * @param {*} str
 */
export function omitDocName(str) {
  if (getBLen(str) < 18) {
    return str
  }
  let result = ''
  // 取字符串前6个字符
  let templen = 0
  for (let i = 0; i < str.length; i++) {
    templen += str.charCodeAt(i) > 255 ? 2 : 1
    if (templen === 6) {
      result = str.substring(0, i + 1)
      break
    } else if (templen > 6) {
      result = str.substring(0, i)
      break
    }
  }
  result += '...'
  // 取字符串后2个字符
  let ext = ''
  let lastLen = 6
  if (str.lastIndexOf('.') > -1) {
    ext = str.substring(str.lastIndexOf('.'), str.length)
    str = str.substring(0, str.lastIndexOf('.'))
    lastLen = 2
  }
  templen = 0
  for (let i = str.length; i > 0; i--) {
    templen += str.charCodeAt(i) > 255 ? 2 : 1
    if (templen === lastLen) {
      result += str.substring(i - 1, str.length)
      break
    } else if (templen > lastLen) {
      result += str.substring(i, str.length)
      break
    }
  }
  result += ext
  return result
}

/**
 * 获取文档类型
 * @param {*} name
 */
export function getFileTypeClass(name) {
  if (/\.(jpg|jpeg|gif|bmp|png|wmf|emf|svg|tga|tif)$/.test(name)) { // 图片
    return { 'img': true }
  } else if (/\.(xls|xlsx|ods|xlsb|xlsm|et)$/.test(name)) { // Excel文件
    return { 'xls': true }
  } else if (/\.(doc|docx|docm|odt|dotx|wps|dotm)$/.test(name)) { // word文件
    return { 'doc': true }
  } else if (/\.(ppt|pptx)$/.test(name)) { // ppt文件
    return { 'pptx': true }
  } else if (/\.(mp3|aac|wav|wma|flac|m4a|ape|ogg)$/.test(name)) { // 音频文件
    return { 'mp3': true }
  } else if (/\.(avi|rmvb|rm|mp4|3gp|mkv|mov|mpg|mpeg|wmv|flv|asf|h264|x264|mts|m2ts)$/.test(name)) { // 视频文件
    return { 'mp4': true }
  } else if (/\.zip$/.test(name)) { // zip压缩文件
    return { 'zip': true }
  } else if (/\.pdf$/.test(name)) { // pdf文件
    return { 'pdf': true }
  } else if (/\.txt$/.test(name)) { // txt文件
    return { 'txt': true }
  } else if (/\.exe$/.test(name)) { // exe文件
    return { 'exe': true }
  } else if (/\.html$/.test(name)) { // html文件
    return { 'wyym': true }
  } else if (/\.(psd|psb)$/.test(name)) { // ps文件
    return { 'ps': true }
  } else if (/\.ai$/.test(name)) { // Adobe illustrator文件
    return { 'ai': true }
  } else if (/\.drawio$/.test(name)) { // 流程图文件
    return { 'drawio': true }
  } else if (/\.csv$/.test(name)) { // csv文件使用表格图标
    return { 'autosheet': true }
  } {
    return { 'wzlx': true } // 其他
  }
}

export function getFileType(name) {
  if (/\.(jpg|jpeg|gif|bmp|png|wmf|emf|svg|tga|tif)$/.test(name)) { // 图片
    return 'file-image'
  } else if (/\.(xls|xlsx|ods|xlsb|xlsm|et)$/.test(name)) { // Excel文件
    return 'file-excel'
  } else if (/\.(doc|docx|docm|odt|dotx|wps|dotm)$/.test(name)) { // word文件
    return 'file-word'
  } else if (/\.(ppt|pptx)$/.test(name)) { // ppt文件
    return 'file-ppt'
  } else if (/\.(mp3|aac|wav|wma|flac|m4a|ape|ogg)$/.test(name)) { // 音频文件
    return 'file-audio'
  } else if (/\.(avi|rmvb|rm|mp4|3gp|mkv|mov|mpg|mpeg|wmv|flv|asf|h264|x264|mts|m2ts)$/.test(name)) { // 视频文件
    return 'file-video'
  } else if (/\.zip$/.test(name)) { // zip压缩文件
    return 'file-zip'
  } else if (/\.pdf$/.test(name)) { // pdf文件
    return 'file-pdf'
  } else if (/\.txt$/.test(name)) { // txt文件
    return 'file-text'
  } else if (/\.exe$/.test(name)) { // exe文件
    return 'file-exe'
  } else if (/\.html$/.test(name)) { // html文件
    return 'file-html'
  } else if (/\.(psd|psb)$/.test(name)) { // ps文件
    return 'file-ps'
  } else if (/\.ai$/.test(name)) { // Adobe illustrator文件
    return 'file-ai'
  } else if (/\.drawio$/.test(name)) { // 流程图文件
    return 'file-drawio'
  } else { // 其他
    return 'file-unknown'
  }
}

