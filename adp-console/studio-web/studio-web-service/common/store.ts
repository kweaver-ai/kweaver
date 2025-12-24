interface Cache {
    [index: string]: any;
}

class Store {
    cache: Cache = {};

    constructor() {}

    /**
     * 获取数据
     * @param dataName 数据名称
     * @returns
     */
    getData(dataName: string) {
        return this.cache[dataName];
    }

    /**
     * 更新数据
     * @param dataName 数据名称
     * @param data 数据
     */
    updateData(dataName: string, data: any) {
        this.cache[dataName] = data;
    }

    /**
     * 删除数据
     * @param dataName 数据名称
     */
    deleteData(dataName: string) {
        this.cache[dataName] = null;
        delete this.cache[dataName];
    }
}

export const store = new Store();
