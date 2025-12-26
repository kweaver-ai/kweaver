/**
 * @description 抽屉组件，对 Antd 的 Drawer 组件进行拓展
 */
import classNames from 'classnames';
import { Button, Drawer as AntdDrawer, type DrawerProps as AntdDrawerProps } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

import styles from './index.module.less';

export const CustomDrawer: React.FC<AntdDrawerProps> = props => {
  return (
    <AntdDrawer className={classNames(styles['common-drawer'], props.className)} maskClosable={false} destroyOnHidden={true} {...props} closeIcon={null}>
      {(props.closable ?? true) && (
        <Button
          className={styles['common-drawer-close-button']}
          color='default'
          variant='text'
          icon={props.closeIcon || <CloseOutlined />}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            if (props.onClose) props.onClose(event);
          }}
        />
      )}
      {props.children}
    </AntdDrawer>
  );
};

export type DrawerProps = typeof CustomDrawer & {};

const Drawer = Object.assign(CustomDrawer, {}) as DrawerProps;

export default Drawer;
