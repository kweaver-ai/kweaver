import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';

export const metadataTypeMap: Record<MetadataTypeEnum, string> = {
  [MetadataTypeEnum.OpenAPI]: 'OpenAPI',
  [MetadataTypeEnum.Function]: '函数计算',
};
