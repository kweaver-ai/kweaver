import ReactDOM from 'react-dom/client';
import 'react-resizable/css/styles.css';
import frameworkProps from '@/utils/axios-http/frameworkProps';
import api from '@/services/authorization';
import { baseConfig } from '@/services/request';
import App from '@/pages/router';
import '@/public-path';
import '@/style/reset.less';
// eslint-disable-next-line import/order
import '@/style/global.less';
import UTILS from '@/utils';

const init = async () => {
  try {
    const userPermissionOperation = await api.authorizationGetResourceType();
    sessionStorage.setItem('vega.userPermissionOperation', JSON.stringify(userPermissionOperation || []));
  } catch (error) {
    console.log('error: 获取权限失败', error);
  }
};

let root: any;
const render = (props: any) => {
  const container = document.getElementById('vega-root');
  if (!container) return;

  root = root || ReactDOM.createRoot(container);
  root.render(<App {...props} />);
};

if (!(window as any).__POWERED_BY_QIANKUN__) {
  // 这里是为了本地调试时，有一个session的key做占位用
  if (!UTILS.SessionStorage.get('language')) UTILS.SessionStorage.set('language', 'zh-cn');
  if (!UTILS.SessionStorage.get('token')) UTILS.SessionStorage.set('token', '');
  if (!UTILS.SessionStorage.get('studio.userid', true)) UTILS.SessionStorage.set('studio.userid', '', true);

  baseConfig.lang = UTILS.SessionStorage.get('language') || 'zh-cn';
  baseConfig.token = UTILS.SessionStorage.get('token') || '';
  baseConfig.userid = UTILS.SessionStorage.get('studio.userid', true) || '';

  init().finally(() => {
    render({});
  });
}

export async function bootstrap(props: any) {
  baseConfig.lang = props?.lang;
  baseConfig.token = props?.token?.getToken?.access_token;
  baseConfig.userid = props?.userid;
  baseConfig.roles = props?.config?.userInfo?.user?.roles || [];
  baseConfig.refresh = props?.token?.refreshOauth2Token;
  UTILS.SessionStorage.set('language', props?.lang);
  UTILS.SessionStorage.set('token', props?.token?.getToken?.access_token);
}
export async function mount(props: any) {
  frameworkProps.data = props;
  await Promise.resolve();
  init().finally(() => {
    render(props);
  });
}
export async function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}
