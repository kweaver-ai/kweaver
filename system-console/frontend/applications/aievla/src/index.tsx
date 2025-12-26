import './public-path';
import moment from 'moment';
import 'moment/locale/zh-cn';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import App from '@/pages/router';
import store from '@/reduxConfig/store';
import setPrototypeOf from 'setprototypeof';

import 'antd/dist/antd.variable.min.css';
import '@/assets/style/common.less';
import '@/theme/overwriteAntd.less';
import '@/global.less';
import '@/assets/graphIcons/iconfont.css';
import '@/assets/graphIconsMore/iconfont.css';
import { sessionStore } from '@/utils/handleFunction';
import { baseConfig } from '@/utils/axios-http/studioAxios';

moment.locale('zh-cn');
Object.setPrototypeOf = setPrototypeOf;

// const originalError = console.error;
// console.error = (...args) => {
//   if (
//     args[0].includes(
//       'Warning: React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.%s'
//     ) &&
//     process.env.NODE_ENV === 'development'
//   ) {
//     return;
//   }

//   originalError(...args);
// };

let root: any;
const render = (props: any) => {
  const container = document.getElementById('aievla-root');
  if (!container) return;

  root = root || ReactDOM.createRoot(container);
  root.render(
    <Provider store={store}>
      <App {...props} />
    </Provider>,
  );
};

if (!(window as any).__POWERED_BY_QIANKUN__) {
  if (!sessionStore.get('token')) sessionStore.set('token', '');
  render({});
}
export async function bootstrap(props: any) {
  console.log('aievla bootstrap', props);
}
export async function mount(props: any) {
  await Promise.resolve();
  console.log('[aievla] 挂载到容器', props);
  baseConfig.lang = props?.lang;
  baseConfig.token = props?.token?.getToken?.access_token;
  baseConfig.refresh = props?.token?.refreshOauth2Token;
  sessionStore.set('token', props?.token?.getToken?.access_token);
  render(props);
}
export async function unmount() {
  console.log('[aievla] 卸载');
  if (root) {
    root.unmount();
    root = null;
  }
}
