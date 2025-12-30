import { get, del, post, put } from '@/utils/http';
import type {
  BoxToolListResponse,
  GlobalToolListResponse,
  ToolListParams,
  FunctionExecuteRequest,
  FunctionExecuteResponse,
} from './type';

const apis = {
  operatorDel: '/api/agent-operator-integration/v1/operator/delete',
  operatorRegiste: '/api/agent-operator-integration/v1/operator/register',
  operatorList: '/api/agent-operator-integration/v1/operator/info/list',
  operatorInfo: '/api/agent-operator-integration/v1/operator/info',
  operatorStatus: '/api/agent-operator-integration/v1/operator/status',
  operatorCategory: '/api/agent-operator-integration/v1/operator/category',
  mcpSSE: '/api/agent-operator-integration/v1/mcp/parse/sse',
  mcp: '/api/agent-operator-integration/v1/mcp',
  mcpList: '/api/agent-operator-integration/v1/mcp/list',
  toolBox: '/api/agent-operator-integration/v1/tool-box',
  toolBoxList: '/api/agent-operator-integration/v1/tool-box/list',
  convertTool: '/api/agent-operator-integration/v1/operator/convert/tool',
  mcpMarketList: '/api/agent-operator-integration/v1/mcp/market',
  operatorMarketList: '/api/agent-operator-integration/v1/operator/market',
  toolBoxMarketList: '/api/agent-operator-integration/v1/tool-box/market',
  operatorDebug: '/api/agent-operator-integration/v1/operator/debug',
  mcpTools: '/api/agent-operator-integration/v1/mcp/proxy',
  toolBoxIntegrationBaseUrl: '/api/agent-operator-integration/v1',
  impexExport: '/api/agent-operator-integration/v1/impex/export',
  impexImport: '/api/agent-operator-integration/v1/impex/import',
};

export function getOperatorList(params: any) {
  return get(`${apis.operatorList}`, { params });
}

export function getOperatorMarketList(params: any) {
  return get(`${apis.operatorMarketList}`, { params });
}

export function getOperatorCategory() {
  return get(`${apis.operatorCategory}`);
}

export function getOperatorInfo(params: any) {
  return get(`${apis.operatorInfo}/${params?.operator_id}`, { params });
}

export function getOperatorInfoById(operatorId: string) {
  return get(`${apis.operatorInfo}/${operatorId}`);
}

export function getOperatorMarketInfo(params: any) {
  return get(`${apis.operatorMarketList}/${params?.operator_id}`, { params });
}

export function postOperatorInfo(data: any) {
  return post(`${apis.operatorInfo}`, { body: data });
}

export function delOperator(data: any) {
  return del(`${apis.operatorDel}`, { body: data });
}

export function postOperatorRegiste(data: any) {
  return post(`${apis.operatorRegiste}`, {
    body: data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// 注册算子-不限制headers
export function postOperatorRegisterWithoutHeader(data: any) {
  return post(`${apis.operatorRegiste}`, { body: data });
}

export function postOperatorStatus(data: any) {
  return post(`${apis.operatorStatus}`, { body: data });
}

export function operatorDebug(data: any) {
  return post(`${apis.operatorDebug}`, { body: data });
}

//mcp
export function mcpSSE(data: any) {
  return post(`${apis.mcpSSE}`, { body: data });
}

export function postMCP(data: any) {
  return post(`${apis.mcp}`, { body: data });
}

export function getMCPList(params: any) {
  return get(`${apis.mcpList}`, { params });
}

export function getMcpMarketList(params: any) {
  return get(`${apis.mcpMarketList}/list`, { params });
}

export function getMCP(params: any) {
  return get(`${apis.mcp}/${params?.mcp_id}`, { params });
}

export function getMCPMarket(params: any) {
  return get(`${apis.mcpMarketList}/${params?.mcp_id}`, { params });
}

export function putMCP(mcp_id: string, data: any) {
  return put(`${apis.mcp}/${mcp_id}`, { body: data });
}

export function delMCP(data: any) {
  return del(`${apis.mcp}/${data?.mcp_id}`, { body: data });
}

export function mapReleaseAction(mcp_id: string, data: any) {
  return post(`${apis.mcp}/${mcp_id}/status`, { body: data });
}

export function debugMcp(mcp_id: string, tool_name: string, data: any) {
  return post(`${apis.mcp}/${mcp_id}/tool/${tool_name}/debug`, { body: data });
}

export function getMcpTools(mcp_id: string) {
  return get(`${apis.mcpTools}/${mcp_id}/tools`);
}

//工具
export function postToolBox(data: any) {
  return post(`${apis.toolBox}`, { body: data });
}

export function editToolBox(box_id: string, data: any) {
  return post(`${apis.toolBox}/${box_id}`, { body: data });
}

export function getToolBox(params: any) {
  return get(`${apis.toolBox}/${params?.box_id}`, { params });
}

export function getToolBoxMarket(params: any) {
  return get(`${apis.toolBoxMarketList}/${params?.box_id}`, { params });
}

export function delToolBox(params: any) {
  return del(`${apis.toolBox}/${params?.box_id}`, { params });
}

export function getToolBoxList(params: any) {
  return get(`${apis.toolBoxList}`, { params });
}

export function getToolBoxMarketList(params: any) {
  return get(`${apis.toolBoxMarketList}`, { params });
}

export function postTool(box_id: string, data: any) {
  return post(`${apis.toolBox}/${box_id}/tool`, { body: data });
}

export function editTool(box_id: string, tool_id: string, data: any) {
  return post(`${apis.toolBox}/${box_id}/tool/${tool_id}`, { body: data });
}

export function getToolList(params: any) {
  return get(`${apis.toolBox}/${params?.box_id}/tools/list`, { params });
}

export function debugTool(box_id: string, tool_id: string, data: any) {
  return post(`${apis.toolBox}/${box_id}/tool/${tool_id}/debug`, { body: data });
}

export function boxToolStatus(box_id: string, data: any) {
  return post(`${apis.toolBox}/${box_id}/status`, { body: data });
}

export function toolStatus(box_id: string, data: any) {
  return post(`${apis.toolBox}/${box_id}/tools/status`, { body: data });
}

export function convertTool(data: any) {
  return post(`${apis.convertTool}`, { body: data });
}

export function batchDeleteTool(box_id: string, data: any) {
  return post(`${apis.toolBox}/${box_id}/tools/batch-delete`, { body: data });
}

export const getToolBoxListFromMarks = (params?: any): Promise<BoxToolListResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.all !== undefined) searchParams.append('all', params.all.toString());

  const queryString = searchParams.toString();
  return get(`${apis.toolBoxIntegrationBaseUrl}/tool-box/market${queryString ? `?${queryString}` : ''}`);
};

// 获取工具箱内工具列表
export const getBoxToolList = (boxId: string, params?: ToolListParams): Promise<BoxToolListResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params?.sort_order) searchParams.append('sort_order', params.sort_order);
  if (params?.name) searchParams.append('name', params.name);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.user_id) searchParams.append('user_id', params.user_id);
  if (params?.all !== undefined) searchParams.append('all', params.all.toString());

  const queryString = searchParams.toString();
  return get(`${apis.toolBoxIntegrationBaseUrl}/tool-box/${boxId}/tools/list${queryString ? `?${queryString}` : ''}`);
};

// 全局工具列表查询
export const getGlobalMarketToolList = (params?: any): Promise<GlobalToolListResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.page_size) searchParams.append('page_size', params.page_size.toString());
  if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params?.sort_order) searchParams.append('sort_order', params.sort_order);
  if (params?.tool_name) searchParams.append('tool_name', params.tool_name);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.all !== undefined) searchParams.append('all', params.all.toString());

  const queryString = searchParams.toString();
  return get(`${apis.toolBoxIntegrationBaseUrl}/tool-box/market/tools${queryString ? `?${queryString}` : ''}`);
};

export function impexExport(params: any) {
  return get(`${apis.impexExport}/${params.type}/${params.id}`);
}

export function impexImport(data: any, type: string) {
  return post(`${apis.impexImport}/${type}`, { body: data });
}

// 获取函数代码模板
export function getToolBoxTemplate(template_type: 'python' = 'python') {
  return get(`${apis.toolBoxIntegrationBaseUrl}/template/${template_type}`);
}

// 函数块执行接口
export function postFunctionExecute(data: FunctionExecuteRequest): Promise<FunctionExecuteResponse> {
  return post(`${apis.toolBoxIntegrationBaseUrl}/function/execute`, { body: data });
}

// 获取工具详情
export function getToolDetail(box_id: string, tool_id: string) {
  return get(`${apis.toolBox}/${box_id}/tool/${tool_id}`);
}
