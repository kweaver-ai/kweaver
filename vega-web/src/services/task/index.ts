import { base_url_knowledge } from '@/services/api';
import Request from '@/services/request';
import TaskType from './type';

/** 创建任务 */
const taskPost = async (
  knId: string,
  data: {
    name: string;
    job_type: TaskType.JobType;
  }
): Promise<{ id: string }> => {
  return await Request.post(`${base_url_knowledge}/${knId}/jobs`, data);
};

/** 删除任务 */
const taskDelete = async (knId: string, taskId: string) => {
  return await Request.delete(`${base_url_knowledge}/${knId}/jobs/${taskId}`);
};

/** 获取任务列表 */
const taskGet = async (knId: string, params: any): Promise<TaskType.TaskList> => {
  return Request.get(`${base_url_knowledge}/${knId}/jobs`, params);
};

/** 获取任务详情 */
const taskGetDetail = async (knId: string, rtId: string, params: any): Promise<any> => {
  return await Request.get(`${base_url_knowledge}/${knId}/jobs/${rtId}/tasks`, params);
};

export default {
  taskPost,
  taskDelete,
  taskGet,
  taskGetDetail,
};
