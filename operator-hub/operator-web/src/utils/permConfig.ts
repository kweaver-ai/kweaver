import { apis, components } from '@aishu-tech/components/dist/dip-components.min';
import { getRoleByUserInfo } from '@/utils/role';

export const componentsPermConfig = (resource: any, microWidgetProps: any) => {
  const { isAdmin, roleType } = getRoleByUserInfo(microWidgetProps?.config?.userInfo);

  const accessorPicker = apis.mountComponent(
    components.PermConfig,
    {
      resource,
      // title: "选择范围",
      pickerParams: {
        tabs: ['organization', 'group', 'app'],
        range: ['user', 'department', 'group', 'app'],
        // 是否为管理员
        isAdmin,
        // 管理员角色
        role: roleType,
      },
      onCancel: () => {
        accessorPicker();
      },
    },
    document.createElement('div')
  );
};

export const transformArray = (arr: any) => {
  return arr.reduce((acc: any, { resource_type, operation }: any) => {
    acc[resource_type] = operation;
    return acc;
  }, {});
};
