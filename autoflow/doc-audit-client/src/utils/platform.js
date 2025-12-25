'use strict'
/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, '__esModule', { value: true })
exports.isLittleEndian = exports.OS = exports.OperatingSystem = exports.locale = exports.language = exports.isRootUser = exports.osDetail = exports.userAgent = exports.platform = exports.isIOS = exports.isWeb = exports.isNative = exports.isLinux = exports.isMacintosh = exports.isWindows = exports.osType = exports.Platform = exports.isElectronRenderer = void 0
const LANGUAGE_DEFAULT = 'en'
let _isWindows = false
let _isMacintosh = false
let _isLinux = false
let _isNative = false
let _isWeb = false
let _isIOS = false
let _locale = undefined
let _language = LANGUAGE_DEFAULT
let _userAgent = undefined
let _osType = undefined
let _osDetail = undefined
exports.isElectronRenderer = typeof process !== 'undefined' &&
    typeof process.versions !== 'undefined' &&
    typeof process.versions.electron !== 'undefined' &&
    process.type === 'renderer'
// OS detection
if (typeof navigator === 'object' && !exports.isElectronRenderer) {
  _userAgent = navigator.userAgent
  _isWindows = _userAgent.indexOf('Windows') >= 0
  _isMacintosh = _userAgent.indexOf('Macintosh') >= 0
  _isIOS = _userAgent.indexOf('Macintosh') >= 0 && !!navigator.maxTouchPoints && navigator.maxTouchPoints > 0
  _isLinux = _userAgent.indexOf('Linux') >= 0
  _isWeb = true
  _locale = navigator.language
  _language = _locale
}
else if (typeof process === 'object') {
  // eslint-disable-next-line
    //const os = require("os");
  _isWindows = process.platform === 'win32'
  _isMacintosh = process.platform === 'darwin'
  _isLinux = process.platform === 'linux'
  // _osDetail = os.type() + " " + os.arch() + " " + os.release();
  _locale = LANGUAGE_DEFAULT
  _language = LANGUAGE_DEFAULT
  _isNative = true
}
let Platform;
(function (Platform) {
  Platform[Platform['Web'] = 0] = 'Web'
  Platform[Platform['Mac'] = 1] = 'Mac'
  Platform[Platform['Linux'] = 2] = 'Linux'
  Platform[Platform['Windows'] = 3] = 'Windows'
})(Platform = exports.Platform || (exports.Platform = {}))
let _platform = Platform.Web
if (_isMacintosh) {
  _platform = Platform.Mac
  _osType = 'mac'
}
else if (_isWindows) {
  _platform = Platform.Windows
  _osType = 'windows'
}
else if (_isLinux) {
  _platform = Platform.Linux
  if (exports.isElectronRenderer) {
    if (process.arch.match('arm')) {
      _osType = 'linux_arm64'
    }
    else if (process.arch.match('mip')) {
      _osType = 'linux_mips64'
    }
    else if (process.arch === 'x64') {
      _osType = 'linux_x64'
    }
  }
}
exports.osType = _osType
exports.isWindows = _isWindows
exports.isMacintosh = _isMacintosh
exports.isLinux = _isLinux
exports.isNative = _isNative
exports.isWeb = _isWeb
exports.isIOS = _isIOS
exports.platform = _platform
exports.userAgent = _userAgent
exports.osDetail = _osDetail
function isRootUser() {
  return _isNative && !_isWindows && process.getuid() === 0
}
exports.isRootUser = isRootUser
/**
 * The language used for the user interface. The format of
 * the string is all lower case (e.g. zh-tw for Traditional
 * Chinese)
 */
exports.language = _language
/**
 * The OS locale or the locale specified by --locale. The format of
 * the string is all lower case (e.g. zh-tw for Traditional
 * Chinese). The UI is not necessarily shown in the provided locale.
 */
exports.locale = _locale
let OperatingSystem;
(function (OperatingSystem) {
  OperatingSystem[OperatingSystem['Windows'] = 1] = 'Windows'
  OperatingSystem[OperatingSystem['Macintosh'] = 2] = 'Macintosh'
  OperatingSystem[OperatingSystem['Linux'] = 3] = 'Linux'
})(OperatingSystem = exports.OperatingSystem || (exports.OperatingSystem = {}))
exports.OS = _isMacintosh
  ? OperatingSystem.Macintosh
  : _isWindows
    ? OperatingSystem.Windows
    : OperatingSystem.Linux
let _isLittleEndian = true
let _isLittleEndianComputed = false
function isLittleEndian() {
  if (!_isLittleEndianComputed) {
    _isLittleEndianComputed = true
    const test = new Uint8Array(2)
    test[0] = 1
    test[1] = 2
    const view = new Uint16Array(test.buffer)
    _isLittleEndian = view[0] === (2 << 8) + 1
  }
  return _isLittleEndian
}
exports.isLittleEndian = isLittleEndian
// # sourceMappingURL=platform.js.map