import { request } from "../../tools/request";

class Oauth2Ui {
    url = "/oauth2";

    getLoginHeight(): Promise<{ height: number }> {
        return request.get(`${this.url}/iframe-size`);
    }
}

export const oauth2Ui = new Oauth2Ui();
