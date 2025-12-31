import { fromJS } from 'immutable';

const CHANGE_API_LOADING = 'home/change_api_loading';
const CHANGE_COLLAPSED = 'home/change_collapsed';
const FETCH_PERMISSION_LIST = 'home/fetch_permission_list';
const FETCH_PERMISSION_DATA = 'home/fetch_permission_data';
const FETCH_SYSTEM_CONFIG_LIST = 'home/fetch_system_config_list';
const CHANGE_SYSTEM_TIMEOUT = 'home/change_system_timeout';
const CHANGE_SYSTEM_ARCH = 'home/change_system_arch';

const changeApiLoading = (data) => ({
  type: CHANGE_API_LOADING,
  data: fromJS(data),
});

const changeCollapsed = () => ({
  type: CHANGE_COLLAPSED,
});

const fetchPermissionList = () => ({
  type: FETCH_PERMISSION_LIST,
});

const fetchPermissionData = (data) => ({
  type: FETCH_PERMISSION_DATA,
  data: fromJS(data),
});

const fetchSystemConfigList = () => ({
  type: FETCH_SYSTEM_CONFIG_LIST,
});

const changeSystemTimeout = (data) => ({
  type: CHANGE_SYSTEM_TIMEOUT,
  data: fromJS(data),
});

const changeSystemArch = (data) => ({
  type: CHANGE_SYSTEM_ARCH,
  data: fromJS(data),
});

export { changeApiLoading, changeCollapsed, fetchPermissionList, fetchPermissionData, fetchSystemConfigList, changeSystemTimeout, changeSystemArch };
