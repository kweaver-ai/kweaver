import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button, Modal, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import HOOKS from '@/hooks';
import { getParam } from '@/utils/handleFunction';

import ADTab from '@/components/AdTab';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import { tipModalFunc } from '@/components/TipModal';

import Setting from './Setting';
import CreateVersionModal from './DataSetFilesVersionsList/CreateVersionModal';

import DataSetFilesPreviewList from './DataSetFilesPreviewList';
import DataSetFilesVersionsList from './DataSetFilesVersionsList';
import DataSetVersionDeleteModal from '@/pages/DataManage/components/DataSetVersionDeleteModal';

import { dataSetFilesAddVersions, dataSetDeleteById, dataSetCheckOssStatus } from '@/services/dataSet';

import './style.less';

export interface DataSetTabProps {
  className?: string;
  info?: any;
  onOk: any;
  setIsPrevent: any;
  isChange: any;
  setIsChange: any;
  refreshInfo: any;
  isConfigChange: any;
  setIsConfigChange: any;
}

export const dataSetVersionInitData = { description: '' };

const DataSetTab = forwardRef((props: DataSetTabProps, ref) => {
  const { info, onOk, isChange, setIsChange, refreshInfo, isConfigChange, setIsConfigChange } = props;
  const { name } = info;
  const [selectedTab, setSelectedTab] = useState<string>('previewTab');
  const DataSetFilesVersionsListRef = useRef<any>(null);

  const [filesVersionsListStatus, setFilesVersionsListStatus] = useState({
    name: getParam('name'), // 当前数据集的名字
    dataSource: [] as any[], // 当前路径/版本的文件
    versionsList: [{ value: 'V1.0', label: 'V1.0' }], // 当前数据集的版本列表
    breadCrumbData: [{ label: getParam('name'), type: 'dir', key: getParam('_dataSet'), id: getParam('_dataSet') }],
    rule: 'name',
    order: 'desc',
    curVersion: 'V1.0', // 选择的当前版本
    curPathKey: getParam('_dataSet'), // 当前路径 './'
    root_id: getParam('_dataSet'),
    loading: true,
    version_id: '',
    ossStatus: true,
  });
  const [showUploadTip, setShowUploadTip] = useState({ show: false, type: 'file' }); // 是否显示上传限制弹窗
  const [showDeleteVersionModal, setShowDeleteVersionModal] = useState(false); // 删除数据集版本弹窗
  const [tabIsHover, setTabIsHover] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false); // 是否显示新建版本弹窗

  const DataSetFilesPreviewListRef = useRef<any>(null);
  const SettingRef = useRef<any>(null);

  const language = HOOKS.useLanguage();

  const newVersion = useMemo(() => {
    const { versionsList } = filesVersionsListStatus;
    const newVersion_res = 'V' + (parseFloat(versionsList[versionsList.length - 1]?.label.slice(1)) + 1).toFixed(1);
    return newVersion_res;
  }, [filesVersionsListStatus.versionsList]);

  const isShowSetting = true;

  useImperativeHandle(ref, () => ({
    resetVersionDes,
    saveCurDes,
  }));

  useEffect(() => {
    setFilesVersionsListStatus((preState: any) => {
      preState.breadCrumbData[0].label = name;
      return { ...preState, breadCrumbData: preState.breadCrumbData };
    });
  }, [name]);

  // 获取数据集当前路径/版本的文件
  const refreshFilesVersionsList = () => {
    return DataSetFilesVersionsListRef.current?.getFilesVersionsList();
  };

  // 重置预览版本描述
  const resetVersionDes = () => {
    DataSetFilesPreviewListRef.current?.resetCurDes();
    isConfigChange && SettingRef.current?.reset();
  };

  const saveCurDes = () => {
    DataSetFilesPreviewListRef.current?.saveCurDes();
    isConfigChange && SettingRef.current?.handleOk();
  };

  useEffect(() => {
    checkOssStatus();
  }, []);

  // 查看oss状态
  const checkOssStatus = async () => {
    const { status: ossStatus } = await dataSetCheckOssStatus();
    if (!ossStatus) {
      setFilesVersionsListStatus((preState: any) => ({ ...preState, ossStatus: false }));
      message.warning(intl.get('dataSet.noOss'), 10);
    }
  };

  // 重置数据集
  const handleResetDataSet = async () => {
    try {
      const postData = { reset: true };
      const res = await dataSetDeleteById(filesVersionsListStatus.root_id, postData);

      if (res) {
        setFilesVersionsListStatus((preState: any) => ({
          ...preState,
          curVersion: 'V1.0',
          breadCrumbData: preState.breadCrumbData.slice(0, 1),
        }));
        message.success(intl.get('global.delSuccess'));

        refreshFilesVersionsList();
      }
    } finally {
      //
    }
  };

  const handleTabChange = async (activeKey: any) => {
    if (isChange) {
      const isOk = await tipModalFunc({
        wrapClassName: 'dataSet-des',
        title: intl.get('dataSet.config.changeVersionTip').split('\n')[0],
        content: <div className={language === 'en-US' ? 'dataSet-edit-config' : ''}>{intl.get('dataSet.config.changeVersionTip').split('\n')[1]}</div>,
        okText: intl.get('dataSet.config.saveChange'),
        cancelText: (
          <Button
            className='abandon-des'
            onClick={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
              DataSetFilesPreviewListRef.current?.resetCurDes();
              setIsChange(false);
              setSelectedTab(activeKey);
              Modal.destroyAll();
            }}
          >
            {intl.get('dataSet.config.abandonSave')}
          </Button>
        ),
        closable: true,
      });
      if (!isOk) {
        return;
      }
      DataSetFilesPreviewListRef.current?.saveCurDes();
      setIsChange(false);
    }
    if (isConfigChange) {
      const isOk = await tipModalFunc({
        wrapClassName: 'dataSet-des',
        title: intl.get('dataSet.config.changeVersionTip').split('\n')[0],
        content: <div className={language === 'en-US' ? 'dataSet-edit-config' : ''}>{intl.get('dataSet.config.changeVersionTip').split('\n')[2]}</div>,
        okText: intl.get('dataSet.config.saveChange'),
        cancelText: (
          <Button
            className='abandon-des'
            onClick={(e: any) => {
              e.preventDefault();
              e.stopPropagation();
              SettingRef.current?.reset();
              setIsConfigChange(false);
              setSelectedTab(activeKey);
              Modal.destroyAll();
            }}
          >
            {intl.get('dataSet.config.abandonSave')}
          </Button>
        ),
        closable: true,
      });
      if (!isOk) {
        return;
      }
      SettingRef.current?.handleOk();
      setIsConfigChange(false);
    }
    setSelectedTab(activeKey);
  };

  // 新建版本弹窗 --- 确定回调
  const CreateModalHandleOk = async () => {
    setShowCreateModal(false);

    try {
      const id = filesVersionsListStatus.curPathKey;
      const payload = { version: newVersion };
      const res = await dataSetFilesAddVersions(id, payload);

      if (res) {
        setFilesVersionsListStatus((preState: any) => ({
          ...preState,
          curVersion: newVersion,
          breadCrumbData: preState.breadCrumbData.slice(0, 1),
        }));
      }
    } catch (err) {
      // console.log('err', err);
    }
  };

  // 新建版本弹窗 --- 取消回调
  const CreateModalHandleCancel = () => {
    setShowCreateModal(false);
  };

  const items = [
    {
      label: (
        <div
          className={classNames('tab-item', tabIsHover === 'previewTab' ? 'hovered' : '')}
          onMouseOver={() => setTabIsHover('previewTab')}
          onMouseLeave={() => setTabIsHover('')}
        >
          <IconFont
            type={selectedTab === 'previewTab' || tabIsHover === 'previewTab' ? 'icon-color-moxing2' : 'icon-color-moxing1'}
            border
            className='ad-mr-2'
            style={{ fontSize: 16 }}
          />
          {intl.get('dataSet.manage.previewTab')}
        </div>
      ),
      key: 'previewTab',
      children: (
        <DataSetFilesPreviewList
          setShowCreateModal={setShowCreateModal}
          selectedTab={selectedTab}
          filesVersionsListStatus={filesVersionsListStatus}
          setFilesVersionsListStatus={setFilesVersionsListStatus}
          isChange={isChange}
          setIsChange={setIsChange}
          ref={DataSetFilesPreviewListRef}
        />
      ),
    },
    {
      label: (
        <div
          className={classNames('tab-item', tabIsHover === 'versionsTab' ? 'hovered' : '')}
          onMouseOver={() => setTabIsHover('versionsTab')}
          onMouseLeave={() => setTabIsHover('')}
        >
          <IconFont
            type={selectedTab === 'versionsTab' || tabIsHover === 'versionsTab' ? 'icon-color-zidianguanli2' : 'icon-color-zidianguanli1'}
            border
            className='ad-mr-2'
            style={{ fontSize: 16 }}
          />
          {intl.get('dataSet.manage.versionsTab')}
          {_.isEmpty(filesVersionsListStatus.dataSource) ? (
            <ExclamationCircleFilled className={'err-icon'} style={{ color: 'red', transform: 'translateX(-5px) translateY(-9px)', margin: 0 }} />
          ) : null}
        </div>
      ),
      key: 'versionsTab',
      children: (
        <DataSetFilesVersionsList
          setShowCreateModal={setShowCreateModal}
          reef={DataSetFilesVersionsListRef}
          filesVersionsListStatus={filesVersionsListStatus}
          onSetFilesVersionsListStatus={setFilesVersionsListStatus}
          showUploadTip={showUploadTip}
          setShowUploadTip={setShowUploadTip}
        />
      ),
    },
    {
      label: (
        <div
          className={classNames('tab-item', tabIsHover === 'settingTab' ? 'hovered' : '')}
          onMouseOver={() => setTabIsHover('settingTab')}
          onMouseLeave={() => setTabIsHover('')}
        >
          <IconFont
            type={selectedTab === 'settingTab' || tabIsHover === 'settingTab' ? 'icon-xitongpeizhi' : 'icon-xitongpeizhi'}
            border
            className='ad-mr-2'
            style={{
              fontSize: 16,
              color: selectedTab === 'settingTab' || tabIsHover === 'settingTab' ? '#126ee3' : '#77797f',
            }}
          />
          {intl.get('dataSet.manage.settingTab')}
        </div>
      ),
      key: 'settingTab',
      children: <Setting onOk={onOk} info={info} refreshInfo={refreshInfo} isChange={isConfigChange} setIsChange={setIsConfigChange} ref={SettingRef} />,
    },
  ];

  return (
    <>
      <div className='dataSet-tab ad-w-100' style={{ padding: '0 24px', height: 'calc(100% - 150px)' }}>
        <ADTab
          activeKey={selectedTab}
          onChange={handleTabChange}
          tabBarExtraContent={
            <>
              <Format.Button type='icon-text-link' onClick={() => setShowDeleteVersionModal(true)}>
                <IconFont type={'icon-lajitong'} border />
                {intl.get('dataSet.manage.deleteVersion')}
              </Format.Button>
            </>
          }
          items={isShowSetting ? items : items.slice(0, 2)}
        />
      </div>
      {showDeleteVersionModal ? (
        <DataSetVersionDeleteModal
          setShow={setShowDeleteVersionModal}
          filesVersionsListStatus={filesVersionsListStatus}
          setFilesVersionsListStatus={setFilesVersionsListStatus}
          getFilesVersionsList={refreshFilesVersionsList}
          onOk={onOk}
          handleResetDataSet={handleResetDataSet}
        />
      ) : null}

      {showCreateModal ? (
        <CreateVersionModal versionValue={newVersion} visible={showCreateModal} onOk={CreateModalHandleOk} onCancel={CreateModalHandleCancel} />
      ) : null}
    </>
  );
});

export default DataSetTab;
