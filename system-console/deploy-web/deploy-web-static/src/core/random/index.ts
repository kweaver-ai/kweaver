import { getRandom } from "../mediator";

/**
 * 产生随机数
 */
export function generateRandom(length: number): string {
    let pwdType,
        rdmStr = "";

    while (rdmStr.length < length - 3) {
        pwdType = Math.floor(getRandom(0, 1, 2) * 10) % 3;
        if (pwdType === 0) {
            rdmStr += Math.floor(getRandom(0, 1, 2) * 10);
        } else if (pwdType === 1) {
            rdmStr += String.fromCharCode(
                ((Math.floor(getRandom(0, 1, 3) * 100) + 4) % 26) + 65
            );
        } else {
            rdmStr += String.fromCharCode(
                ((Math.floor(getRandom(0, 1, 3) * 100) + 4) % 26) + 97
            );
        }
    }
    rdmStr += Math.floor(getRandom(0, 1, 2) * 10);
    rdmStr += String.fromCharCode(
        ((Math.floor(getRandom(0, 1, 3) * 100) + 4) % 26) + 65
    );
    rdmStr += String.fromCharCode(
        ((Math.floor(getRandom(0, 1, 3) * 100) + 4) % 26) + 97
    );

    return rdmStr
        .split("")
        .sort(function () {
            if (getRandom(0, 1, 1) > 0.5) {
                return 1;
            } else {
                return -1;
            }
        })
        .join("");
}
