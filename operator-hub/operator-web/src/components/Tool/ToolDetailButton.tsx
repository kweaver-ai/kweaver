import { useMemo, useState, type FC } from 'react';
import { Button, message, Dropdown } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import './style.less';
import { boxToolStatus } from '@/apis/agent-operator-integration';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import { OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from '../OperatorList/types';
import PermConfigMenu from '../OperatorList/PermConfigMenu';
import { PublishedPermModal } from '../OperatorList/PublishedPermModal';
import UploadTool from './UploadTool';
import EditToolBoxModal from './EditToolBoxModal';
import OperatorImport from './OperatorImport';
import { useMicroWidgetProps } from '@/hooks';
import { confirmModal } from '@/utils/modal';

enum OperatorKeyEnum {
  Publish = 'Publish', // 发布
  Unpublish = 'Unpublish', // 下架
  Authorize = 'Authorize', // 权限配置
  Delete = 'Delete', // 删除
  Import = 'Import', // 导入工具(openapi类型的工具箱有此功能)
  ImportFromOperator = 'ImportFromOperator', // 从算子导入工具（函数类型的工具箱有此功能）
  CreateInIDE = 'CreateInIDE', // 在IDE中新建工具
  Edit = 'Edit', // 编辑
}

// 操作区域
const getOperatorButtons = (
  permissionCheckInfo: Array<PermConfigTypeEnum>,
  detailInfo: any,
  getFetchTool: () => void
) => {
  const status = detailInfo?.status;
  const [canPublish, canUnpublish, canAuthorize, canEdit] = [
    status !== OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Publish),
    status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Unpublish),
    permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize),
    permissionCheckInfo?.includes(PermConfigTypeEnum.Modify),
  ];

  const btns = [
    {
      key: OperatorKeyEnum.Edit,
      label: '编辑',
      visible: canEdit,
    },
    {
      key: OperatorKeyEnum.CreateInIDE,
      label: '在IDE中新建工具',
      visible: canEdit && detailInfo?.metadata_type === MetadataTypeEnum.Function,
    },
    {
      key: OperatorKeyEnum.Import,
      label: (
        <UploadTool getFetchTool={getFetchTool} toolBoxInfo={detailInfo}>
          <Button>导入工具</Button>
        </UploadTool>
      ),
      visible: canEdit && detailInfo?.metadata_type === MetadataTypeEnum.OpenAPI,
    },
    {
      key: OperatorKeyEnum.ImportFromOperator,
      label: '从已有算子导入',
      visible: canEdit && detailInfo?.metadata_type === MetadataTypeEnum.Function,
    },
    {
      key: OperatorKeyEnum.Publish,
      label: '发布',
      visible: canPublish,
    },
    {
      key: OperatorKeyEnum.Unpublish,
      label: '下架',
      visible: canUnpublish,
    },
    {
      key: OperatorKeyEnum.Authorize,
      label: <PermConfigMenu params={{ record: detailInfo, activeTab: OperatorTypeEnum.ToolBox }} />,
      visible: canAuthorize,
    },
  ].filter(item => item.visible);

  // 拆分成两个数组，规则：如果按钮的个数超过3个，则前两个放到第一个数组中，后面的放到第二个数组中；如果按钮的个数小于等于3个，则全部放到第一个数组中
  return btns.length > 3 ? [btns.slice(0, 2).toReversed(), btns.slice(2)] : [btns.toReversed(), []];
};

const ToolDetailButton: FC<{
  detailInfo: any;
  fetchInfo: any;
  permissionCheckInfo: Array<PermConfigTypeEnum>;
  goBack: () => void;
  getFetchTool: () => void;
  navigateToCreateToolInIDE: () => void;
}> = ({ detailInfo, fetchInfo, permissionCheckInfo, getFetchTool, navigateToCreateToolInIDE }) => {
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [importFromOperatorOpen, setImportFromOperatorOpen] = useState(false);
  const microWidgetProps = useMicroWidgetProps();

  const [otherButtons, moreButtons] = useMemo(
    () => getOperatorButtons(permissionCheckInfo, detailInfo, getFetchTool),
    [permissionCheckInfo, detailInfo, getFetchTool]
  );

  const closeToolModal = () => {
    setCreateToolOpen(false);
  };

  const changeBoxToolStatus = async (status: string, text: string) => {
    setButtonLoading(true);
    try {
      await boxToolStatus(detailInfo?.box_id, {
        status,
      });
      message.success(text);
      fetchInfo();
      if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
        PublishedPermModal({ record: detailInfo, activeTab: OperatorTypeEnum.ToolBox }, microWidgetProps);
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      setButtonLoading(false);
    }
  };

  const showOfflineConfirm = () => {
    confirmModal({
      title: '下架工具',
      content: '下架后，引用了该工具的智能体或工作流会失效，此操作不可撤回。',
      onOk() {
        changeBoxToolStatus(OperatorStatusType.Offline, '下架成功');
      },
      onCancel() {},
    });
  };

  // 处理操作点击事件
  const handleClick = (item: any) => {
    switch (item.key) {
      case OperatorKeyEnum.Publish:
        // 发布
        changeBoxToolStatus(OperatorStatusType.Published, '发布成功');
        break;
      case OperatorKeyEnum.Unpublish:
        // 下架
        showOfflineConfirm();
        break;
      case OperatorKeyEnum.CreateInIDE:
        // 在IDE中新建工具
        navigateToCreateToolInIDE();
        break;
      case OperatorKeyEnum.Edit:
        // 编辑
        setCreateToolOpen(true);
        break;
      case OperatorKeyEnum.ImportFromOperator:
        // 从算子导入工具（函数类型的工具箱）
        setImportFromOperatorOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <>
      {moreButtons?.length > 0 && (
        <Dropdown
          menu={{
            items: moreButtons as any[],
            onClick: handleClick,
          }}
        >
          <Button icon={<EllipsisOutlined />} />
        </Dropdown>
      )}

      {otherButtons.map(item =>
        typeof item.label === 'string' || item.key === OperatorKeyEnum.Authorize ? (
          <Button key={item.key} onClick={() => handleClick(item)}>
            {item.label}
          </Button>
        ) : (
          <span onClick={() => handleClick(item)}>{item.label}</span>
        )
      )}
      {createToolOpen && (
        <EditToolBoxModal closeModal={closeToolModal} toolBoxInfo={detailInfo} fetchInfo={fetchInfo} />
      )}
      {importFromOperatorOpen && (
        <OperatorImport
          closeModal={() => setImportFromOperatorOpen(false)}
          toolBoxInfo={detailInfo}
          getFetchTool={getFetchTool}
        />
      )}
    </>
  );
};

export default ToolDetailButton;
