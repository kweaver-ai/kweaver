import { access } from "../accessor";
import { Modules } from "../../../api/module-config";

let Timer: Array<any> = [];

const Config = {
    [Modules.LoginTimePolicy]: 0,
};

/**
 * 配置config
 * @param config 配置
 */
export function setup(...config: any[]) {
    access(Config, ...config);
}

/**
 * 获取config
 * @returns config
 */
export function get() {
    return Config;
}

/**
 * 定时器
 * @param fn 回调
 */
export function resetTimer(fn: () => any) {
    /**
     * 重置定时器
     */
    if (Timer.length) {
        for (let count = 0; count < Timer.length; count++) {
            clearTimeout(Timer[count]);
        }
        Timer = [];
    }

    const logouttime = Config[Modules.LoginTimePolicy];

    if (logouttime > 0) {
        // time 单位为分钟，转为毫秒
        Timer.push(
            setTimeout(() => {
                fn();
            }, Math.min(Math.pow(2, 31), logouttime * 60 * 1000))
        );
    } else if (logouttime === -1 || logouttime === 0) {
        if (Timer.length) {
            for (let count = 0; count < Timer.length; count++) {
                clearTimeout(Timer[count]);
            }
            Timer = [];
        }
    }
}
