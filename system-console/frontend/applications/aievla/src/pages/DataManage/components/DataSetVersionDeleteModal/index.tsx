import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';

import { ColumnsType } from 'antd/lib/table';
import { LoadingOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { message } from 'antd';

import UniversalModal from '@/components/UniversalModal';
import ADTable from '@/components/ADTable';
import Format from '@/components/Format';
import { DeleteModal } from '@/components/TipModal';

import noResImg from '@/assets/images/noResult.svg';
import { WarningTip } from '../WarningTip';

import { getParam } from '@/utils/handleFunction';
import useAdHistory from '@/hooks/useAdHistory';

import { dataSetFilesDeleteVersions, versionsInfo } from '@/services/dataSet';

import './style.less';

export interface DataSetVersionDeleteModalProps {
  key?: string;
  children?: React.ReactNode;
  setShow: any;
  filesVersionsListStatus: any;
  setFilesVersionsListStatus: any;
  getFilesVersionsList: any;
  onOk: any;
  handleResetDataSet: any;
}

const DataSetVersionDeleteModal = (props: DataSetVersionDeleteModalProps) => {
  const prefixCls = 'dataSet-delete-version-modal';
  const history = useAdHistory();
  const { children, filesVersionsListStatus, setFilesVersionsListStatus, getFilesVersionsList, setShow, onOk, handleResetDataSet } = props;
  const [dataSetVersionsListStatus, setDataSetVersionsListStatus] = useState<any>({
    dataSource: [],
    selectedRow: [],
    loading: false,
    rule: 'version',
    order: 'desc',
  });
  const action = getParam('action');
  const ds_id = getParam('_dataSet');

  const disabledOperation = action === 'check';

  useEffect(() => {
    // 获取版本信息
    getDataSetVersions();
  }, [ds_id]);

  const getDataSetVersions = async () => {
    const res = await versionsInfo(ds_id);
    if (res) {
      const items = _.map(res, item => {
        return { ...item, key: item.version, label: item.version, version: item.version };
      });
      setDataSetVersionsListStatus((pre: any) => {
        return {
          ...pre,
          dataSource: items,
        };
      });
    }
  };

  const handleCancel = async () => {
    setShow(false);
  };

  const handleOk = () => {
    handleDelete({ ds_id: filesVersionsListStatus.root_id, versions: dataSetVersionsListStatus.selectedRow });
  };

  /** 排序规则 */
  const getSortOrder = (field: string) => {
    if (dataSetVersionsListStatus.rule !== field) return null;
    return dataSetVersionsListStatus.order === 'asc' ? 'ascend' : 'descend';
  };

  const handleDelete = async (data: { ds_id: string; versions: string[]; name?: string }) => {
    const { ds_id, versions } = data;

    // 删除版本
    const { versionsList } = filesVersionsListStatus;
    const versionList_temp = _.filter(versionsList, item => !versions.includes(item.value));

    const isOk = await DeleteModal({
      isSingleDelete: !!data?.name,
      currentDeleteName: data?.name,
      currentDeleteType: intl.get(`delete.${!!data?.name || versions?.length === 1 ? 'dataSetVersion' : 'dataSetVersions'}`),
      deleteCount: versions?.length,
    });

    if (!isOk) return;
    if (versions.length === versionsList.length) {
      handleResetDataSet();
      setShow(false);
      return;
    }

    const payload = { version_ids: versions };
    const res = await dataSetFilesDeleteVersions(ds_id, payload);
    if (res) {
      setFilesVersionsListStatus((preState: any) => ({
        ...preState,
        curVersion: versionList_temp[versionList_temp.length - 1]?.label || 'V1.0',
        breadCrumbData: preState.breadCrumbData.slice(0, 1),
      }));
      message.success(intl.get('global.delSuccess'));
      getFilesVersionsList();
      setShow(false);
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: intl.get('dataSet.version'),
      dataIndex: 'version',
      fixed: 'left',
      width: 370,
      ellipsis: true,
      showSorterTooltip: false,
      render: version => {
        return (
          <div className='ad-align-center' style={{ height: 40 }}>
            <div className='ad-flex-item-full-width'>
              <div className='ad-ellipsis ad-c-header' title={version}>
                {version}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      fixed: 'right',
      width: 170,
      render: (text: any, record: any, index: number) => {
        const { id, type, version, version_id } = record;

        return (
          <div className='operation'>
            <Format.Button
              type='link'
              onClick={() => handleDelete({ ds_id: filesVersionsListStatus.root_id, versions: [version_id], name: version })}
              disabled={disabledOperation}
            >
              {intl.get('global.delete')}
            </Format.Button>
          </div>
        );
      },
    },
  ];

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setDataSetVersionsListStatus((preState: any) => ({
        ...preState,
        selectedRow: selectedRowKeys,
      }));
    },
    getCheckboxProps: (record: any) => ({
      disabled: record.name === 'Disabled User', // Column configuration not to be checked
      name: record.name,
    }),
  };

  return (
    <UniversalModal
      className={`${prefixCls}`}
      title={intl.get('dataSet.manage.deleteVersion')}
      visible={true}
      onOk={handleOk}
      onCancel={() => handleCancel()}
      footerData={[
        { label: intl.get('global.cancel'), onHandle: () => handleCancel() },
        {
          label: intl.get('global.delete'),
          type: 'primary',
          isDisabled: _.isEmpty(dataSetVersionsListStatus.selectedRow),
          onHandle: handleOk,
        },
      ]}
    >
      <div style={{ maxHeight: 320 }}>
        <WarningTip text={intl.get('dataSet.deleteVersTip')} />

        <ADTable
          loading={
            dataSetVersionsListStatus.loading
              ? {
                  indicator: <LoadingOutlined className='icon' style={{ fontSize: 24, top: '200px' }} spin />,
                }
              : false
          }
          defaultDisplayType='table'
          scroll={{ y: 250 }}
          rowSelection={{
            type: 'checkbox',
            ...rowSelection,
          }}
          onChange={(pagination, filters, sorter: any) => {
            const order = sorter.order === 'descend' ? 'desc' : 'asc';
            setDataSetVersionsListStatus((preState: any) => ({
              ...preState,
              order,
              rule: sorter.field,
            }));
          }}
          rowKey={'version_id'}
          showHeader={false}
          lastColWidth={170}
          columns={columns}
          dataSource={dataSetVersionsListStatus.dataSource}
          emptyImage={noResImg}
          emptyText={intl.get('dataSet.manage.noData')}
        />
      </div>
    </UniversalModal>
  );
};

export default DataSetVersionDeleteModal;
