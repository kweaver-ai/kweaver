import { apis, components } from '@aishu-tech/components/dist/dip-components.min.js';
import { baseConfig } from '@/services/request';

interface AuthorizationOptions {
  /** 弹窗标题 */
  title?: string;
  /** 资源名称 */
  resourceName?: string;
  /** 资源类型 */
  resourceType?: string;
  /** 权限选择器参数 */
  pickerParams?: {
    tabs: string[];
    range: string[];
    isAdmin: boolean;
    role: string;
  };
  /** 挂载节点ID */
  mountNodeId?: string;
}

/**
 * 权限管理弹窗组件
 */
export const useAuthorization = (options: AuthorizationOptions = {}) => {
  const {
    title = '权限配置',
    resourceName = '权限配置',
    resourceType = '',
    pickerParams = {
      tabs: ['organization', 'group', 'app'],
      range: ['user', 'department', 'group', 'app'],
      isAdmin: false,
      role: 'normal_user',
    },
    mountNodeId = '',
  } = options;

  baseConfig?.roles.forEach((item) => {
    if (item?.id !== '7dcfcc9c-ad02-11e8-aa06-000c29358ad6') return;
    pickerParams.isAdmin = true;
    pickerParams.role = 'super_admin';
  });

  /** 打开权限管理弹窗 */
  const openModal = (id: string) => {
    // 挂载权限配置组件
    const unmount = apis.mountComponent(
      components.PermConfig,
      {
        title,
        resource: { id, name: resourceName, type: resourceType },
        pickerParams,
        onCancel: () => {
          unmount();
        },
      },
      // 弹框挂载节点
      document.getElementById(mountNodeId)
    );
  };

  return {
    openModal,
  };
};

export default useAuthorization;
