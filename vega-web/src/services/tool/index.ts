import Request from '../request';
import ToolType from './type';

const baseUrl = '/api/agent-operator-integration/v1/tool-box';

// 获取工具箱列表
export const getToolBoxList = (params: ToolType.GetToolBoxListRequest): Promise<any> => {
  return Request.get(`${baseUrl}/market`, params);
};

// 获取工具箱内的工具列表
export const getToolListByBoxId = (boxId: string, params: ToolType.getToolListByBoxIdRequest): Promise<any> => {
  return Request.get(`${baseUrl}/${boxId}/tools/list`, params);
};

// 获取工具箱市场信息
export const getToolBoxDetail = (boxId: string, fields: ToolType.ToolBoxField[]): Promise<any> => {
  return Request.get(`${baseUrl}/market/${boxId}/${fields.join(',')}`);
};

// 搜索工具
export const searchTool = (params: ToolType.searchToolRequest): Promise<any> => {
  return Request.get(`${baseUrl}/market/tools`, params);
};

// 获取工具信息
export const getToolDetail = (boxId: string, toolId: string) => {
  return Request.get(`${baseUrl}/${boxId}/tool/${toolId}`);
};

// 获取MCP市场列表
export const getMcpMarketList = (params: ToolType.GetMcpMarketListRequest): Promise<any> => {
  return Request.get('/api/agent-operator-integration/v1/mcp/market/list', params);
};

// 获取MCP详情
export const getMcpDetail = (mcpId: string): Promise<any> => {
  return Request.get(`/api/agent-operator-integration/v1/mcp/market/${mcpId}/`);
};

// 获取MCP工具列表
export const getMcpTools = (mcpId: string, params: ToolType.GetMcpToolsRequest): Promise<any> => {
  return Request.get(`/api/agent-operator-integration/v1/mcp/proxy/${mcpId}/tools`, params);
};

export default {
  getToolBoxList,
  getToolListByBoxId,
  getToolBoxDetail,
  searchTool,
  getToolDetail,
  getMcpMarketList,
  getMcpDetail,
  getMcpTools,
};
