import { isEqual, fill } from 'lodash';
import { fakeServer, useFakeXMLHttpRequest } from 'sinon';

/**
 * 服务器模拟工厂函数
 * @param handler 接受一个sinon.fakeServer实例作为参数，可以通过调用该实力上的方法来设定一组接口
 * @return 返回一个包含start/stop方法的对象
 */
export default function FakeServerFactory(handler: (fakeServer: any) => any) {
    let server;

    return {
        /**
         * 开启服务模拟
         */
        start() {
            server = fakeServer.create({
                autoRespond: true
            });

            handler(server);
        },

        /**
         * 停止服务模拟
         */
        stop() {
            server.restore()
        }
    }
}

/**
 * 简单的请求匹配
 * @param request 请求对象
 * @param param1 要匹配的值
 * @param param1.url 要匹配的url
 * @param param1.body 要匹配的参数对象
 */
export function matchRequest(request, { method, url, body }: { method?: string, url?: string | RegExp, body?: { [key: string]: any } }): boolean {
    const { method: requestMethod, url: requestUrl, requestBody } = request;

    if (method) {
        if (method !== requestMethod) {
            return false
        }
    }

    if (url) {
        if (url instanceof RegExp && !url.test(requestUrl)) {
            return false
        } else if (typeof url === 'string' && url !== requestUrl) {
            return false
        }
    }

    if (body) {
        if (!isEqual(body, JSON.parse(requestBody))) {
            return false
        }
    }

    return true;
}


/**
 * 使用fakeXMLHttpRequest
 * @param callback 回调函数，接受请求对象作为参数
 */
export function useFakeXHR(callback) {
    const fakeXHR = useFakeXMLHttpRequest();
    const requests: Array<any> = []; // requests会将引用传递给callback，因此使用const，避免指针被改写。

    fakeXHR.onCreate = request => requests.push(request);

    callback(requests, fakeXHR.restore.bind(fakeXHR));
}

interface Respond {
    status: number, // 响应状态
    headers: object|null, // 请求头对象
    body: string; // 响应体
}
/**
 * 轮询监听请求，按序返回响应
 * @export
 * @param {any} requests 请求对象
 * @param {Array<Respond>} respondList 响应队列
 * 
 */
export function respondQueue(requests, respondList: Array<Respond>) {
    let respondFlag = fill(Array(respondList.length), false);
    let intervalId = setInterval(() => {
        respondList.forEach((respond, index) => {
            if (requests.length === (index + 1) && respondFlag[index] !== true) {
                requests[index].respond(respond.status, respond.headers, respond.body);
                respondFlag[index] = true;
                if (respondList.length === requests.length) {
                    clearInterval(intervalId);
                }
            }
        });
    }, 20);
}