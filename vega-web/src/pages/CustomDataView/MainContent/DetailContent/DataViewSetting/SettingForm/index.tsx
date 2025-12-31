import { DataViewOperateType, NodeType } from '@/pages/CustomDataView/type';
import FieldJoin from './FieldJoin';
import FieldMerge from './FieldMerge';
import FieldPreview from './FieldPreview';
import FieldSetting from './FieldSetting';
import FieldSQL from './FieldSQL';
import OutputDataView from './OutputDataView';

const SettingForm: React.FC<{ type: NodeType | DataViewOperateType }> = ({ type }) => {
  {
    switch (type) {
      case NodeType.VIEW:
        return <FieldSetting />;
      case NodeType.MERGE:
        return <FieldMerge />;
      case NodeType.JOIN:
        return <FieldJoin />;
      case NodeType.SQL:
        return <FieldSQL />;
      case NodeType.OUTPUT:
        return <OutputDataView />;
      case DataViewOperateType.FIELD_PREVIEW:
        return <FieldPreview />;
      default:
        return null;
    }
  }
};

export default SettingForm;
