import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import classNames from 'classnames';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { Select, Tooltip, message } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { ArrowUpOutlined, LoadingOutlined } from '@ant-design/icons';

import HELPER from '@/utils/helper';
import { VALID_FILES_TYPES } from '@/enums';
import { getParam } from '@/utils/handleFunction';
import { onChangeDataBatch } from '@/reduxConfig/action/uploadFile';
import {
  dataSetFilesDelete,
  dataSetFilesDeleteVersions,
  dataSetFilesBatchDownLoadId,
  dataSetFilesBatchDownLoad,
  dataSetFilesDownLoad,
  dataSetGetById,
  dataSetFilesList,
} from '@/services/dataSet';

import { ASCEND, DESCEND } from '@/pages/DataManage/enum';
import ADTable from '@/components/ADTable';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import { DeleteModal } from '@/components/TipModal';

import DataSetPreviewContent from '../DataSetFilesPreviewList/DataSetPreviewContent';
import BreadcrumbDir from './BreadcrumbDir';
import MenuUploadFiles, { MenuUploadFilesDom } from './MenuUploadFiles';

import NoResult from '@/assets/images/empty.svg';
import noResImg from '@/assets/images/noResult.svg';
import emptyCreateImg from '@/assets/images/create.svg';

import './style.less';

export interface DataSetFilesVersionsListProps {
  className?: string;
  onChangeFile?: any;
  status?: any;
  file?: any;
  reef?: any;
  filesVersionsListStatus: any;
  onSetFilesVersionsListStatus: any;
  setShowUploadTip?: any;
  visible?: any;
  setShowCreateModal: any;
}

const DataSetFilesVersionsList = (props: DataSetFilesVersionsListProps) => {
  const { onChangeFile, status, filesVersionsListStatus, onSetFilesVersionsListStatus: setFilesVersionsListStatus, setShowCreateModal } = props;
  const [selectedFiles, setSelectedFiles] = useState<React.Key[]>([]); // 表格行选择的文件或者文件夹 key
  const [selectedFilesRecord, setSelectedFilesRecord] = useState<React.Key[]>([]); // 表格行选择的文件或者文件夹 record
  const [isPreviewFile, setIsPreviewFile] = useState(false); // 是否预览文件

  // 文件预览相关
  const [selectedFile, setSelectedFile] = useState('');
  const [showTip, setShowTip] = useState(true); // 控制预览文件提示
  const [showUploadTip, setShowUploadTip] = useState(true); // 控制上传文件提示

  const breadCrumRef = useRef<any>(null);

  const newVersion = useMemo(() => {
    const { versionsList } = filesVersionsListStatus;
    const newVersion_res = 'V' + (parseFloat(versionsList[versionsList.length - 1]?.label.slice(1)) + 1).toFixed(1);
    return newVersion_res;
  }, [filesVersionsListStatus.versionsList]);

  const action = getParam('action');
  const disabledOperation = action === 'check';
  const isView = getParam('action') === 'view';

  useEffect(() => {
    updateVersionsList();
  }, []);

  useEffect(() => {
    getFilesVersionsList();
  }, [filesVersionsListStatus.order, filesVersionsListStatus.rule, filesVersionsListStatus.curVersion, filesVersionsListStatus.curPathKey, status]);

  useEffect(() => {
    setIsPreviewFile(false);
  }, [filesVersionsListStatus.curVersion]);

  const updateVersionsList = async () => {
    const { versions } = await dataSetGetById(filesVersionsListStatus.root_id);
    const version_keys = _.map(
      _.map(Object.keys(versions), key => parseFloat(key.slice(1))).sort((a: any, b: any) => a - b),
      number => 'V' + number.toFixed(1),
    );

    const versionsList_temp = _.map(version_keys, key => {
      return {
        value: versions[key],
        label: key,
      };
    });
    if (versionsList_temp[0].label === 'V1.0') return;
    setFilesVersionsListStatus((preState: any) => ({
      ...preState,
      curVersion: versionsList_temp[0].label || 'V1.0',
    }));
  };

  useImperativeHandle(props.reef, () => ({
    getfilesVersionsListStatus,
    getFilesVersionsList,
    handleUpdateVersions,
  }));

  /** 排序规则 */
  const getSortOrder = (field: string) => {
    if (filesVersionsListStatus.rule !== field) return null;
    return filesVersionsListStatus.order === 'asc' ? 'ascend' : 'descend';
  };

  const getfilesVersionsListStatus = () => {
    return filesVersionsListStatus;
  };

  // 当前数据集/路径---下载数据集或者文件夹
  const handleOutput = async (data: any) => {
    const { id, type = 'file', version_id, name = '' } = data;
    try {
      if (Array.isArray(id) || type === 'dir') {
        // 批量下载
        const tem_name = Array.isArray(id) ? '【批量下载】' + _.filter(filesVersionsListStatus.dataSource, item => item.key === id[0])[0]?.name + '等' : name;
        const tem_ids = Array.isArray(id) ? id : [id];
        const payload = {
          upload_type: 1,
          doc_ids: _.map(tem_ids, id => id.split('/').pop()),
          version_id: filesVersionsListStatus.version_id,
          name: tem_name,
        };
        const { unique } = await dataSetFilesBatchDownLoad(payload);

        const res = await dataSetFilesBatchDownLoadId(unique, { name: 'test' });
        const link = document.createElement('a');
        link.download = `${tem_name}.zip`;
        link.style.display = 'none';
        link.href = URL.createObjectURL(res);
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
        return;
      }
      // 单文件下载
      const payload = { upload_type: 1, doc_id: id, version_id: filesVersionsListStatus.version_id };
      const res = await dataSetFilesDownLoad(payload);
      const { url, method, headers } = res || {};
      if (url && method && headers) {
        const fileStream = await axios({
          url,
          method,
          headers: { ...headers, 'Content-Type': 'application/json; charset=UTF-8' },
          responseType: 'blob',
          timeout: 300000,
        });
        const fileName = new URL(url).searchParams.get('response-content-disposition');

        const link = document.createElement('a');
        link.download = decodeURI(fileName?.split(/''/).pop() || 'file.txt');
        link.style.display = 'none';
        link.href = URL.createObjectURL(fileStream.data);
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      }
    } catch (err) {
      // console.log('err', err);
    }
  };

  // 删除数据集当前路径/版本的文件或者文件夹 -- single and batch
  const handleDelete = async (type: 'version' | 'files', data: any, batch = false) => {
    const { id, version } = data;

    const currentDeleteName = !batch && type === 'files' ? data.name : version;
    const isOk = await DeleteModal({
      isSingleDelete: !batch,
      currentDeleteName,
      currentDeleteType: type === 'files' ? intl.get('delete.dataSetFile') : intl.get('delete.dataSetVersion'),
      deleteCount: batch ? selectedFiles?.length : 0,
    });
    if (!isOk) return;

    try {
      // 删除版本
      if (type === 'version') {
        const { versionsList } = filesVersionsListStatus;
        const versionList_temp = _.filter(versionsList, item => item.value !== version);

        const payload = { version_ids: [version] };
        const res = await dataSetFilesDeleteVersions(id, payload);
        if (res) {
          setFilesVersionsListStatus((preState: any) => ({
            ...preState,
            curVersion: versionList_temp[versionList_temp.length - 1].label || 'V1.0',
            breadCrumbData: preState.breadCrumbData.slice(0, 1),
          }));
        }
      } else {
        // 删除文件
        if (!batch) {
          const payload = { doc_ids: [id], version_id: filesVersionsListStatus.version_id, delete_type: 1 };
          const res = await dataSetFilesDelete(payload);
          if (res) {
            message.success(intl.get('global.delSuccess'));
            setSelectedFiles([]);
          }
        } else {
          const payload = { doc_ids: selectedFiles, version_id: filesVersionsListStatus.version_id, delete_type: 1 };
          const res = await dataSetFilesDelete(payload);
          if (res) {
            message.success(intl.get('global.delSuccess'));
            setSelectedFiles([]);
          }
        }
      }
      getFilesVersionsList();
    } catch (err) {
      // console.log('err', err);
    }
  };

  // 更新当前数据集文件的版本
  const handleUpdateVersions = async (version: any, isAdd = false) => {
    if (isAdd) {
      setShowCreateModal(true);
      return;
    }
    setFilesVersionsListStatus((preState: any) => ({
      ...preState,
      curVersion: version,
      curPathKey: getParam('_dataSet'),
      breadCrumbData: preState.breadCrumbData.slice(0, 1),
    }));
  };

  // 更新表格数据
  const getFilesVersionsList = async () => {
    setFilesVersionsListStatus((preState: any) => ({
      ...preState,
      loading: true,
    }));

    try {
      const { name, description, versions } = await dataSetGetById(filesVersionsListStatus.root_id);
      const version_keys = _.map(
        _.map(Object.keys(versions), key => parseFloat(key.slice(1))).sort((a: any, b: any) => a - b),
        number => 'V' + number.toFixed(1),
      );
      const versionId = versions[filesVersionsListStatus.curVersion];
      const versionsList_temp = _.map(version_keys, key => {
        return {
          value: versions[key],
          label: key,
        };
      });

      if (!versionId) return;
      const payload = {
        doc_id: filesVersionsListStatus.curPathKey,
        version_id: versionId,
        order: filesVersionsListStatus.order,
        rule: filesVersionsListStatus.rule,
      };
      const res = await dataSetFilesList(payload);

      const { dirs, files } = res;

      const dir_temp = _.map(dirs, dir => {
        return { ...dir, type: 'dir', id: dir.doc_id, key: dir.doc_id };
      });

      const file_temp = _.map(files, file => {
        return { ...file, type: 'file', id: file.doc_id, key: file.doc_id };
      });

      const data_temp = [...dir_temp, ...file_temp];

      // 虚拟列表 优化
      setFilesVersionsListStatus((preState: any) => ({
        ...preState,
        name,
        dataSource: data_temp,
        loading: false,
        version_id: versionId,
        versionsList: versionsList_temp,
        description,
      }));
    } catch (err) {
      // console.log('err', err);
    }
  };

  // 处理文件点击 --- table 文件夹点击
  const handleClick = async (type: 'file' | 'dir', record: any) => {
    const len = filesVersionsListStatus.breadCrumbData.length;
    const isLastFile = filesVersionsListStatus.breadCrumbData[len - 1].type === 'file';

    if (type === 'file') {
      if (!_.includes(VALID_FILES_TYPES, record.name.split('.').pop())) {
        message.warn(intl.get('dataSet.forbiddenPreviewTip'));
        return;
      }
      setIsPreviewFile(true);
      setSelectedFile(record.id);
      setFilesVersionsListStatus((preState: any) => ({
        ...preState,
        breadCrumbData: [
          ...(isLastFile ? preState.breadCrumbData.slice(0, -1) : preState.breadCrumbData),
          { key: record.id, id: record.id, label: record.name, type: 'file' },
        ],
      }));
      return;
    }
    setSelectedFile('');
    setIsPreviewFile(false);
    setFilesVersionsListStatus((preState: any) => ({
      ...preState,
      breadCrumbData: [
        ...(isLastFile ? preState.breadCrumbData.slice(0, -1) : preState.breadCrumbData),
        { key: record.id, id: record.id, label: record.name, type: 'dir' },
      ],
      curPathKey: record.id,
    }));
  };

  const columns: ColumnsType<any> = [
    {
      title: intl.get('dataSet.config.name'),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getSortOrder('name'),
      showSorterTooltip: false,
      render: (name, record) => {
        const { type, description: desc } = record;

        return (
          <div className={classNames('ad-align-center ad-pointer')} onClick={e => handleClick(type, record)}>
            <IconFont
              type={
                type === 'dir'
                  ? 'icon-putongwenjianjia'
                  : `icon-${
                      _.includes(VALID_FILES_TYPES, name.split('.').pop())
                        ? name.split('.').pop() === 'jsonl'
                          ? 'json'
                          : name.split('.').pop()
                        : 'tongyongwenjianicon'
                    }`
              }
              border
              style={{ fontSize: 20 }}
              className='ad-mr-2'
            />
            <div className='ad-flex-item-full-width'>
              <div className='ad-ellipsis ad-c-header' title={name}>
                {name}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: intl.get('dataSet.config.size'),
      dataIndex: 'size',
      width: 145,
      ellipsis: true,
      render: size => HELPER.formatFileSize(size),
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_user',
      ellipsis: true,
      render: user => user || '- -',
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getSortOrder('create_time'),
      showSorterTooltip: false,
      key: 'create_time',
      ellipsis: true,
      render: time => (time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'update_user',
      ellipsis: true,
      render: user => user || '- -',
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getSortOrder('update_time'),
      showSorterTooltip: false,
      key: 'update_time',
      ellipsis: true,
      render: time => (time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      fixed: 'right',
      render: (text: any, record: any, index: number) => {
        const { id, type, name } = record;
        const { curVersion, version_id } = filesVersionsListStatus;
        return (
          <div className='operation'>
            <Format.Button
              type='link'
              onClick={() => handleOutput({ id, version_id, type, name })}
              className='ad-mr-8'
              disabled={disabledOperation || type === 'dir'}
            >
              {intl.get('dataSet.manage.output')}
            </Format.Button>

            <Format.Button type='link' onClick={() => handleDelete('files', { id, version: curVersion, name })} disabled={disabledOperation}>
              {intl.get('global.delete')}
            </Format.Button>
          </div>
        );
      },
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setSelectedFiles(selectedRowKeys);
      setSelectedFilesRecord(selectedRows);
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.name === 'Disabled User',
      name: record.name,
    }),
  };

  window.onbeforeunload = function () {
    sessionStorage.removeItem('ADTableCols-dataSet-files');
  };

  const renderButtonConfig = [
    {
      key: 'files_select',
      position: 'left',
      itemDom: (
        <Select
          style={{ width: 220, height: 34 }}
          value={filesVersionsListStatus.curVersion}
          onChange={value => {
            handleUpdateVersions(value);
          }}
          optionLabelProp={filesVersionsListStatus.curVersion}
          dropdownRender={menu => {
            return (
              <div>
                {menu}
                {!disabledOperation ? (
                  <div
                    key={'add_version'}
                    style={{
                      height: 42,
                      borderTop: '1px solid rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'start',
                    }}
                    onClick={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpdateVersions(newVersion, true);
                    }}
                    className='ad-pointer version-item'
                  >
                    <IconFont type='icon-Add' border style={{ fontSize: 14, marginRight: 5 }} className='ad-ml-3' />
                    {intl.get('dataSet.manage.createVersionTip').split('\n')[0]}
                  </div>
                ) : null}
              </div>
            );
          }}
        >
          {filesVersionsListStatus.versionsList?.map((item: any) => {
            return (
              <Select.Option key={item.value} value={item.label} disabled={item?.disabled} style={{ height: 40 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transform: 'translateY(3px)',
                  }}
                >
                  <span>{item.label}</span>
                </div>
              </Select.Option>
            );
          })}
        </Select>
      ),
    },
    {
      key: 'path',
      position: 'left',
      itemDom: (
        <div className='pathTree ad-ml-5' style={{ width: 1000, zIndex: 1000000 }}>
          {/* 返回上一层目录 */}
          <Tooltip title={intl.get('global.lastDir')} placement='top'>
            <Format.Button
              type='icon'
              onClick={() => {
                setIsPreviewFile(false);
                setFilesVersionsListStatus((preState: any) => ({
                  ...preState,
                  curPathKey: preState.breadCrumbData.slice(-2, -1)[0].key,
                  breadCrumbData: preState.breadCrumbData.slice(0, -1),
                  loading: false,
                }));
              }}
              disabled={filesVersionsListStatus.breadCrumbData.length <= 1}
              className='ad-mr-2'
            >
              <ArrowUpOutlined />
            </Format.Button>
          </Tooltip>
          <BreadcrumbDir
            style={{ width: 1000 }}
            loading={false}
            data={filesVersionsListStatus.breadCrumbData as any}
            // 点击文件夹回调
            onLoadData={data => {
              if (data.type === 'file') {
                setIsPreviewFile(true);
                return;
              }
              setIsPreviewFile(false);

              setFilesVersionsListStatus((preState: any) => ({
                ...preState,
                curPathKey: data.key,
                breadCrumbData: preState.breadCrumbData.slice(0, preState.breadCrumbData.findIndex((item: any) => item.key === data.key) + 1),
                loading: false,
              }));
            }}
            errors={'error'}
            ref={breadCrumRef}
          />
        </div>
      ),
    },
    {
      key: 'del',
      position: 'right',
      itemDom:
        disabledOperation || _.isEmpty(selectedFiles) || isView ? null : (
          <Format.Button
            className={classNames('ad-mr-3', _.isEmpty(selectedFiles) ? 'delete-btn-disbled' : '')}
            onClick={() => handleDelete('files', { id: selectedFiles, version: filesVersionsListStatus.curVersion }, true)}
          >
            <IconFont type='icon-lajitong' />
            {intl.get('global.delete')}
          </Format.Button>
        ),
    },
    {
      key: 'import',
      position: 'right',
      itemDom:
        disabledOperation || isView ? null : (
          <MenuUploadFiles
            onSetShowUploadTip={setShowUploadTip}
            onChangeFile={onChangeFile}
            doc_id={filesVersionsListStatus.curPathKey}
            version_id={filesVersionsListStatus.version_id}
            dataSource={filesVersionsListStatus.dataSource}
            ossStatus={filesVersionsListStatus.ossStatus}
          />
        ),
    },
  ];

  const handleRenderButtonConfig = () => {
    return [
      ...renderButtonConfig.slice(0, -1),
      {
        key: 'single-file-ouput',
        position: 'right',
        itemDom: disabledOperation || (
          <Format.Button
            style={{ color: ' #237ce8', border: '1px solid #237ce8' }}
            onClick={() => handleOutput({ id: selectedFile, version_id: filesVersionsListStatus.version_id })}
          >
            <IconFont type='icon-xiazai' />
            {intl.get('dataSet.manage.output')}
          </Format.Button>
        ),
      },
    ];
  };

  const isViewAndDown = true;

  return (
    <div style={{ maxHeight: 350 }}>
      <div className='dataSet-files-versions ad-w-100 ad-h-100'>
        <ADTable
          className={'datSet-files'}
          persistenceID={_.uniqueId('dataSet-files')}
          style={isPreviewFile ? { display: 'none' } : { display: 'block' }}
          loading={
            filesVersionsListStatus.loading
              ? {
                  indicator: <LoadingOutlined className='icon' style={{ fontSize: 24, top: '200px' }} spin />,
                }
              : false
          }
          defaultDisplayType='table'
          scroll={_.isEmpty(filesVersionsListStatus.dataSource) ? {} : { y: 480 }}
          showHeader={true}
          lastColWidth={170}
          columns={disabledOperation || !isViewAndDown ? columns.slice(0, -1) : columns}
          dataSource={filesVersionsListStatus.dataSource}
          rowSelection={disabledOperation || isView || !isViewAndDown ? undefined : { type: 'checkbox', ...rowSelection }}
          renderButtonConfig={isPreviewFile ? handleRenderButtonConfig() : (renderButtonConfig as any)}
          showSearch={false}
          onChange={(_pagination, _filters, sorter: any) => {
            const order = sorter.order === 'descend' ? 'desc' : 'asc';
            setFilesVersionsListStatus((preState: any) => ({
              ...preState,
              order,
              rule: sorter.field,
            }));
          }}
          emptyImage={
            _.isEmpty(filesVersionsListStatus.dataSource)
              ? disabledOperation || !filesVersionsListStatus.ossStatus || isView
                ? NoResult
                : emptyCreateImg
              : noResImg
          }
          emptyText={
            _.isEmpty(filesVersionsListStatus.dataSource) ? (
              disabledOperation || !filesVersionsListStatus.ossStatus || isView ? (
                intl.get('dataSet.manage.dataSetIsEmpty')
              ) : (
                <MenuUploadFilesDom
                  onChangeFile={onChangeFile}
                  doc_id={filesVersionsListStatus.curPathKey}
                  version_id={filesVersionsListStatus.version_id}
                  dataSource={filesVersionsListStatus.dataSource}
                />
              )
            ) : (
              intl.get('global.noResult')
            )
          }
        />

        {isPreviewFile ? (
          <DataSetPreviewContent filesVersionsListStatus={filesVersionsListStatus} selectedFile={selectedFile} tip={showTip} onTipClose={setShowTip} />
        ) : null}
      </div>
    </div>
  );
};

const mapStateToProps = (state: any) => ({
  file: state.getIn(['uploadFile', 'file']),
  /** 上传任务的状态 */
  status: state.getIn(['uploadFile', 'status']),
  visible: state.getIn(['uploadFile', 'visible']),
});

const mapDispatchToProps = (dispatch: any) => ({
  onChangeFile: (data: { files: { file: Blob; [key: string]: any }[] }) => dispatch(onChangeDataBatch(data)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)((props: any) => {
  return <DataSetFilesVersionsList {...props} />;
});
