import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Modal, Form, Input } from 'antd';
import TaskType from '@/services/task/type';
import { KnowledgeNetworkType } from '@/services';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

export interface NewTaskFormValues {
  name: string;
  jobType: TaskType.JobType;
}

interface NewTaskModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (values: NewTaskFormValues) => void;
  confirmLoading?: boolean;
  detail?: KnowledgeNetworkType.Detail;
}

export const CreateTask: React.FC<NewTaskModalProps> = ({ detail, open, onCancel, onOk, confirmLoading = false }) => {
  const [form] = Form.useForm();
  const jobType = Form.useWatch('jobType', form);

  useEffect(() => {
    if (detail?.name && open) {
      form.setFieldsValue({
        name: detail.name,
      });
    }
  }, [detail, open]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleJobTypeSelect = (type: TaskType.JobType) => {
    form.setFieldValue('jobType', type);
  };

  return (
    <Modal title={intl.get('Task.createTask')} open={open} onCancel={handleCancel} onOk={handleOk} confirmLoading={confirmLoading}>
      <Form form={form} layout="vertical" className={styles.mainContainer} initialValues={{ jobType: TaskType.JobType.full }}>
        <Form.Item
          label={intl.get('Task.taskName')}
          name="name"
          rules={[
            { required: true, message: intl.get('Task.pleaseEnterTaskName') },
            { max: 40, message: intl.get('Global.nameCannotOverFourty') },
          ]}
        >
          <Input placeholder={intl.get('Global.placeholder')} className={styles.taskInput} />
        </Form.Item>
        <Form.Item label={intl.get('Task.buildMethod')} name="jobType" required>
          <div className={styles.buildTypeContainer}>
            {/* 全量构建选项 */}
            <div
              className={`${styles.buildTypeOption}  ${jobType === TaskType.JobType.full ? styles.selected : ''}`}
              onClick={() => handleJobTypeSelect(TaskType.JobType.full)}
            >
              <div className="g-flex-align-center">
                <IconFont type="icon-dip-color-quanliang" className={styles.buildTypeIcon} />
                <div className={styles.buildTypeContent}>
                  <div className={styles.buildTypeTitle}>{intl.get('Task.buildTypeFull')}</div>
                  <div className={styles.buildTypeDescription}>{intl.get('Task.fullBuildDescription')}</div>
                </div>
              </div>
              <div className={`${styles.radioCustom} ${jobType === TaskType.JobType.full ? styles.radioSelected : styles.radioNormal}`} />
            </div>
            {/* 增量更新选项 */}
            <div
              className={`${styles.buildTypeOption}  ${jobType === TaskType.JobType.incremental ? styles.selected : ''}`}
              onClick={() => handleJobTypeSelect(TaskType.JobType.incremental)}
            >
              <div className="g-flex-align-center">
                <IconFont type="icon-dip-color-zengliang" className={styles.buildTypeIcon} />
                <div className={styles.buildTypeContent}>
                  <div className={styles.buildTypeTitle}>{intl.get('Task.incrementalUpdateTitle')}</div>
                  <div className={styles.buildTypeDescription}>{intl.get('Task.incrementalUpdateDescription')}</div>
                </div>
              </div>
              <div className={`${styles.radioCustom} ${jobType === TaskType.JobType.incremental ? styles.radioSelected : styles.radioNormal}`} />
            </div>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateTask;
