import { useMemo, useEffect, useReducer } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { apis } from '@aishu-tech/components/dist/dip-components.min.js';
import { message, ConfigProvider, type ThemeConfig } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

import UTILS from '@/utils';
import HOOKS from '@/hooks';
import locales from '@/locales';
import { Modal } from '@/common';

import THEME from '@/theme.ts';
import { prefixCls } from '@/variable';
import '@aishu-tech/components/dist/dip-components.min.css';

import Prompt from '@/pages/Prompt'; // 提示词
import ModelManagement from '@/pages/ModelManagement'; // 模型管理
import ModelQuota from '@/pages/ModelQuota'; // 配额管理
import ModelDefault from '@/pages/ModelDefault'; // 默认模型
import ModelStatistics from '@/pages/ModelStatistics'; // 模型统计

// ✓ 1、location 前缀
// ✓ 2、token失效后的表现
const App = (props: any) => {
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const { lang: language = 'zh-cn', container } = props;

  intl.init({ currentLocale: language, locales, warningHandler: () => '' });

  useEffect(() => {
    message.config({
      prefixCls: `${prefixCls}-ant-message`,
      top: 32,
      maxCount: 1,
      getContainer: () => document.getElementById('mf-model-manager-root') || container,
    });
    UTILS.initMessage(messageApi);

    // as 组件配置
    const { protocol = 'https:', host = location.hostname, port = 443, lang, token, prefix = '', oemConfigs } = props;
    const config = {
      protocol,
      host,
      port,
      lang,
      getToken: () => token?.getToken.access_token,
      prefix,
      theme: oemConfigs.theme,
      popupContainer: document.getElementById('mf-model-manager-root'),
      refreshToken: token?.refreshOauth2Token,
      onTokenExpired: token?.onTokenExpired,
    };
    apis.setup(config);
  }, []);

  const [store, dispatch] = useReducer(HOOKS.globalConfigReduce, _.cloneDeep(HOOKS.globalInitData)); // 之前的

  /** 主题色 */
  const theme = useMemo(() => {
    if (!props?.oemConfigs?.theme) return THEME;
    const result = _.cloneDeep(THEME);
    result.token.colorPrimary = props?.oemConfigs?.theme;
    return result;
  }, [props?.oemConfigs?.theme]);

  /** url */
  const baseUrl = useMemo(() => {
    if (!props?.history?.getBasePath) return '';
    const name = `/${props?.name}`;
    return _.split(props?.history?.getBasePath, name)?.[0] || '';
  }, [props?.history?.getBasePath]);

  return (
    <ConfigProvider
      locale={language === 'en-us' ? enUS : zhCN}
      wave={{ disabled: true }}
      theme={theme as ThemeConfig}
      prefixCls={`${prefixCls}-ant`}
      getPopupContainer={() => document.getElementById('mf-model-manager-root') || container}
      getTargetContainer={() => document.getElementById('mf-model-manager-root') || container}
    >
      <HOOKS.GlobalProvider value={{ store, dispatch, modal, message: messageApi, baseProps: props || {} }}>
        {modalContextHolder}
        {messageContextHolder}
        <BrowserRouter basename={(window as any).__POWERED_BY_QIANKUN__ ? baseUrl : ''}>
          <Routes>
            <Route path='/mf-model-manager/prompt/list1' element={<Prompt />} />
            <Route path='/mf-model-manager/model/list2' element={<ModelManagement />} />
            <Route path='/mf-model-manager/model/quota' element={<ModelQuota />} />
            <Route path='/mf-model-manager/model/default' element={<ModelDefault />} />
            <Route path='/mf-model-manager/model/statistics' element={<ModelStatistics />} />
            <Route path='*' element={<div>not fount</div>} />
          </Routes>
        </BrowserRouter>
      </HOOKS.GlobalProvider>
    </ConfigProvider>
  );
};

export default App;
