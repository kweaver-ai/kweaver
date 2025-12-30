import React, { useState } from 'react';
import { Modal, Upload, message, Radio, Button, Space } from 'antd';
import { InfoCircleOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { UploadProps, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import { impexImport } from '@/apis/agent-operator-integration';
import styles from './index.module.less';

// 定义组件的 props 接口
interface ImportMcpServiceModalProps {
  onCancel: () => void;
  onOk: () => void;
}

// 定义导入过程中的处理方式枚举
enum ModeEnum {
  Upsert = 'upsert', // 更新已有
  Create = 'create', // 终止导入
}

const ImportMcpServiceModal: React.FC<ImportMcpServiceModalProps> = ({ onCancel, onOk }) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ModeEnum>(ModeEnum.Upsert);
  const [loading, setLoading] = useState<boolean>(false);
  const MAX_FILE_SIZE_MB = 5;

  // 上传组件的配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    accept: '.adp', // 限制文件类型为 JSON
    beforeUpload: file => {
      // 检查文件大小
      const isLt5M = file.size / 1024 / 1024 < MAX_FILE_SIZE_MB;
      if (!isLt5M) {
        message.info(`上传的文件大小不能超过 ${MAX_FILE_SIZE_MB}MB`);
        return Upload.LIST_IGNORE; // 忽略该文件
      }

      const fileExtension = file?.name?.split('.')?.pop()?.toLowerCase() || '';
      if (!['adp'].includes(fileExtension)) {
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
  };

  // 冲突处理方式变化时的回调
  const handleModeChange = (e: RadioChangeEvent) => {
    setMode(e.target.value as ModeEnum);
  };

  // 确定按钮点击事件
  const handleOk = async () => {
    // 检查是否有文件
    if (!file) {
      message.info('请上传文件');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('data', file);
      formData.append('mode', mode);

      try {
        await impexImport(formData, 'mcp');
        message.success('导入成功');
        onOk();
      } catch (error: any) {
        if (error?.description) {
          message.error(error?.description);
        }
      } finally {
        setLoading(false);
      }
    } catch {}
  };

  return (
    <Modal
      open
      centered
      title="导入 MCP 服务"
      maskClosable={false}
      onCancel={onCancel}
      footer={[
        <Button key="submit" type="primary" className="dip-w-74" loading={loading} onClick={handleOk}>
          确定
        </Button>,
        <Button key="back" className="dip-w-74" onClick={onCancel}>
          取消
        </Button>,
      ]}
      width={640}
    >
      <div className={styles['import-container']}>
        {/* 提示信息 */}
        <div
          className={classNames(styles['info-tip'], 'dip-flex-align-start dip-gap-8 dip-border dip-border-radius-6')}
        >
          <InfoCircleOutlined className="dip-mt-4 dip-font-16" />
          <div>
            支持导入 AI Data Platform 导出的 .adp 文件。导出方式：在 AI Data Platform 找到对应的 MCP
            卡片，点击【...】按钮并选择【导出】即可。
          </div>
        </div>

        {/* 文件上传区域 */}
        <Upload.Dragger {...uploadProps}>
          <div style={{ height: '206px' }} className="dip-column-center">
            <CloudUploadOutlined className="dip-mb-8 dip-font-24" style={{ color: 'rgba(51, 51, 51, 1)' }} />
            <p className={styles['upload-text']}>点击或拖拽文件到本区域导入，文件大小不超过 5M</p>
          </div>
        </Upload.Dragger>

        {/* 导入冲突处理选项 */}
        <div className="dip-mb-24 dip-mt-24">
          <p className="dip-mb-8">导入过程中，若检测出MCP服务已存在：</p>
          <Radio.Group onChange={handleModeChange} value={mode}>
            <Space direction="vertical">
              <Radio value={ModeEnum.Upsert}>更新已有MCP</Radio>
              <Radio value={ModeEnum.Create}>终止导入</Radio>
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Modal>
  );
};

export default ImportMcpServiceModal;
