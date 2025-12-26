import downloadFile from './downloadFile';
import { isNumberAndParseInt, formatFileSize, formatNumberWithComma, formatNumberWithSuffix } from './formatNumber';
import formatQueryString from './formatQueryString';
import getLengthFromString from './getLengthFromString';
import getPositionBaseTwoPoint from './getPositionBaseTwoPoint';
import { getRandomString, getRuleString } from './getRandomString';
import getValueBasedOnLanguage from './getValueBasedOnLanguage';
import headerAddBusinessId from './headerAddBusinessId';
import hexToRgba from './hexToRgba';
import { rgbaToHex } from './rgbaToHex';
import stringEllipsis from './stringEllipsis';
import scrollIntoContainer from './scrollIntoContainer';

const HELPER = {
  downloadFile,
  isNumberAndParseInt,
  formatFileSize,
  formatNumberWithComma,
  formatNumberWithSuffix,
  formatQueryString,
  getLengthFromString,
  getPositionBaseTwoPoint,
  getRandomString,
  getRuleString,
  getValueBasedOnLanguage,
  headerAddBusinessId,
  hexToRgba,
  rgbaToHex,
  stringEllipsis,
  scrollIntoContainer,
};

export default HELPER;
