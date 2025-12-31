import API from '@/services/api';
import Request from '@/services/request';
import EdgeType from './type';

/** 创建关系类 */
const edgePost = async (knId: string, data: EdgeType.EdgePostType): Promise<EdgeType.EdgePost_ResultType> => {
  return await Request.post(API.edgePost(knId), { entries: [data] }, { cancelTokenKey: 'edgePost' });
};

/** 删除关系类 */
const edgeDelete = async (knId: string, reIds: string[]) => {
  return await Request.delete(API.edgeDelete(knId, reIds.join(',')));
};

/** 修改关系类 */
const edgePut = async (knId: string, rtId: string, data: EdgeType.EdgePutType) => {
  return await Request.put(API.edgePut(knId, rtId), data, { cancelTokenKey: 'edgePut' });
};

/** 获取关系类列表 */
const edgeGet = async (knId: string, data: any): Promise<EdgeType.EdgeGet_ResultType> => {
  return await Request.get(API.edgeGet(knId), data);
};

/** 获取关系类详情 */
const edgeGetDetail = async (knId: string, rtId: string): Promise<EdgeType.EdgeGetDetail_ResultType> => {
  const response = await Request.get<{ entries: EdgeType.EdgeGetDetail_ResultType }>(API.edgeGetDetail(knId, rtId));
  return response.entries;
};

export default {
  edgePost,
  edgeDelete,
  edgePut,
  edgeGet,
  edgeGetDetail,
};
