import moment from "moment";

export function formatNumber(num: number = 0) {
  if (num >= 100000000) {
    // 1亿以上用“y”
    return (num / 100000000).toFixed(1) + "y";
  } else if (num >= 10000) {
    // 1万以上用“w”
    return (num / 10000).toFixed(1) + "w";
  } else if (num >= 1000) {
    // 1千以上用“k”
    return (num / 1000).toFixed(1) + "k";
  } else {
    return num.toLocaleString(); // 千位分隔符
  }
}

export function formatDate(timestamp?: number, format = "YYYY-MM-DD HH:mm:ss") {
    if (!timestamp) {
        return "";
    }
    return moment(timestamp*1000).format(format);
};
