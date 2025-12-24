import { RegistryInfo } from "../../api/workstation-backend/declare";

// 存储token信息
class TokenStore {
    _isRefreshingToken: boolean;
    _microWidgetNeedRefreshAPiQueue: any[];
    constructor() {
        this._isRefreshingToken = false;
        this._microWidgetNeedRefreshAPiQueue = [];
    }

    get isRefreshingToken() {
        return this._isRefreshingToken;
    }

    set isRefreshingToken(isRefreshingToken: boolean) {
        this._isRefreshingToken = isRefreshingToken;
    }

    get microWidgetNeedRefreshAPiQueue() {
        return this._microWidgetNeedRefreshAPiQueue;
    }

    set microWidgetNeedRefreshAPiQueue(newArray) {
        this._microWidgetNeedRefreshAPiQueue = newArray;
    }
}

// 存储插件信息
class MicroWidgetInfosStore {
    _microWidgetInfos: RegistryInfo[];
    constructor() {
        this._microWidgetInfos = [];
    }

    get microWidgetInfos() {
        return this._microWidgetInfos;
    }

    set microWidgetInfos(microWidgetInfos: RegistryInfo[]) {
        this._microWidgetInfos = microWidgetInfos;
    }
}

export const tokenStore = new TokenStore();
export const microWidgetInfosStore = new MicroWidgetInfosStore();
