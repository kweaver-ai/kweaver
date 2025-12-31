import { useEffect, useMemo, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { DownOutlined, PicRightOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { message, Splitter, Tree } from 'antd';
import classnames from 'classnames';
import HOOKS from '@/hooks';
import { IconType, NodeType } from '@/pages/CustomDataView/type';
import { IconFont } from '@/web-library/common';
import FormHeader from '../FormHeader';
import Editor, { getFormatSql } from './Editor';
import styles from './index.module.less';
import { useDataViewContext } from '../../../context';

const FieldSQL = () => {
  const { dataViewTotalInfo, setDataViewTotalInfo, selectedDataView, setSelectedDataView, setPreviewNode } = useDataViewContext();
  const [value, setValue] = useState('');
  const [preNodes, setPreNodes] = useState<any[]>([]);
  const editorRef = useRef<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { updateDataViewNode, getNodePreview } = HOOKS.useDataView({
    dataViewTotalInfo,
    setDataViewTotalInfo,
    setSelectedDataView,
    setPreviewNode,
  });

  useEffect(() => {
    // 前序节点
    if (selectedDataView?.input_nodes?.length > 0) {
      const nodeList = dataViewTotalInfo?.data_scope || [];
      const preNodes = nodeList.filter((item: any) => selectedDataView?.input_nodes?.includes(item.id));
      setPreNodes(preNodes);
    } else {
      setPreNodes([]);
    }
    if (selectedDataView?.config?.sql_expression) {
      setValue(selectedDataView?.config?.sql_expression);
    }
  }, [selectedDataView, dataViewTotalInfo]);

  const treeData = useMemo(() => {
    return preNodes.map((item: any) => ({
      title: (
        <div onClick={() => insertSql(`{{.${item.id}}}`)} className={styles.treeTitleBox}>
          <IconFont type="icon-dip-usedata" />
          <div className={styles.treeTitleBox}>
            <div>{item.title}</div>
            <div className={styles.treeDesc}>[{item.id}]</div>
          </div>
        </div>
      ),
      key: item.id,
      children: item.output_fields?.map((child: any) => ({
        title: (
          <div className={styles.treeTitleBox} onClick={() => insertSql(`"${child.name}"`)}>
            <IconFont type={IconType[child.type as keyof typeof IconType]} />
            <div>
              <div className={styles.treeTitle}>{child.display_name}</div>
              <div className={styles.treeDesc}>{child.original_name}</div>
            </div>
          </div>
        ),
        key: child.id,
      })),
    }));
  }, [preNodes]);

  const onChange = (value: string) => {
    setValue(value);
  };

  const insertSql = (newSql: string) => {
    editorRef?.current?.insertText(newSql, false);
  };

  const handleOpreate = async () => {
    if (!value) {
      message.warning(intl.get('CustomDataView.FieldSQL.enterSQLStatement'));
      return;
    }

    getNodePreview(
      {
        ...selectedDataView,
        config: {
          ...selectedDataView?.config,
          sql_expression: value,
        },
      },
      true
    );
  };

  const handleFormat = () => {
    if (!value) {
      message.warning(intl.get('CustomDataView.FieldSQL.enterSQLStatement'));
      return;
    }
    const formattedSql = getFormatSql(value);
    setValue(formattedSql);
  };

  const handleSubmit = async () => {
    if (!value) {
      message.warning(intl.get('CustomDataView.FieldSQL.enterSQLStatement'));
      return;
    }

    const newNodeData = {
      ...selectedDataView,
      config: {
        ...selectedDataView?.config,
        sql_expression: value,
      },
      output_fields: [],
      node_status: 'success',
    };
    setLoading(true);
    updateDataViewNode(newNodeData, selectedDataView.id, NodeType.SQL).finally(() => {
      setLoading(false);
    });
  };
  return (
    <div className={styles.mainBox}>
      <FormHeader
        title={intl.get('CustomDataView.OperateBox.sqlSetting')}
        icon="icon-dip-color-SQLsuanzi"
        onSubmit={handleSubmit}
        onCancel={() => setSelectedDataView(null)}
        loading={loading}
      />
      <div className={styles.contentBox}>
        <Splitter style={{ height: '100%' }}>
          <Splitter.Panel collapsible defaultSize="20%" min="20%" max="50%">
            <div className={styles.treeBox}>
              <div className={styles.h2}>
                <span>{intl.get('CustomDataView.FieldSQL.previousNodes')}</span>
                <span>（{preNodes?.length || 0}）</span>
              </div>
              <Tree treeData={treeData} selectable={false} showIcon defaultExpandAll switcherIcon={<DownOutlined />} />
            </div>
          </Splitter.Panel>
          <Splitter.Panel>
            <div className={styles.editorBox}>
              <div className={styles.operateBox}>
                <div className={classnames(styles.operateItem, { [styles.disabled]: !value })} onClick={() => handleOpreate()}>
                  <PlayCircleOutlined />
                  <span>{intl.get('Global.execute')}</span>
                </div>
                <div className={classnames(styles.operateItem, { [styles.disabled]: !value })} onClick={handleFormat}>
                  <PicRightOutlined />
                  <span>{intl.get('Global.format')}</span>
                </div>
                <div className={styles.operateTip}>{intl.get('CustomDataView.FieldSQL.operateTip')}</div>
              </div>
              <Editor value={value} onChange={onChange} ref={editorRef} />
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>
    </div>
  );
};

export default FieldSQL;
