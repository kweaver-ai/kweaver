import React, { useState, useMemo } from 'react';
import { Modal, Radio, Button, Upload, Typography, Space, Badge, message } from 'antd';
import { InfoCircleOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import classNames from 'classnames';
import { impexImport, postToolBox, postOperatorRegiste } from '@/apis/agent-operator-integration';
import OpenApiIcon from '@/assets/icons/open-api.svg';
import ADPIcon from '@/assets/icons/adp.svg';
import CheckedIcon from '@/assets/icons/checked.svg';
import TemplateDownloadSection from '@/components/TemplateDownloadSection';
import { OperatorTypeEnum } from './types';
import { getOperatorTypeName } from './utils';

import styles from './ImportToolboxAndOperatorModal.module.less';

const { Text } = Typography;

// 导入数据源类型枚举
enum SourceTypeEnum {
  OpenAPI = 'OpenAPI',
  AIDataPlatform = 'AIDataPlatform',
}

// 定义导入过程中的处理方式枚举
enum ModeEnum {
  Upsert = 'upsert', // 更新已有
  Create = 'create', // 终止导入
}

interface ImportToolModalProps {
  activeTab: OperatorTypeEnum.ToolBox | OperatorTypeEnum.Operator;
  onCancel: () => void;
  onOk: () => void;
}

const MAX_FILE_SIZE_MB = 5;

// 导入工具箱/算子弹窗组件
const ImportMcpAndOperatorModal: React.FC<ImportToolModalProps> = ({ activeTab, onCancel, onOk }) => {
  const [sourceType, setSourceType] = useState<SourceTypeEnum | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ModeEnum>(ModeEnum.Upsert);
  const [loading, setLoading] = useState<boolean>(false);

  const operatorTypeName = useMemo(() => getOperatorTypeName(activeTab), [activeTab]);

  // 监听 sourceType 变化
  const handleSourceChange = (sourceType: SourceTypeEnum) => {
    setSourceType(sourceType);
    setFile(null);
  };

  // 上传组件的配置
  const uploadProps: UploadProps = useMemo(
    () => ({
      name: 'file',
      multiple: false,
      maxCount: 1,
      accept: sourceType === SourceTypeEnum.OpenAPI ? '.yaml,.yml,.json' : '.adp', // 限制文件类型
      beforeUpload: file => {
        // 检查文件大小
        const isLt5M = file.size / 1024 / 1024 < MAX_FILE_SIZE_MB;
        if (!isLt5M) {
          message.info(`上传的文件大小不能超过 ${MAX_FILE_SIZE_MB}MB`);
          return Upload.LIST_IGNORE; // 忽略该文件
        }

        const fileExtension = file?.name?.split('.')?.pop()?.toLowerCase() || '';

        if (sourceType === SourceTypeEnum.OpenAPI && !['yaml', 'yml', 'json'].includes(fileExtension)) {
          message.info('上传格式不正确，只能是yaml或json格式的文件');
          return Upload.LIST_IGNORE; // 忽略该文件
        }

        if (sourceType === SourceTypeEnum.AIDataPlatform && !['adp'].includes(fileExtension)) {
          message.info('上传格式不正确，只能是.adp格式的文件');
          return Upload.LIST_IGNORE; // 忽略该文件
        }

        setFile(file);
        return false; // 阻止自动上传
      },
      onRemove: () => {
        setFile(null);
        return true;
      },
      fileList: file ? [{ uid: file.name, name: file.name, status: 'done' }] : [],
    }),
    [setFile, file, sourceType]
  );

  // 根据选择的来源显示对应的文本信息
  const sourceInfo = useMemo(() => {
    return (
      <div className={classNames(styles['info-tip'], 'dip-flex-align-start dip-gap-8 dip-border dip-border-radius-6')}>
        <InfoCircleOutlined className="dip-mt-4 dip-font-16" />
        {sourceType === 'OpenAPI' ? (
          <div>
            支持导入 OpenAPI 3.0 数据格式的 JSON 或 YAML 文件
            <TemplateDownloadSection className="dip-mt-8" />
          </div>
        ) : (
          <div>
            支持导入 AI Data Platform 导出的 .adp 文件。导出方式：在 AI Data Platform 找到对应的{operatorTypeName}
            卡片，点击【...】按钮并选择【导出】即可。
          </div>
        )}
      </div>
    );
  }, [sourceType, operatorTypeName]);

  // 处理导入逻辑
  const handleImport = async () => {
    if (!file) {
      message.info('请上传文件');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('data', file);

    try {
      if (sourceType === SourceTypeEnum.AIDataPlatform) {
        // 处理 AI Data Platform 导入
        formData.append('mode', mode);
        await impexImport(formData, activeTab === OperatorTypeEnum.ToolBox ? 'toolbox' : 'operator');
      } else {
        // 处理OpenAPI导入
        if (activeTab === OperatorTypeEnum.ToolBox) {
          // 处理工具箱导入
          formData.append('metadata_type', 'openapi');
          await postToolBox(formData);
        } else {
          // 处理算子导入
          formData.append('operator_metadata_type', 'openapi');
          await postOperatorRegiste(formData);
        }
      }

      message.success('导入成功');
      onOk();
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      setLoading(false);
    }
  };

  // 渲染文件导入区域
  const renderUploadArea = useMemo(() => {
    if (!sourceType) return null;

    return (
      <div className="dip-mb-24">
        <div className={styles['info-box']}>{sourceInfo}</div>

        {/* 文件上传区域 */}
        <Upload.Dragger {...uploadProps}>
          <div style={{ height: '206px' }} className="dip-column-center">
            <CloudUploadOutlined className="dip-mb-8 dip-font-24" style={{ color: 'rgba(51, 51, 51, 1)' }} />
            <p className={styles['upload-text']}>点击或拖拽文件到本区域导入，文件大小不超过 5M</p>
          </div>
        </Upload.Dragger>
      </div>
    );
  }, [sourceType, sourceInfo, uploadProps]);

  // 导入冲突处理区域
  const renderConflictArea = useMemo(
    () =>
      sourceType === SourceTypeEnum.AIDataPlatform && (
        <div className="dip-mb-20">
          <p className="dip-mb-8">导入过程中，若检测出{operatorTypeName}已存在：</p>
          <Radio.Group onChange={e => setMode(e.target.value as ModeEnum)} value={mode}>
            <Space direction="vertical">
              <Radio value={ModeEnum.Upsert}>更新已有{operatorTypeName}</Radio>
              <Radio value={ModeEnum.Create}>终止导入</Radio>
            </Space>
          </Radio.Group>
        </div>
      ),
    [setMode, mode, sourceType, operatorTypeName]
  );

  return (
    <Modal
      title={`导入${activeTab === OperatorTypeEnum.Operator ? '算子' : '工具箱'}`}
      open
      centered
      maskClosable={false}
      onCancel={onCancel}
      width={640}
      footer={
        sourceType
          ? [
              <Button key="import" type="primary" className="dip-w-74" loading={loading} onClick={handleImport}>
                确定
              </Button>,
              <Button key="cancel" className="dip-w-74" onClick={onCancel}>
                取消
              </Button>,
            ]
          : null
      }
    >
      <div className={styles['modal-content']}>
        <Text type="secondary" className={styles['tip-text']}>
          请选择对应的数据来源格式导入：
        </Text>

        <div className="dip-mb-24 dip-flex dip-gap-20">
          {[
            { icon: OpenApiIcon, label: 'OpenAPI', type: SourceTypeEnum.OpenAPI },
            { icon: ADPIcon, label: 'AI Data Platform', type: SourceTypeEnum.AIDataPlatform },
          ].map(({ icon: Icon, label, type }, index) => {
            const isSelected = sourceType === type;

            return (
              <Badge
                key={index}
                count={
                  isSelected ? (
                    <CheckedIcon className={classNames('dip-font-24', styles['source-button-checked-icon'])} />
                  ) : null
                }
                offset={[-12, 12]}
                className="dip-flex-1"
              >
                <Button
                  className={classNames('dip-w-100', styles['source-button'], {
                    [styles['source-button-selected']]: isSelected,
                  })}
                  onClick={() => handleSourceChange(type)}
                >
                  <Icon className="dip-font-32" />
                  <Text>{label}</Text>
                </Button>
              </Badge>
            );
          })}
        </div>

        {/* 文件导入和导入模式选择区域 */}
        {renderUploadArea}

        {renderConflictArea}
      </div>
    </Modal>
  );
};

export default ImportMcpAndOperatorModal;
