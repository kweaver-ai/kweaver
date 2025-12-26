import { useMemo, useEffect, useReducer } from 'react';
import _ from 'lodash';
import dayjs from 'dayjs';
import intl from 'react-intl-universal';
import { apis } from '@aishu-tech/components/dist/dip-components.min.js';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { message, ConfigProvider, type ThemeConfig } from 'antd';

import antd_locale_zh_cN from 'antd/lib/locale/zh_CN';
import antd_locale_en_uS from 'antd/lib/locale/en_US';

import HOOKS from '@/hooks';
import locales from '@/locales';
import { Modal } from '@/common';

import THEME from '@/theme.ts';
import { prefixCls } from '@/variable';
import '@aishu-tech/components/dist/dip-components.min.css';

import BusinessDomainManagement from './BusinessDomainManagement';

/**  ✓ */
intl.init({ currentLocale: 'zh-cn', locales, warningHandler: () => '' });
const App = (props: any) => {
  const [modal, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();
  const { lang: language = 'zh-cn', container } = props;

  useEffect(() => {
    dayjs.locale(language);
    message.config({
      top: 32,
      maxCount: 1,
      getContainer: () => document.getElementById(`${prefixCls}-root`) || container,
    });
    intl.init({ currentLocale: language, locales, warningHandler: () => '' });

    // as 组件配置
    if ((window as any).__POWERED_BY_QIANKUN__) {
      const { protocol = 'https:', host = location.hostname, port = 443, lang, token, prefix = '', oemConfigs } = props;
      const config = {
        protocol,
        host,
        port,
        lang,
        getToken: () => token?.getToken.access_token,
        prefix,
        theme: oemConfigs?.theme,
        popupContainer: document.getElementById(`${prefixCls}-root`),
        refreshToken: token?.refreshOauth2Token,
        onTokenExpired: token?.onTokenExpired,
      };
      apis.setup(config);
    }
  }, []);
  /** 主题色 */
  const theme = useMemo(() => {
    if (!props?.oemConfigs?.theme) return THEME;
    const result = _.cloneDeep(THEME);
    result.token.colorInfo = props?.oemConfigs?.theme;
    result.token.colorPrimary = props?.oemConfigs?.theme;
    return result;
  }, [props?.oemConfigs?.theme]);

  /** url */
  const baseUrl = useMemo(() => {
    if (!props?.history?.getBasePath) return '';
    const name = `/${props?.name}`;
    return _.split(props?.history?.getBasePath, name)?.[0] || '';
  }, [props?.history?.getBasePath]);
  console.log('home', props);

  const [store, dispatch] = useReducer(HOOKS.globalConfigReduce, _.cloneDeep(HOOKS.globalInitData));

  return (
    <ConfigProvider
      locale={language === 'en-us' ? antd_locale_en_uS : antd_locale_zh_cN}
      wave={{ disabled: true }}
      theme={theme as ThemeConfig}
      getPopupContainer={() => document.getElementById(`${prefixCls}-root`) || container}
      getTargetContainer={() => document.getElementById(`${prefixCls}-root`) || container}
    >
      <HOOKS.GlobalProvider value={{ store, dispatch, modal, message: messageApi, baseProps: props || {} }}>
        {modalContextHolder}
        {messageContextHolder}
        <Router basename={(window as any).__POWERED_BY_QIANKUN__ ? baseUrl : ''}>
          <Switch>
            <Route exact path='/management/list' render={() => <BusinessDomainManagement />} />
            <Route render={() => <div>not found</div>} />
          </Switch>
        </Router>
      </HOOKS.GlobalProvider>
    </ConfigProvider>
  );
};

export default App;
