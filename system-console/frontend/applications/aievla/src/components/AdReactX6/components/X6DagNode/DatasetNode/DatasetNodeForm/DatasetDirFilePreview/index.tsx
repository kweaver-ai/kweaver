import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Checkbox, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';

import { dataSetFilesList } from '@/services/dataSet';
import { dataSetFilesPreview } from '@/services/benchmark';

import AdTree from '@/components/AdTree';
import ADTable from '@/components/ADTable';
import FileIcon from '@/components/FileIcon';
import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';
import LoadingMask from '@/components/LoadingMask';

import { generateFilePreviewTableData, generateTreeNodeData, updateTreeData } from './assistant';

import empty from '@/assets/images/empty.svg';
import selectFile from '@/assets/images/selectFile.svg';
import invalidFile from '@/assets/images/invalidFile.svg';
import './style.less';

type ValueType = {
  doc_id: string;
  doc_name: string;
  input: string[];
  output: string[];
  error?: string;
};

type DatasetDirFilePreviewProps = {
  datasetVersionId: string;
  // antd Form 格式
  value?: ValueType[];
  onChange?: (param: ValueType[]) => void;
  disabled?: boolean;
  deleteDisabled?: boolean;
};
const DatasetDirFilePreview: React.FC<DatasetDirFilePreviewProps> = props => {
  const { datasetVersionId, value, onChange, disabled = false, deleteDisabled = true } = props;
  const prefixCls = 'DatasetDirFilePreview';

  const { datasetId, versionId } = useMemo(() => {
    const [datasetKey, versionKey] = datasetVersionId ? datasetVersionId.split('/') : [];
    return { datasetId: datasetKey, versionId: versionKey };
  }, [datasetVersionId]);

  const [dirTreeProps, setDirTreeProps] = useState({
    data: [] as any,
    loadedKeys: [] as string[],
    expandedKeys: [] as string[],
    selectedKeys: [] as string[],
    selectedNodes: [] as any,
  });
  const [tableProps, setTableProps] = useState({ dataSource: [], loading: false });
  const [fileErrorData, setFileErrorData] = useState({} as any);
  const [isJsonFile, setIsJsonFile] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<any>();
  const currentSelectedDocId = useMemo(() => {
    return dirTreeProps.selectedKeys[0];
  }, [dirTreeProps.selectedKeys]);

  useEffect(() => {
    if (datasetId) {
      const getRootData = async () => {
        const rootTreeData = await getDirTree(datasetId, true);
        if (rootTreeData) {
          setDirTreeProps(prevState => ({ ...prevState, data: rootTreeData }));
        }
      };
      getRootData();
    }
    return () => {
      resetData();
    };
  }, [datasetId, versionId]);

  const resetData = () => {
    setDirTreeProps({ data: [], loadedKeys: [], expandedKeys: [], selectedKeys: [], selectedNodes: [] });
    setTableProps({ dataSource: [], loading: false });
    setFileErrorData({});
  };

  const getDirTree = async (id: string, noIndent = false) => {
    const data = await dataSetFilesList({ doc_id: id, version_id: versionId, order: 'desc', rule: 'name' });
    if (data) {
      const newFiles = data.files.filter((item: any) => {
        const ext = item.name.split('.').slice(-1)[0].toLowerCase();
        return ext !== 'txt';
      });
      const dirTreeNode = generateTreeNodeData(data.dirs, { isLeaf: false, parentKey: id });
      const filesTreeNode = generateTreeNodeData(newFiles, { isLeaf: true, parentKey: id, noIndent });
      const childTreeNode = [...dirTreeNode, ...filesTreeNode];
      return childTreeNode;
    }
    return false;
  };

  const getFileData = async (docId: string, isJson = false) => {
    setTableProps(prevState => ({ ...prevState, loading: true, dataSource: [] }));
    setJsonData(undefined);
    const data = await dataSetFilesPreview({ version_id: versionId, doc_id: docId }, { timeout: 180000, isHideMessage: true });
    setTableProps(prevState => ({ ...prevState, loading: false }));
    if (data && data.datas && data.datas.length > 0) {
      if (isJson) setJsonData(data.datas);

      const tableData: any = generateFilePreviewTableData(data.datas[0]);
      setTableProps(prevState => ({ ...prevState, dataSource: tableData }));
      setFileErrorData({ ...fileErrorData, [docId]: '' });
    } else {
      let errorText = 'emptyData';
      if (data.includes('DataSetFilePreviewError')) errorText = 'DataSetFilePreviewError';
      // 文件报错了，报错的文件如果已经在value中，那么需要体现出来
      const cloneValue = value ? _.cloneDeep(value) : [];
      const targetIndex = cloneValue.findIndex(item => item.doc_id === docId);
      if (targetIndex !== -1) {
        cloneValue[targetIndex].error = errorText;
        onChange?.(cloneValue);
      }
      setFileErrorData({ ...fileErrorData, [docId]: errorText });
      setTableProps(prevState => ({ ...prevState, dataSource: [] }));
      setJsonData(undefined);
    }
  };

  const onLoadData = ({ key }: any) => {
    return new Promise<any>(async resolve => {
      const childTreeNode = await getDirTree(key);
      if (childTreeNode) {
        const newTreeData = updateTreeData(dirTreeProps.data, key, childTreeNode);
        setDirTreeProps(prevState => ({ ...prevState, data: newTreeData, loadedKeys: [...prevState.loadedKeys, key] }));
        resolve(true);
      }
    });
  };

  const renderIcon = (nodeData: any) => {
    let successIconVisible = false;
    let errorIconVisible: boolean | string = false;
    if (fileErrorData[nodeData.key]) {
      errorIconVisible = true;
    }
    if (!nodeData.children || nodeData.children.length === 0) {
      const target = value?.find(item => item.doc_id.startsWith(nodeData.key));
      if (target) {
        successIconVisible = true;
        if (target.error) errorIconVisible = target.error;
      }
    } else {
      value?.forEach(item => {
        if (item.doc_id === nodeData.key) {
          successIconVisible = true;
          if (item.error) errorIconVisible = item.error;
        }
      });
    }
    if (errorIconVisible) {
      if (typeof errorIconVisible === 'string') {
        return (
          <Tooltip placement='top' title={errorIconVisible}>
            <IconFont style={{ fontSize: 20 }} type='graph-warning1' className='ad-c-error' />
          </Tooltip>
        );
      }
      return <IconFont style={{ fontSize: 20 }} type='graph-warning1' className='ad-c-error' />;
    }
    if (successIconVisible) {
      return <IconFont style={{ fontSize: 24 }} type='icon-duigou' className='ad-c-link' />;
    }
  };

  const titleRender = (nodeData: any) => {
    const type = nodeData.sourceData.type;
    return (
      <span className='ad-space-between'>
        <span className='ad-align-center'>
          <FileIcon style={{ lineHeight: 1 }} size={14} type={type === 1 ? 'dir' : 'file'} name={nodeData.title} />
          <span className='ad-flex-item-full-width ad-ml-2 ad-ellipsis' style={{ fontSize: 14 }}>
            {nodeData.title}
          </span>
        </span>
        {renderIcon(nodeData)}
      </span>
    );
  };

  const onSelect = (selectedKeys: string[], { node, selectedNodes }: any) => {
    let json = false;
    const ext = node.title.split('.').slice(-1)[0].toLowerCase();
    if (ext.includes('json')) {
      json = true;
    }
    setIsJsonFile(json);

    if (selectedKeys.length > 0) {
      setDirTreeProps(prevState => ({ ...prevState, selectedKeys, selectedNodes }));
      getFileData(selectedKeys[0], json);
    }
  };

  const selectedFileInputOutput = useMemo(() => {
    const key = dirTreeProps.selectedKeys[0];
    if (value && key) {
      const target = value.find(item => item.doc_id === key);
      if (target) {
        return { input: target.input ?? [], output: target.output ?? [] };
      }
    }
    return { input: [], output: [] };
  }, [value, dirTreeProps.selectedKeys]);

  const checkChange = (checked: boolean, filedName: string, type: string) => {
    console.log(dirTreeProps, 'dirTreeProps');
    const doc_id = dirTreeProps.selectedKeys[0];
    const selectedNode = dirTreeProps.selectedNodes[0];
    const cloneValue = value ? _.cloneDeep(value) : [];
    const targetIndex = cloneValue.findIndex(item => item.doc_id === doc_id);
    if (targetIndex !== -1) {
      if (type === 'input') {
        if (checked) {
          cloneValue[targetIndex].input.push(filedName);
        } else {
          cloneValue[targetIndex].input = cloneValue[targetIndex].input.filter(item => item !== filedName);
        }
      }
      if (type === 'output') {
        if (checked) {
          cloneValue[targetIndex].output.push(filedName);
        } else {
          cloneValue[targetIndex].output = cloneValue[targetIndex].output.filter(item => item !== filedName);
        }
      }
      if (cloneValue[targetIndex].input.length === 0 && cloneValue[targetIndex].output.length === 0) {
        cloneValue.splice(targetIndex, 1);
      }
    } else {
      const tempData: any = { input: [], output: [] };
      if (type === 'input') tempData.input = [filedName];
      if (type === 'output') tempData.output = [filedName];
      cloneValue.push({ doc_id, doc_name: selectedNode.title, ...tempData });
    }
    cloneValue.forEach(item => {
      if (item.input.length === 0 || item.output.length === 0) {
        item.error = intl.get('benchmark.config.datasetErrorTip');
      } else {
        delete item.error;
      }
    });
    onChange?.(cloneValue);
  };

  const columns: TableColumnsType = [
    {
      title: intl.get('benchmark.config.dataName'),
      dataIndex: 'fieldName',
    },
    {
      title: (
        <div className='ad-center'>
          inputs
          <Tooltip
            title={intl.get('benchmark.config.datasetInputTooltip')}
            placement='top'
            getPopupContainer={() => document.getElementById('dataset-dir-file-preview-id') || document.body}
          >
            <IconFont style={{ fontSize: 12 }} className='ad-ml-2 ad-c-subtext ' type='icon-wenhao' />
          </Tooltip>
        </div>
      ),
      dataIndex: 'input',
      align: 'center',
      render: (_value, record: any) => {
        return (
          <Checkbox
            disabled={disabled}
            onChange={e => {
              const checked = e.target.checked;
              checkChange(checked, record.fieldName, 'input');
            }}
            checked={selectedFileInputOutput.input.includes(record.fieldName)}
          />
        );
      },
    },
    {
      title: (
        <span className='ad-center'>
          outputs
          <Tooltip
            arrowPointAtCenter
            title={intl.get('benchmark.config.datasetOutputTooltip')}
            placement='top'
            getPopupContainer={() => document.getElementById('dataset-dir-file-preview-id') || document.body}
          >
            <IconFont style={{ fontSize: 12 }} className='ad-ml-2 ad-c-subtext ' type='icon-wenhao' />
          </Tooltip>
        </span>
      ),
      dataIndex: 'output',
      align: 'center',
      render: (_value, record: any) => {
        return (
          <Checkbox
            disabled={disabled}
            onChange={e => {
              const checked = e.target.checked;
              checkChange(checked, record.fieldName, 'output');
            }}
            checked={selectedFileInputOutput.output.includes(record.fieldName)}
          />
        );
      },
    },
  ];

  const getEmptyText = () => {
    if (!datasetVersionId) {
      return intl.get('benchmark.config.datasetPlaceholder');
    }
    if (dirTreeProps.selectedKeys.length === 0) {
      return intl.get('benchmark.config.selectFileTips');
    }
    if (fileErrorData[currentSelectedDocId]) {
      if (fileErrorData[currentSelectedDocId] === 'emptyData') {
        return intl.get('benchmark.config.datasetFileEmptyTip');
      }
      return intl.get('benchmark.config.datasetFileErrorTip');
    }
  };

  const clearChecked = () => {
    const doc_id = dirTreeProps.selectedKeys[0];
    const cloneValue = value ? _.cloneDeep(value) : [];
    const target = cloneValue.filter(item => item.doc_id !== doc_id);
    onChange?.(target);
  };

  const getEmptyImage = () => {
    if (fileErrorData[currentSelectedDocId]) {
      if (fileErrorData[currentSelectedDocId] === 'emptyData') return empty;
      return invalidFile;
    }
  };

  const renderContentRight = () => {
    if (tableProps.loading) {
      return <LoadingMask loading />;
    }
    if (dirTreeProps.selectedKeys.length === 0) {
      return (
        <div className='ad-center ad-w-100 ad-h-100'>
          <NoDataBox desc={intl.get('benchmark.config.selectFileTip')} imgSrc={selectFile} />
        </div>
      );
    }
    if (isJsonFile) {
      if (!fileErrorData[currentSelectedDocId]) {
        return (
          <div className='ad-w-100 ad-h-100' style={{ overflow: 'auto' }}>
            {JSON.stringify(jsonData)}
          </div>
        );
      }
      return (
        <div className='ad-center ad-w-100 ad-h-100'>
          <NoDataBox desc={getEmptyText()} imgSrc={getEmptyImage()} />
        </div>
      );
    }
    return (
      <ADTable
        showHeader={false}
        showSearch={false}
        columns={[
          { title: intl.get('benchmark.config.dataName'), dataIndex: 'fieldName' },
          { title: intl.get('benchmark.config.previewData'), dataIndex: 'fieldValue' },
        ]}
        dataSource={tableProps.dataSource}
        emptyImage={getEmptyImage()}
        emptyText={getEmptyText()}
        rowKey='fieldName'
        scroll={{ y: 240 }}
      />
    );
  };

  const getClearCheckBtnDisabled = () => {
    const doc_id = dirTreeProps.selectedKeys[0];
    const cloneValue = value || [];
    const target = cloneValue.find(item => item.doc_id === doc_id);
    return !target;
  };

  const renderContent = () => {
    return (
      <div className={`${prefixCls}-wrapper ad-pl-9`} id='dataset-dir-file-preview-id'>
        {dirTreeProps.data.length > 0 && (
          <div className={`ad-pb-5 ${prefixCls}-borderL`}>
            <div className={'ad-flex ad-border '} style={{ height: 300 }}>
              <div className={`${prefixCls}-left`}>
                <AdTree
                  selectedKeys={dirTreeProps.selectedKeys}
                  onSelect={onSelect as any}
                  loadedKeys={dirTreeProps.loadedKeys}
                  loadData={onLoadData}
                  expandedKeys={dirTreeProps.expandedKeys}
                  onExpand={(expandedKeys: any) => {
                    setDirTreeProps(prevState => ({ ...prevState, expandedKeys }));
                  }}
                  treeData={dirTreeProps.data}
                  titleRender={titleRender}
                />
              </div>
              <div className={`${prefixCls}-right ad-flex-item-full-width`}>{renderContentRight()}</div>
            </div>
          </div>
        )}
        <div className='DatasetDirFilePreview-step'>
          <span className='ad-space-between'>
            <span style={{ fontWeight: 600 }}>{intl.get('benchmark.config.configInputsOutPuts')}</span>
            {!disabled && (
              <span
                onClick={() => {
                  if (deleteDisabled || getClearCheckBtnDisabled()) return;
                  clearChecked();
                }}
                className={`${
                  deleteDisabled || getClearCheckBtnDisabled() ? 'ad-c-watermark ad-not-allowed' : 'ad-c-text-lower ad-c-hover-color-deepens ad-pointer'
                } ad-ml-3 `}
              >
                <IconFont style={{ marginTop: -2 }} className='ad-mr-2' type='icon-quanbuyichu' />
                {intl.get('global.clearBtn')}
              </span>
            )}
          </span>
          <div className='ad-mt-2'>
            <div className='ad-flex-column ad-c-text-lower ad-mb-4' style={{ fontSize: 12 }}>
              <span>{intl.get('benchmark.config.datasetTooltip1')}</span>
            </div>

            {dirTreeProps.selectedKeys.length > 0 && tableProps.dataSource.length > 0 && (
              <ADTable
                showHeader={false}
                showSearch={false}
                columns={columns}
                dataSource={tableProps.dataSource}
                emptyImage={getEmptyImage()}
                emptyText={getEmptyText()}
                rowKey='fieldName'
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return renderContent();
};

export default DatasetDirFilePreview;
