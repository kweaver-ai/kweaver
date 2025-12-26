import API from '@/services/api';
import Request from '@/services/request';

import type SmallModelType from './type';

/** 添加小模型 */
const smallModelAdd: any = async (data: SmallModelType.SmallModelAddType) => await Request.post(API.smallModelAdd, data);

/** 编辑小模型 */
const smallModelEdit: any = async (data: SmallModelType.SmallModelEditType) => await Request.post(API.smallModelEdit, data);

/** 获取小模型配置 */
const smallModelGetDetail: any = async (data: SmallModelType.SmallModelGetDetailType) => await Request.get(API.smallModelGetDetail, data);

/** 获取小模型列表 */
const smallModelGetList: any = async (data: SmallModelType.SmallModelGetListType) => await Request.get(API.smallModelGetList, data);

/** 删除小模型 */
const smallModelDelete: any = async (data: SmallModelType.SmallModelDeleteType) => await Request.post(API.smallModelDelete, data);

/** 测试小模型 */
const smallModelTest: any = async (data: any) => await Request.post(API.smallModelTest, data);

export default {
  smallModelAdd,
  smallModelEdit,
  smallModelGetDetail,
  smallModelGetList,
  smallModelDelete,
  smallModelTest,
};
