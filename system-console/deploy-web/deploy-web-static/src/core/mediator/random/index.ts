/**
 * 该函数返回随机数
 * @param start 所返回整数区间的起始值。
 * @param end 所返回整数区间的结尾值。
 * @param decPlaces 当返回[0, 1)之间的小数时，指定返回数字的小数位数，此时函数调用形式为getRandom(0, 1, decPlaces),
 * 取值范围为[1, 10]之间整数，默认为1，即一位小数，当传入数字小于1，取1，大于10，取10。
 */
export function getRandom(
    start: number = 0,
    end: number = 1,
    decPlaces: number = 1
): number {
    const cryptoObj = window.crypto || (window as any).msCrypto;
    const random = cryptoObj.getRandomValues(new Uint32Array(1))[0];

    let speed: number;

    // 如果 start = 0， end = 1，则返回[0, 1)之间的小数；否则返回[start, end)之间的整数。
    if (end === 1 && start === 0) {
        decPlaces =
            decPlaces >= 1 && decPlaces <= 10
                ? decPlaces
                : decPlaces > 10
                ? 10
                : 1;
        decPlaces = Math.pow(10, decPlaces);
        speed = (random % decPlaces) / decPlaces;
    } else {
        speed = random % (end - start);
    }

    return start + speed;
}
