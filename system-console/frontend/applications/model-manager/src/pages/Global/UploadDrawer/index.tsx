import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button } from 'antd';
import { BorderOutlined, ExclamationCircleFilled, MinusOutlined } from '@ant-design/icons';

import UTILS from '@/utils';
import HOOKS from '@/hooks';
import { IconFont, Modal } from '@/common';

import UploadLine from './UploadLine';

import './style.less';

export interface FileType extends Blob {
  uid: string;
  status: string;
}

export const PENDING = 'pending';
export const UPLOADING = 'uploading';
export const SUCCESS = 'success';
export const FAIL = 'fail';

const UploadDrawer = (props: any) => {
  const [modal, contextHolder] = Modal.useModal();
  const { onChangeUploadStatus } = props; // redux 注入属性
  const { store, dispatch } = HOOKS.useGlobalContext();
  const { visible, modelData, status: uploadStatus } = store.uploadDrawer;

  const [items, setItems] = useState<any>([]);
  const lastItems = React.useRef(items); // 操作items后的最新值
  const [isIncompletion, setIsIncompletion] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  /** 已上传的内容大小 */
  const [uploadedSize, setUploadedSize] = useState(5);
  const [completeTask, setCompleteTask] = useState(false);
  const [isCancelAll, setIsCancelAll] = useState(false);

  const updateOnlineStatus = () => {
    const condition = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    setNetworkStatus(condition || 'ONLINE');
  };
  useEffect(() => {
    if (visible) {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    } else {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    }
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [visible]);

  const dependency = useMemo(() => {
    if (_.isEmpty(modelData.files)) return _.uniqueId('--empty-');
    return _.map(modelData.files, fileObj => fileObj.file.uid).join(',');
  }, [modelData.files]);

  useEffect(() => {
    // 关闭弹窗
    if (_.isEmpty(modelData.files)) {
      if (!_.isEmpty(items)) {
        onChangeItems([]);
        dispatch({ key: 'update', payload: { 'uploadDrawer.visible': false } });
      }
      return;
    }
    const cloneFiles = _.cloneDeep(modelData.files);

    const tem_pendingFilesData = _.map(cloneFiles, fileObj => {
      const uid = fileObj.name + fileObj.size + Date.now();
      fileObj.uid = uid;
      fileObj.status = 'pending';
      return fileObj;
    });

    onChangeItems([...items, ...tem_pendingFilesData]);
    onTriggerDrawerSize(false);
    setCompleteTask(false);
    setIsCancelAll(false);
    setUploadedSize(5);
  }, [dependency]);

  /** 正在上传的文件数量 */
  const uploadingFileNumber = _.filter(items, item => item?.file?.status === 'uploading')?.length;
  const failedFileNumber = _.filter(items, item => item?.file?.status === 'fail')?.length;
  useEffect(() => {
    if (uploadingFileNumber === 0 && failedFileNumber === 0) {
      !isCancelAll && onTriggerDrawerSize();
      setCompleteTask(true);
      dispatch({ key: 'update', payload: { 'uploadDrawer.status': SUCCESS + _.uniqueId() } });
      return;
    }
    if (uploadingFileNumber !== 0) {
      dispatch({ key: 'update', payload: { 'uploadDrawer.status': UPLOADING + _.uniqueId() } });
      return;
    }
    dispatch({ key: 'update', payload: { 'uploadDrawer.status': SUCCESS + _.uniqueId() } });
  }, [uploadingFileNumber, failedFileNumber]);

  /** 最小化或展开上传进度框 */
  const onTriggerDrawerSize = (flag?: boolean) => {
    setIsIncompletion(flag ?? !isIncompletion);
  };

  /** 关闭上传抽屉 */
  const onCloseDrawer = async () => {
    const uploadingLength = _.filter(items, item => item.file.status === 'uploading')?.length;
    if (uploadingLength) {
      modal.confirm({
        title: '确认要退出当前操作吗？',
        closable: true,
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        content: '关闭当前弹窗，将不会继续上传，确定要执行此操作？',
        okText: '确定',
        cancelText: '取消',
        onOk: () => {
          onChangeItems([]);
          dispatch({ key: 'update', payload: { 'uploadDrawer.status': PENDING, 'uploadDrawer.visible': false } });
        },
      });
    } else {
      onChangeItems([]);
      dispatch({ key: 'update', payload: { 'uploadDrawer.visible': false } });
    }
  };

  /**
   * 全部取消
   */
  const handleCancelAll = () => {
    // setTimeout(() => {
    const newItems = _.filter(items, item => item.file.status === 'success');
    setIsCancelAll(true);
    onChangeItems(newItems);
    setUploadedSize(5);
    // }, 1000);
  };

  /** 取消上传 */
  const onCancel = (fileId: string) => {
    const newItems = _.filter(items, item => item.file.uid !== fileId);
    onChangeItems(newItems);
  };

  /**
   * 更新items
   * @param newItems 新的items
   */
  const onChangeItems = (newItems: any) => {
    setItems(newItems);
    lastItems.current = newItems;
  };

  /** 修改文件状态 */
  const onChangeFileStatus = (fileId: string, fileStatus: string) => {
    const newItems = _.map(lastItems.current, item => {
      if (item.file.uid !== fileId) return item;
      item.file.status = fileStatus;
      return item;
    });
    onChangeItems(newItems);
  };

  if (!visible) return null;

  return (
    <div className={classNames('uploadDrawerRoot', { incompletion: isIncompletion })}>
      {contextHolder}
      <div className='header'>
        <div className='title'>
          {(uploadStatus.includes(UPLOADING) || uploadingFileNumber !== 0) &&
            intl.get('dataSet.uploadingNumber', {
              number: uploadingFileNumber,
              speed: `${UTILS.formatFileSize(Math.floor((uploadedSize * 1024 * 3) / lastItems.current.length))}/s`,
            })}

          {completeTask && intl.get('dataSet.importsClosure')}
          {uploadStatus.includes(SUCCESS) && failedFileNumber !== 0
            ? intl.get('dataSet.importsClosure') + intl.get('dataSet.uploadFilesFailNumbers', { number: failedFileNumber })
            : ''}
          {uploadStatus === FAIL && intl.get('dataSet.importFailed')}
        </div>
        <div className='operation'>
          <span className='icon' onClick={() => onTriggerDrawerSize()}>
            {isIncompletion ? <BorderOutlined /> : <MinusOutlined />}
          </span>
          <IconFont className='icon' type='icon-dip-close' onClick={onCloseDrawer} />
        </div>
      </div>
      <div className='reminder'>
        <ExclamationCircleFilled style={{ color: '#FAAD14', marginRight: 8 }} />
        {intl.get('global.uploadWaringTip')}
      </div>
      <div className='content'>
        {_.map(items, item => {
          return (
            <UploadLine
              key={item.file.uid}
              source={item}
              uploadStatus={uploadStatus}
              networkStatus={networkStatus}
              onCancel={onCancel}
              onChangeFileStatus={onChangeFileStatus}
              onTriggerDrawerSize={onTriggerDrawerSize}
              onChangeUploadStatus={onChangeUploadStatus}
              setUploadedSize={setUploadedSize}
            />
          );
        })}
      </div>
      <div className='footer'>
        <Button onClick={handleCancelAll}>{intl.get('global.cancelAll')}</Button>
      </div>
    </div>
  );
};

export default UploadDrawer;
