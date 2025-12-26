import React, { useRef, useState } from 'react';
import './style.less';
import { Graph, Node } from '@antv/x6';
import IconFont from '@/components/IconFont';
import intl from 'react-intl-universal';
import Format from '@/components/Format';
import DatasetNodeForm, { DatasetNodeFormRefType } from './DatasetNodeForm';
import { tipModalFunc } from '@/components/TipModal';
import { getAllDatasetMetricNode, removeBenchmarkChildNode } from '@/pages/Benchmark/BenchmarkConfig/BenchmarkConfigGraph/ConfigGraph/assistant';
import { Tooltip } from 'antd';
import _ from 'lodash';
import DropdownInput from '@/components/AdReactX6/components/X6DagNode/DatasetNode/DatasetNodeForm/DropdownInput';
import classNames from 'classnames';

const DatasetNode = (props: { node: Node }) => {
  const { node } = props;
  const nodeData = node?.getData();
  const datasetData = nodeData.dataset;
  const readOnly = nodeData.readOnly;
  const allDataset = datasetData.allDatasetData;
  const allDatasetVersion = datasetData.allDatasetVersionData;
  const datasetList = datasetData.datasetList;
  const [formData, setFormData] = useState<any>();
  const nodeFormRef = useRef<DatasetNodeFormRefType>();
  const [titleEdit, setTitleEdit] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const openForm = (data?: any) => {
    const formVisible = datasetData.formVisible;
    if (formVisible) {
      if (!data) {
        nodeFormRef.current?.resetForm();
      }
    }
    node.setData({
      dataset: {
        ...datasetData,
        formVisible: true,
      },
      metric: {
        ...nodeData.metric,
        formVisible: false,
      },
    });
    setFormData(data ?? undefined);
  };

  const getDatasetName = (id: string) => {
    if (id && id.includes('/')) {
      const [datasetId, versionId] = id.split('/');
      const target = allDataset.find((item: any) => item.id === datasetId);
      if (target) {
        return target.name + '/' + allDatasetVersion[versionId] ?? versionId;
      }
    }
    return id;
  };

  const deleteNode = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('global.deleteTitle'),
      content: intl.get('benchmark.config.deleteDatasetNodeTip'),
    });
    if (isOk) {
      const graph = nodeData.graph as Graph;
      removeBenchmarkChildNode(node, graph);
      graph.removeNode(node);
    }
  };

  const existDataset = () => {
    const arr: string[] = [];
    const allDatasetNode = getAllDatasetMetricNode(nodeData.graph as Graph).filter(item => {
      const itemData = item.getData();
      return item.id !== node.id && itemData.dataset.taskNodeId === datasetData.taskNodeId;
    });
    allDatasetNode.forEach(item => {
      const data = item.getData();
      arr.push(data.dataset.name);
    });
    return arr;
  };

  const saveNodeName = (value: string, errorText: string) => {
    if (!errorText) {
      node.updateData({
        dataset: {
          ...datasetData,
          name: value?.trim(),
        },
      });
      setTitleEdit(false);
    }
  };

  const deleteSingleFile = (datasetVersionId: string, doc_id: string) => {
    if (datasetVersionId) {
      const datasetList = _.cloneDeep(datasetData.datasetList);
      datasetList[datasetVersionId] = datasetList[datasetVersionId].filter((item: any) => item.doc_id !== doc_id);
      (node as Node).updateData({
        dataset: {
          ...datasetData,
          datasetList,
          formVisible: false,
        },
      });
    }
  };

  const openDrawer = () => {
    if (!_.isEmpty(datasetList)) {
      const datasetVersionId = Object.keys(datasetList)[0];
      openForm({
        datasetVersionId,
        fileInputOutput: datasetList[datasetVersionId],
      });
    } else {
      openForm();
    }
  };
  return (
    <>
      <div className='ad-w-100 ad-x6-dag-dataset-node' onClick={openDrawer}>
        <div
          className={classNames('ad-space-between', {
            'ad-border-b': titleEdit,
            'ad-border-error': !!inputError,
          })}
          style={{ minHeight: 24 }}
        >
          {titleEdit ? (
            <DropdownInput
              existData={existDataset()}
              value={inputValue}
              // @ts-ignore
              onChange={(e: any, error: any) => {
                setInputValue(e.target.value);
                setInputError(error);
              }}
              onBlur={saveNodeName}
              onPressEnter={saveNodeName}
            />
          ) : (
            <>
              <span className='ad-align-center ad-flex-item-full-width'>
                {/* <span className="ad-align-center" style={{ maxWidth: '100%' }}>*/}
                <div className='ad-align-center ad-w-100'>
                  <IconFont border type='icon-color-sjj-126EE3' style={{ width: 24, height: 24, fontSize: 14, borderRadius: 6 }} />
                  <span
                    onClick={e => {
                      if (!readOnly) {
                        e.stopPropagation();
                        setTimeout(() => {
                          setTitleEdit(true);
                          setInputValue(datasetData.name);
                        }, 0);
                      }
                    }}
                    className={classNames('ad-ml-2 ad-flex-item-full-width ad-ellipsis', {
                      'DatasetNode-hover-border': !readOnly,
                    })}
                    title={datasetData.name}
                  >
                    {datasetData.name}
                  </span>
                  {datasetData.error[node.id] && (
                    <Tooltip placement='top' title={datasetData.error[node.id]}>
                      <IconFont style={{ fontSize: 18 }} type='graph-warning1' className='ad-c-error ad-ml-1' />
                    </Tooltip>
                  )}
                </div>
              </span>
            </>
          )}
        </div>

        {Object.keys(datasetList)?.map((dataset_id, index) => {
          const fileListDom = datasetList[dataset_id].map((fileItem: any) => {
            return (
              <div
                key={fileItem.doc_id}
                className='ad-w-100 ad-x6-dag-dataset-item ad-align-center ad-mt-2 ad-pointer'
                onClick={e => {
                  e.stopPropagation();
                  openForm({
                    datasetVersionId: dataset_id,
                    fileInputOutput: datasetList[dataset_id],
                    // index,
                    doc_id: fileItem.doc_id,
                  });
                }}
              >
                {/*<div className="ad-flex-item-full-width ad-ellipsis">{getDatasetName(dataset_id)}</div>*/}
                <div className='ad-flex-item-full-width ad-ellipsis'>{fileItem.doc_name}</div>
                {!!fileItem.error && (
                  <Tooltip placement='top' title={fileItem.error}>
                    <IconFont style={{ fontSize: 18 }} type='graph-warning1' className='ad-c-error' />
                  </Tooltip>
                )}
                {!readOnly && (
                  <Format.Button
                    onClick={e => {
                      e.stopPropagation();
                      deleteSingleFile(dataset_id, fileItem.doc_id);
                    }}
                    type='icon'
                    size='small'
                    className='ad-x6-dag-dataset-item-delete ad-c-watermark'
                    style={{ fontSize: 14 }}
                  >
                    <IconFont type='icon-shibai' />
                  </Format.Button>
                )}
              </div>
            );
          });
          return [...fileListDom];
        })}
        {!readOnly && (
          <div className='ad-x6-dag-dataset-item ad-center ad-mt-2 ad-c-text-lower ad-pointer'>
            <IconFont className='ad-c-watermark' type='icon-mouse_add' style={{ fontSize: 12 }} />
            <span style={{ fontSize: 12 }} className='ad-ml-1'>
              {intl.get('benchmark.config.addDataset')}
            </span>
          </div>
        )}
      </div>
      <DatasetNodeForm
        ref={nodeFormRef}
        visible={!!datasetData.formVisible}
        node={node}
        graph={nodeData.graph as Graph}
        editData={formData}
        onClear={() => {
          setFormData(undefined);
        }}
        getDatasetName={getDatasetName}
      />
    </>
  );
};

export default DatasetNode;
