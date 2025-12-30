export enum OperatorTypeEnum {
  MCP = 'mcp',
  Operator = 'operator',
  Tool = 'tool',
  ToolBox = 'tool_box',
}
export enum OperatorStatusType {
  Offline = 'offline',
  Published = 'published',
  Unpublish = 'unpublish',
  Editing = 'editing',
}

export enum OperateTypeEnum {
  Edit = 'edit',
  View = 'view',
}

export enum ToolStatusEnum {
  Disabled = 'disabled',
  Enabled = 'enabled',
}

export enum OperatorInfoTypeEnum {
  Basic = 'basic',
}

export enum PermConfigTypeEnum {
  Create = 'create',
  Modify = 'modify',
  Delete = 'delete',
  View = 'view',
  Publish = 'publish',
  Unpublish = 'unpublish',
  Authorize = 'authorize',
  PublicAccess = 'public_access',
  Execute = 'execute',
}

export enum PermConfigShowType {
  Button = 'button',
}

export enum StreamModeType {
  SSE = 'sse',
  HTTP = 'http',
}
