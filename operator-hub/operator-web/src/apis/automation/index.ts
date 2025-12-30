import { get, post } from '@/utils/http';

const apis = {
  operators: '/api/automation/v1/operators',
  dags: '/api/automation/v1/dag',
};

export function getOperators(params: any) {
  return get(`${apis.operators}`, { params });
}
export function getDags(id: string) {
  return get(`${apis.dags}/${id}`);
}

export function postExecutions(id: string, data: any) {
  return post(`${apis.operators}/${id}/executions`, { body: data });
}
