import { Button, Divider } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import ToolIcon from '@/assets/icons/tool.svg';
import OperatorIcon from '@/assets/icons/operator-func.svg';
import { OperatorTypeEnum } from '@/components/OperatorList/types';

interface ToolbarProps {
  loading: boolean;
  name: string; // 名称
  operatorType: OperatorTypeEnum.Tool | OperatorTypeEnum.Operator; // 算子类型：工具 or 算子
  onSave: () => void; // 保存
  onBack: () => void; // 返回
}

const Toolbar = ({ loading, name, operatorType, onSave, onBack }: ToolbarProps) => {
  const Icon = operatorType === OperatorTypeEnum.Tool ? ToolIcon : OperatorIcon;

  return (
    <div
      style={{ borderBottom: 'solid 1px #e5e5e5', height: 48 }}
      className="dip-pl-24 dip-pr-24 dip-flex dip-bg-white"
    >
      <div className="dip-w-100 dip-flex-align-center">
        <div className="dip-flex-align-center dip-flex-1">
          <span className="dip-pointer" onClick={onBack}>
            <LeftOutlined className="dip-mr-4" />
            退出
          </span>
          <Divider type="vertical" className="dip-ml-16 dip-mr-16" />
          <Icon className="dip-font-24 dip-mr-8" />
          {name}
        </div>
        <Button className="dip-w-74" type="primary" loading={loading} onClick={onSave}>
          保存
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
