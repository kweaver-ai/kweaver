import React from 'react';
import { notification } from 'antd';
import { ArgsProps } from 'antd/lib/notification';
import getLocaleValue from '@/utils/get-locale-value';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';
import localeEn from './locale/en-US';
import localeZh from './locale/zh-CN';

notification.config({
  getContainer: () => document.getElementById('vega-root') as HTMLElement, // 子应用的根容器
});

export enum Type {
  success = 'success',
  info = 'info',
  error = 'error',
  warning = 'warning',
  open = 'open',
  warn = 'warn',
  close = 'close',
  config = 'config',
  destroy = 'destroy',
}
interface NotificationParams extends Omit<ArgsProps, 'type'> {
  type: Type;
  detail?: string;
}
class Collapse extends React.Component<Pick<NotificationParams, 'description' | 'detail' | 'message'>, { isShow: boolean }> {
  public state = {
    isShow: false,
  };

  public onClick = (): void => {
    this.setState((preState) => ({ isShow: !preState.isShow }));
  };

  public render(): JSX.Element {
    const { detail, description, message } = this.props;
    const { isShow } = this.state;

    return (
      <div className={`${styles['notification-common-detail']}  ${!message && styles['notification-no-message']}`}>
        <p className={styles['notification-description']}>{description}</p>
        {!!detail && (
          <>
            <p onClick={this.onClick} className={styles['detail-title']}>
              {getLocaleValue('detail', { localeZh }, { localeEn })}
              <span id="notification-detail-icon" className={`${isShow ? styles['icon-collapse-open'] : styles['icon-collapse-close']}`}>
                <IconFont type="icon-down"></IconFont>
              </span>
            </p>
            <div id="notification-detail-content" className={`${isShow ? styles['detail-content-show'] : styles['detail-content-hide']}`}>
              {detail}
            </div>
          </>
        )}
      </div>
    );
  }
}

/**
 * @description 调用notification组件
 * @param {object} params notification参数
 * @returns {*} void
 */
const getNotification = (params: NotificationParams | any): void => {
  const { type, message, description, detail, ...rest } = params as NotificationParams;

  (notification as any)[type as any]?.({
    ...rest,
    message,
    description: !!description && <Collapse description={description} message={message} detail={detail}></Collapse>,
  });
};

const arNotificationObj = {};

Object.values(Type).forEach((typeValue) => {
  (arNotificationObj as any)[typeValue] = (args: any): void => {
    // 当type为close时
    if (typeof args === 'string' && typeValue === Type.close) {
      (notification as any).close(args);
      return;
    }

    // 当type为 destroy 时
    if (typeValue === Type.destroy) {
      notification.destroy();
      return;
    }

    // 当传入的是字符串并且是成功的时候，传入参数为提示标题 message
    if (typeof args === 'string' && typeValue === Type.success) {
      getNotification({ type: typeValue, message: args });
      return;
    }

    // 当传入的是字符串，传入参数为提示标题 description
    if (typeof args === 'string') {
      getNotification({ type: typeValue, description: args, message: '' });
      return;
    }
    getNotification({ type: typeValue, ...args });
  };
});

export type Args = (Omit<ArgsProps, 'message'> & { detail?: string; message?: string }) | string;

// arNotification的api接口定义
export interface NotificationApi {
  success: (args: Args) => void;
  error: (args: Args) => void;
  info: (args: Args) => void;
  warning: (args: Args) => void;
  config: (options: any) => void;
}

export const arNotification = arNotificationObj as NotificationApi;
