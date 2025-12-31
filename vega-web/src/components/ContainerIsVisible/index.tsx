type ContainerIsHideType = {
  visible?: boolean;
  placeholder?: any;
  children: JSX.Element;
};

export const PERMISSION_CODES = {
  CREATE: 'create',
  DELETE: 'delete',
  VIEW: 'view_detail',
  QUERY: 'data_query',
  MODIFY: 'modify',
  AUTHORIZE: 'authorize',
  IMPORT: 'import',
  EXPORT: 'export',
  MOVE: 'move',
  SACN: 'scan',
  RULE_MANAGE: 'rule_manage',
  RULE_AUTHORIZE: 'rule_authorize',
};

export interface TUserPermissionOperation {
  operation: string[];
  resource_type: string;
}

export const matchPermission = (code: string, permissionCodes?: string[]): boolean => {
  const newAry = permissionCodes || [];

  return newAry.includes(code);
};

export const getTypePermissionOperation = (type: string, userPermissionOperation?: TUserPermissionOperation[]): string[] => {
  let curUserPermissionOperation: TUserPermissionOperation[] = userPermissionOperation || [];

  if (!userPermissionOperation) {
    curUserPermissionOperation = JSON.parse(sessionStorage.getItem('vega.userPermissionOperation') || '[]');
  }
  const cur = curUserPermissionOperation.find((val) => val.resource_type === type)?.operation || [];

  return cur;
};

const ContainerIsVisible = (props: Omit<ContainerIsHideType, 'visible' | 'placeholder'>): JSX.Element => {
  return props.children;
};

export default (props: ContainerIsHideType): JSX.Element => {
  const { visible, placeholder, ...other } = props;

  if (!visible) return placeholder || null;

  return ContainerIsVisible(other);
};
