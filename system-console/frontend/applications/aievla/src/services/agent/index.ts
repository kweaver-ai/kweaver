import { message } from 'antd';

import { API } from '../api';
import HELPER from '@/utils/helper';
import studioAxios from '@/utils/axios-http/studioAxios';

const commonHeaders = { headers: {} };

const handleCommonError = (err: any) => {
  const { ErrorDetails } = err?.response || err?.data || err || {};
  ErrorDetails && message.error(ErrorDetails);
};

/** 获取agent 列表 */
export const getAgentList = async (data: any) => {
  try {
    const headers: any = HELPER.headerAddBusinessId();
    const result: any = (await studioAxios.axiosGet(`${API.agentGetListV3}`, { ...data }, headers)) || {};
    return result || true;
  } catch (err) {
    handleCommonError(err);
    return false;
  }
};
