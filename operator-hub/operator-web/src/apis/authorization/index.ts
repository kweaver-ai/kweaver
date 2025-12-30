import { post } from '@/utils/http';

const apis = {
  operationCheck: '/api/authorization/v1/operation-check',
  resourceOperation: '/api/authorization/v1/resource-operation',
  resourceTypeOperation: '/api/authorization/v1/resource-type-operation',
};

export function postOperationCheck(data: any) {
  return post(`${apis.operationCheck}`, { body: data });
}

export function postResourceOperation(data: any) {
  return post(`${apis.resourceOperation}`, { body: data });
}

export function postResourceTypeOperation(data: any) {
  return post(`${apis.resourceTypeOperation}`, { body: data });
}
