import { useEffect, useMemo, useRef, useState } from 'react';
import { Edge } from '@antv/x6';
import intl from 'react-intl-universal';
import { UploadFile } from 'antd/lib/upload/interface';

import useLatestState from '@/hooks/useLatestState';
import { deleteFile, downloadAdapterFileTemplate, downloadFile, uploadFile } from '@/services/benchmark';

import AdDrawer from '@/components/AdDrawer';
import LoadingMask from '@/components/LoadingMask';

import { useConfigGraphContext } from '../../ConfigGraphContext';
import DiagramModal from './DiagramModal';
import UploadPythonFile from './UploadPythonFile';

import './style.less';

const AdapterDrawer = ({ edge, readOnly }: any) => {
  const { configGraphStore, setConfigGraphStore } = useConfigGraphContext();
  const { configData, deleteAdapterFilePath } = configGraphStore || {};

  const [file, setFile] = useLatestState<UploadFile[]>([]);
  const filePath = useRef<string>('');
  const edgeData = edge.getData();
  const adapterList = edgeData.adapterList;
  const [loading, setLoading] = useState(true);
  const [diagramModal, setDiagramModal] = useState<boolean>(false);

  useEffect(() => {
    if (adapterList.length > 0) {
      filePath.current = adapterList[0];
      getFileByPath(filePath.current);
    } else {
      setLoading(false);
    }
  }, []);

  const getFileByPath = async (path: string) => {
    const data = await downloadFile(path);
    setLoading(false);
    if (data) {
      // 将后端返回的文件六转化为ANTD组件需要的File
      const file = new File([data.blob], data.name, { type: '"text/x-python"' }) as any;
      const obj: any = {
        name: file.name,
        size: file.size,
        status: 'done',
        type: file.type,
        originFileObj: file,
        lastModified: file.file,
        lastModifiedDate: file.lastModifiedDate,
        percent: 100,
      };
      setFile([obj]);
    }
  };

  const onTemplateDownload = async () => {
    const edgeConfig = edge as Edge;
    const datasetMetricNode = edgeConfig.getSourceNode();
    const datasetMetricData = datasetMetricNode!.getData();
    const datasetData = datasetMetricData.dataset;
    const allDataset = datasetData.allDatasetData;
    const indicatorData = datasetMetricData.metric;
    const getDatasetName = (id: string) => {
      const target = allDataset.find((item: any) => item.id === id);
      if (target) return target.name;
      return id;
    };
    const dataset_name_list: string[] = [];
    Object.keys(datasetData.datasetList).forEach(id => {
      const [datasetId, versionId] = id.split('/');
      const name = getDatasetName(datasetId);
      dataset_name_list.push(`${name}/${datasetData.allDatasetVersionData[versionId]}`);
    });
    const metric_id_list = indicatorData.metricIdList;
    const param = { dataset_name_list, metric_id_list, config_id: configData?.id, type: 'dataset_adapter' };
    await downloadAdapterFileTemplate(param);
  };

  /** 文件上传变化 */
  const onFileChange = (status: string, info: any) => {
    if (!status) return;
    if (status === 'error') info.file.response = info.file?.error;
    if (status === 'removed') {
      onRemove();
      return;
    }
    setFile([info.file]);
  };

  const onStartToUploadFile = async (file: any, config: any, onError: any, onSuccess: any) => {
    const data = await uploadFile({ type: 'adapter', name: file.name, file_suffix: 'py', size: Math.floor(file.size! / 1024) }, file, config);
    if (data) {
      if (filePath.current) {
        await onRemove();
      }
      filePath.current = data.path;
      edge.updateData({ adapterList: [data.path] });
      onSuccess(file);
    } else {
      onError();
    }
  };

  const onRemove = async () => {
    const datasetNode = (edge as Edge).getSourceNode();
    // 看当前要删除的文件的path和编辑数据身上的文件path是不是一致，一致的话不能立即删除，要缓存住，等点击保存按钮之后 再进行删除
    let isDelete = true;
    configData?.task.forEach(taskItem => {
      taskItem.dataset.forEach(datasetItem => {
        if (datasetItem.dataset_config_id === datasetNode?.id) {
          if (datasetItem.metric.adapter_list.includes(filePath.current)) {
            isDelete = false;
            setConfigGraphStore(preState => ({
              ...preState,
              deleteAdapterFilePath: [...deleteAdapterFilePath, filePath.current],
            }));
          }
        }
      });
    });
    if (filePath.current) {
      const data = isDelete ? await deleteFile(filePath.current) : true;
      if (data) {
        setFile([]);
        filePath.current = '';
        edge.updateData({ adapterList: [] });
      }
    }
  };

  const subTitle = useMemo(() => {
    return intl.get('benchmark.config.adapterDesc').split('|');
  }, []);

  return (
    <AdDrawer
      width={560}
      drag={{ maxWidth: 960 }}
      getContainer={document.querySelector('.BenchmarkConfigGraph') as HTMLElement}
      open
      title='Adapter'
      subTitle={
        <>
          <span>{subTitle[0]}</span>
          <span onClick={() => setDiagramModal(true)} className='ad-c-primary ad-pointer'>
            {subTitle[1]}
          </span>
          <span>{subTitle[2]}</span>
        </>
      }
    >
      <LoadingMask loading={loading} />
      <UploadPythonFile
        value={file}
        onChange={onFileChange}
        onTemplateDownload={onTemplateDownload}
        onRemove={onRemove}
        disabled={readOnly}
        onStartToUploadFile={onStartToUploadFile}
      />
      <DiagramModal
        open={diagramModal}
        closeModal={() => {
          setDiagramModal(false);
        }}
      />
    </AdDrawer>
  );
};

export default ({ visible, ...restProps }: any) => {
  return visible && <AdapterDrawer {...restProps} />;
};
