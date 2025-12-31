import { formatKeyOfObjectToCamel, formatCamelToLine, formatKeyOfObjectToLine } from '../format-objectkey-structure';
import { axiosGet, axiosDelete, axiosPost, axiosPut, axiosPostOverrideDelete } from './index';

type Config = {
  isTransformRes?: boolean; // 是否执行将后端返回数据转前端数据
  isFormatRes?: boolean; // 将后端返回数据下划线转驼峰
  isTransformParams?: boolean; // 是否将参数数据转成后端数据
  isFormatParams?: boolean; // 将参数驼峰转下划线
  isInterceptError?: boolean;
  isNoHint?: boolean;
};

class Service {
  public url = '';

  public transformFrontToBack;

  public transformBackToFont;

  public mockDataObj;

  public formatKeyOfObjectToCamel;

  public formatKeyOfObjectToLine;

  public constructor(
    url?: string,
    transformFrontToBack?: (data: any) => object,
    transformBackToFront?: (data: any) => object,
    mockDataObj?: { [key: string]: any }
  ) {
    this.url = url || '';
    this.transformFrontToBack = transformFrontToBack;
    this.transformBackToFont = transformBackToFront;
    this.formatKeyOfObjectToCamel = formatKeyOfObjectToCamel;
    this.formatKeyOfObjectToLine = formatKeyOfObjectToLine;
    this.mockDataObj = mockDataObj;
  }

  private transformData = <T>(fnNameObj: any, data: any): T => {
    if (!data) {
      return data;
    }

    const fnArr = Object.keys(fnNameObj).filter((key) => fnNameObj[key]);

    if (data instanceof Array) {
      const newData: any = data.map((item) =>
        fnArr.reduce((prev, cur) => {
          return (this as any)[cur] ? (this as any)[cur](prev) : prev;
        }, item)
      );

      return newData;
    }

    return fnArr.reduce((prev, cur) => {
      return (this as any)[cur] ? (this as any)[cur](prev) : prev;
    }, data);
  };

  private proxyFn = async <T>({
    fn,
    url,
    params,
    mockDataKey,
    config = {
      isTransformRes: false,
      isInterceptError: true,
      isTransformParams: false,
      isFormatParams: false,
      isFormatRes: false,
    },
  }: {
    fn: (...params: any) => Promise<T>;
    url: any;
    params?: { [key: string]: any };
    mockDataKey: string;
    config?: Config;
  }): Promise<T> => {
    const { isInterceptError = true, isTransformRes, isFormatParams, isTransformParams, isFormatRes, ...restConfig } = config;

    const tranformParamsObj = {
      transformFrontToBack: isTransformParams,
      formatKeyOfObjectToLine: isFormatParams,
    };

    const res = (this.mockDataObj && this.mockDataObj[mockDataKey]) || (await fn(url, this.transformData(tranformParamsObj, params), restConfig));

    if (!isInterceptError) {
      return res;
    }

    if ((res as { code: string }).code) {
      return Promise.reject(res);
    }

    const tranformResObj = {
      formatKeyOfObjectToCamel: isFormatRes,
      transformBackToFont: isTransformRes,
    };

    return this.transformData(tranformResObj, res);
  };

  public deleteData = async <T>(id: string | string[]): Promise<T> => {
    const ids = Array.isArray(id) ? id.join(',') : id;

    return await this.proxyFn({
      fn: axiosDelete,
      url: `${this.url}/${ids}`,
      mockDataKey: 'deleteData',
    });
  };

  public deleteDataByOverride = async <T>(id: string | string[]): Promise<T> => {
    return await this.proxyFn({
      fn: axiosPostOverrideDelete,
      url: this.url,
      mockDataKey: 'deleteDataByOverride',
      params: { ids: Array.isArray(id) ? id.join(',') : id },
    });
  };

  public updateData = async <T>(data: any, id: any): Promise<T> => {
    return await this.proxyFn({
      fn: axiosPut,
      url: `${this.url}/${id}`,
      mockDataKey: 'updateData',
      params: data,
      config: {
        isFormatParams: true,
        isTransformParams: true,
      },
    });
  };

  public createData = async <T>(data: any): Promise<T> => {
    return await this.proxyFn({
      fn: axiosPost,
      url: this.url,
      mockDataKey: 'createData',
      params: data,
      config: {
        isFormatParams: true,
        isTransformParams: true,
      },
    });
  };

  public importData = async <T>(data: any): Promise<T> => {
    return await this.proxyFn({
      fn: axiosPost,
      url: this.url,
      mockDataKey: 'importData',
      params: data,
    });
  };

  public getDataList = async <T>(
    {
      limit,
      offset,
      name = '',
      direction = 'desc',
      sort = 'update_time',

      filters = {},
      ...params
    }: any,
    config?: { isTransformRes: boolean }
  ): Promise<{ entries: T[]; totalCount: number }> => {
    const filterParams = Object.keys(filters || {}).reduce((prev: any, key) => {
      prev[key] = filters[key].join(',');

      return prev;
    }, {});

    const restParams = Object.keys(params || {}).reduce((prev: any, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        prev[formatCamelToLine(key)] = params[key];
      }

      return prev;
    }, {});

    return await this.proxyFn({
      fn: axiosGet,
      url: this.url,
      params: {
        params: {
          name_pattern: name,
          offset,
          limit,
          direction,
          ...filterParams,
          ...restParams,
          sort: formatCamelToLine(sort),
        },
      },
      mockDataKey: 'getDataList',
      config: {
        isFormatRes: true,
        ...config,
      },
    });
  };

  public getDataDetail = async <T>(id: string | string[], _?: any, config?: { isInterceptError?: boolean }): Promise<T> => {
    return await this.proxyFn({
      fn: axiosGet,
      url: `${this.url}/${Array.isArray(id) ? id.join(',') : id}`,
      mockDataKey: 'getDataDetail',
      config: {
        isFormatRes: true,
        isTransformRes: true,
        ...config,
      },
    });
  };

  public exportData = async <T>(id: string[]): Promise<T> => {
    return await this.proxyFn({
      fn: axiosGet,
      url: `${this.url}/${id.join(',')}`,
      mockDataKey: 'exportData',
    });
  };

  public requestData = async <T>({
    url,
    params,
    request,
    config,
  }: {
    url: string;
    params?: { [key: string]: any };
    request: (...params: any) => any;
    config?: Config;
  }): Promise<T> => {
    return await this.proxyFn({
      fn: request,
      url,
      params,
      mockDataKey: url,
      config: {
        isFormatParams: true,
        isFormatRes: true,
        ...config,
      },
    });
  };
}

export default Service;
