import { arNotification } from '@/components/ARNotification';

const handleResponseError = (response: any): Promise<any> => {
  // 主错误字符串为（资源，权限，账户，需要查看错误码）,ERROR_CODE其他主错误字符串不展示错误码。
  const ERROR_CODE = ['AuthenticationError', 'Insufficient', 'InvalidAccountStatus', 'NoPermission', 'NotFound', 'QuotaExceed'];
  // 生产code唯一标识符
  const code: any = response.data.error_code;
  // 是否不需要提示，默认false
  const isNoHint = response.config?.isNoHint || false;
  const needMsg = response.data.needMsg || false; // 异常判断字段，类型为Boolean，为false时按原方式处理,为true时抛出message
  response.data.code = code;
  response.data.message = response.data?.description;
  response.data.data = response.data?.error_details;

  if (!isNoHint) {
    const description = needMsg ? response.data.message : '';
    const detailCode = ERROR_CODE.includes(code.split('.')[1]);

    arNotification.error({
      description,
      detail: detailCode ? code.split('').join('­­') : '', // json('')不是空，是一个英文换行的链接符，在vscode中显示不出来
    });
  }

  return Promise.resolve(response);
};

export default handleResponseError;
