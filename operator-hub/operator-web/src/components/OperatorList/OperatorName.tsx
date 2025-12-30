import { OperatorTypeEnum } from './types';

export default function OperatorName({ type }: any) {
  const getType = (type: string) => {
    switch (type) {
      case OperatorTypeEnum.MCP:
        return 'MCP';
      case OperatorTypeEnum.Operator:
        return '算子';
      case OperatorTypeEnum.ToolBox:
        return '工具';

      default:
        return '未知';
    }
  };

  return <>{getType(type)}</>;
}
