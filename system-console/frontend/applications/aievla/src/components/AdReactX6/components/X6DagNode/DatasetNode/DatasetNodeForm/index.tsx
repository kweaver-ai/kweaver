import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Graph, Node } from '@antv/x6';
import { Form } from 'antd';

import getNumberFromString from '@/utils/helper/getNumberFromString';
import useDeepCompareEffect from '@/hooks/useDeepCompareEffect';
import { dataSetGetById } from '@/services/dataSet';

import IconFont from '@/components/IconFont';
import AdDrawer from '@/components/AdDrawer';
import AdTreeSelect from '@/components/AdTreeSelect';

import DatasetDirFilePreview from './DatasetDirFilePreview';
import { generateTreeNodeData, getConfigDatasetVersion, updateTreeData } from './assistant';

import './style.less';

const FormItem = Form.Item;
export type DatasetNodeFormRefType = {
  resetForm: () => void;
};
const DatasetNodeForm = forwardRef<DatasetNodeFormRefType, any>(({ node, editData, onClear, getDatasetName }, ref) => {
  const nodeData = node?.getData();
  const datasetData = nodeData.dataset;
  const readOnly = nodeData.readOnly;
  const allDataset = datasetData.allDatasetData;
  const [form] = Form.useForm();
  const [treeProps, setTreeProps] = useState({
    data: [] as any,
    expandedKeys: [] as string[],
    loadedKeys: [] as string[],
  });
  const graph = nodeData.graph as Graph;
  const lastDatasetVersionId = useRef<string>(''); // 记录上一次选择的数据集版本id
  const cacheFormData = useRef<Record<string, any>>({});
  const deleteDisabled = !form.getFieldValue('datasetVersionId');

  useImperativeHandle(ref, () => ({
    resetForm,
  }));

  useEffect(() => {
    return () => {
      // 组件卸载的时候  获取一次最新的数据集数据
      datasetData.getAllDataset();
    };
  }, []);

  useDeepCompareEffect(() => {
    const initialTreeData = generateTreeNodeData(allDataset, { selectable: false });

    if (editData) {
      cacheFormData.current[editData.datasetVersionId] = editData.fileInputOutput;
      lastDatasetVersionId.current = editData.datasetVersionId;
      const cloneDeepEditData = _.cloneDeep(editData);
      form.setFieldsValue(cloneDeepEditData);
      const [datasetId] = cloneDeepEditData.datasetVersionId.split('/');
      setTreeProps(prevState => ({ ...prevState, expandedKeys: [datasetId] }));
      const target = allDataset.find((item: any) => item.id === datasetId);
      if (target) {
        onLoadData({ value: datasetId, title: target.name }, initialTreeData);
      }
    } else {
      setTreeProps(prevState => ({ ...prevState, data: initialTreeData }));
    }

    return () => {
      resetForm();
    };
  }, [editData, allDataset]);

  /**
   * 重置表单的数据
   */
  const resetForm = () => {
    lastDatasetVersionId.current = '';
    cacheFormData.current = {};
    form.setFieldsValue({ datasetVersionId: undefined, fileInputOutput: [] });
    const initialTreeData = generateTreeNodeData(allDataset, { selectable: false });
    setTreeProps(() => ({ data: initialTreeData, expandedKeys: [] as string[], loadedKeys: [] as string[] }));
  };

  const onFileInputOutputChange = (formData: any) => {
    cacheFormData.current[formData.datasetVersionId] = formData.fileInputOutput;
  };

  const formChange = (values: any, allValues: any) => {
    const formData = _.cloneDeep(allValues);
    if ('datasetVersionId' in values) {
      const fileInputOutputValue = cacheFormData.current[values.datasetVersionId] ?? [];
      form.setFieldsValue({
        fileInputOutput: fileInputOutputValue,
      });
      formData.fileInputOutput = fileInputOutputValue;
    }
    onFileInputOutputChange(formData);
    const nodeDatasetList = _.cloneDeep(datasetData.datasetList);
    const arr = Object.keys(nodeDatasetList);
    const targetIndex = arr.findIndex(item => item === lastDatasetVersionId.current);
    if (targetIndex !== -1) {
      arr[targetIndex] = formData.datasetVersionId;
    } else {
      arr.push(formData.datasetVersionId);
    }
    const newNodeDatasetList: any = {};
    arr.forEach(key => {
      if (key === formData.datasetVersionId) {
        newNodeDatasetList[key] = formData.fileInputOutput ?? [];
      } else {
        newNodeDatasetList[key] = nodeDatasetList[key];
      }
    });

    // 数据集节点选择了文件的话，清除节点的至少选择一个数据集文件的报错提示
    const errorData = datasetData.error;
    Object.keys(newNodeDatasetList).forEach(id => {
      if (newNodeDatasetList[id].length > 0 && errorData[node.id]) {
        delete errorData[node.id];
      }
    });
    const newDatasetObj = { ...datasetData, datasetList: newNodeDatasetList, error: errorData };

    // 非编辑模式的时候，将选中的数据集/版本作为节点的名字
    if (!editData) {
      newDatasetObj.name = getDatasetName(formData.datasetVersionId);
    }
    node.updateData({ dataset: newDatasetObj });

    lastDatasetVersionId.current = formData.datasetVersionId;
  };
  const deleteSingleDataset = () => {
    if (deleteDisabled) return;
    const datasetVersionId = form.getFieldValue('datasetVersionId');
    if (datasetVersionId) {
      const datasetList = _.cloneDeep(datasetData.datasetList);
      delete datasetList[datasetVersionId];
      const newDataset = { ...datasetData, datasetList };
      (node as Node).updateData({
        dataset: newDataset,
      });
      onClear();
      resetForm();
    }
  };

  const updateVersionDataSource = (data: any) => {
    const versionObj: any = {};
    Object.keys(data.versions).forEach(version => {
      versionObj[data.versions[version]] = version;
    });
    const allDatasetVersion = datasetData.allDatasetVersionData;
    const newAllDatasetVersion = { ...allDatasetVersion, ...versionObj };
    node.updateData({
      dataset: { ...datasetData, allDatasetVersionData: newAllDatasetVersion },
    });
    datasetData.updateDatasetVersionData(newAllDatasetVersion);
  };

  const onLoadData = (treeNode: any, treeDataSource: any = treeProps.data) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<any>(async resolve => {
      const data = await dataSetGetById(treeNode.value);
      if (data) {
        const versionArr = Object.keys(data.versions).sort((a, b) => getNumberFromString(a)! - getNumberFromString(b)!);
        // 展开树节点的同时  同步更新数据集节点身上的版本数据源
        updateVersionDataSource(data);

        // 获取当前任务节点下所有已配置数据集以及版本id
        const idData = getConfigDatasetVersion(graph, datasetData.taskNodeId);
        const versionData = versionArr.map(version => {
          const id = `${treeNode.value}/${data.versions[version]}`;
          return {
            id,
            name: version, // 树节点的名字
            label: `${treeNode.title}/${version}`, // 回填到input框的文字,
            disabled: idData[treeNode.value] && idData[treeNode.value].includes(data.versions[version]),
          };
        });
        const treeData = generateTreeNodeData(versionData, { parentKey: treeNode.value as string, isLeaf: true });

        const newTreeData = updateTreeData(treeDataSource, treeNode.value, treeData);

        setTreeProps(prevState => ({
          ...prevState,
          data: newTreeData,
          loadedKeys: [...prevState.loadedKeys, treeNode.value],
        }));
        resolve(undefined);
      }
    });
  };

  return (
    <AdDrawer
      width={800}
      drag={{ maxWidth: 1440 }}
      getContainer={document.querySelector('.BenchmarkConfigGraph') as HTMLElement}
      title={datasetData.name}
      subTitle={intl.get('benchmark.config.datasetSubTitle')}
      open
      extra={
        !readOnly && (
          <span
            style={{ fontWeight: 400 }}
            onClick={deleteSingleDataset}
            className={`${
              deleteDisabled ? 'ad-c-watermark ad-not-allowed' : 'ad-c-text-lower ad-c-hover-color-deepens ad-pointer'
            } ad-ml-3 ad-align-center ad-font-14`}
          >
            <IconFont style={{ marginTop: -2 }} className='ad-mr-2' type='icon-quanbuyichu' />
            {intl.get('global.clear')}
          </span>
        )
      }
    >
      <Form form={form} layout='vertical' onValuesChange={formChange}>
        <FormItem
          style={{ marginBottom: 0 }}
          className={classNames('ad-pb-4 ad-pl-9 datasetVersionId-form', {
            'datasetVersionId-form-borderL': true,
          })}
          name='datasetVersionId'
          label={<span style={{ fontWeight: 600 }}>{intl.get('benchmark.config.datasetFieldName')}</span>}
        >
          <AdTreeSelect
            style={{ minWidth: 232, width: 'unset' }}
            disabled={readOnly || !!editData}
            treeLoadedKeys={treeProps.loadedKeys}
            loadData={onLoadData}
            treeData={treeProps.data}
            placeholder={intl.get('benchmark.config.datasetPlaceholder')}
            treeNodeLabelProp='label' // 选中的节点身上回填到input框的属性
            treeExpandedKeys={treeProps.expandedKeys}
            onTreeExpand={(expandedKeys: any) => {
              setTreeProps(prevState => ({ ...prevState, expandedKeys }));
            }}
          />
        </FormItem>
        <FormItem shouldUpdate noStyle>
          {({ getFieldValue }) => {
            const datasetVersionId = getFieldValue('datasetVersionId');
            return (
              <FormItem initialValue={[]} noStyle name='fileInputOutput'>
                <DatasetDirFilePreview datasetVersionId={datasetVersionId} disabled={readOnly} deleteDisabled={deleteDisabled} />
              </FormItem>
            );
          }}
        </FormItem>
      </Form>
    </AdDrawer>
  );
});
export default forwardRef(({ visible, ...restProps }: any, ref) => {
  return visible && <DatasetNodeForm ref={ref} {...restProps} />;
});
