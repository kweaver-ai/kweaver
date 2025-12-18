import { API, MicroAppContext } from "@applet/common";
import { Modal, Tree, Table } from "antd";
import { DataNode } from "antd/lib/tree";
import { useState, useEffect, useContext, useCallback } from "react";
import styles from "./select-data-view.module.less";
import { autoConvertToTableData } from "../../../utils/format-table";
import SearchInput from "../../search-input";
import _ from "lodash";
import { useHandleErrReq } from "../../../utils/hooks";

const SelectDataView = ({
  closeModalOpen,
  isModalOpen,
  selectDataView,
}: any) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const { prefixUrl } = useContext(MicroAppContext);
  const [treeData, setTreeData] = useState<any>();
  const [tableDataSource, setTableDataSource] = useState<any>({});
  const [selectTeeData, setSelectTeeData] = useState<any>({});
  const [dataList, setDataList] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const handleErr = useHandleErrReq();

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const onChange = (value: string) => {
    setSearchValue(value);
    setDataList([]);
    debouncedSearch(value);
  };

  const debouncedSearch = useCallback(
  _.debounce((value: string) => {
    setDataList([]);
    getDataViews({ name_pattern: value, group_id: '__all' });
  }, 200),
  [] // 空依赖数组，确保函数只创建一次
);

  const getDataViews = async (data: any) => {
    const { group_id, name_pattern } = data;
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/mdl-data-model/v1/data-views?group_id=${
          group_id || ""
        }&limit=-1&name_pattern=${name_pattern || ""}`
      );
      if (name_pattern) {
        setDataList(data?.entries);
      } else {
        const result = data?.entries.map((item: any) => ({
          ...item,
          key: item.id,
          title: item.name,
          isLeaf: true,
          selectable: true,
        }));
        setTreeData((origin: any) => updateTreeData(origin, group_id, result));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const dataViewGroups = async () => {
    try {
      const { data } = await API.axios.get(
        `${prefixUrl}/api/mdl-data-model/v1/data-view-groups?limit=-1`
      );
      const result = data?.entries?.filter((item: any) => item.name && item.name.trim() !== '')?.map((item: any) => ({
        key: item.id,
        title: item.name,
        isLeaf: item?.data_view_count > 0 ? false : true,
        selectable: false,
      }));
      setTreeData(result);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    dataViewGroups();
  }, []);

  const handleOk = () => {
    selectDataView?.(selectTeeData);
    closeModalOpen?.();
  };

  const handleCancel = () => {
    closeModalOpen?.();
  };

  const updateTreeData = (
    list: DataNode[],
    key: React.Key,
    children: DataNode[]
  ): DataNode[] =>
    list.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });
  const onLoadData = ({ key, children }: any) =>
    new Promise<void>((resolve) => {
      if (children) {
        resolve();
        return;
      }
      setTimeout(() => {
        getDataViews({ group_id: key });
        resolve();
      }, 1000);
    });

  const dataViewsTab = async (id: string) => {
    setLoading(true)
    try {
      const { data } = await API.axios.post(
        `${prefixUrl}/api/mdl-uniquery/v1/data-views/${id}`,
        {},
        {
          headers: {
            "x-http-method-override": "GET",
          },
        }
      );
      const result = autoConvertToTableData(data?.entries);
      setTableDataSource(result);
    } catch (error: any) {
      handleErr({ error: error?.response });
    } finally {
      setLoading(false)
    }
  };

  const onSelectTree = (selectedKeys: React.Key[], info: { node: any }) => {
    // 只取第一个选中的key
    if (selectedKeys.length > 0) {
      dataViewsTab(selectedKeys[0] as string);
      const { node } = info;
      const value = { value: node?.key, label: node?.title };
      setSelectTeeData(value);
    }
  };

  const clickDataView = (item: any) => {
    dataViewsTab(item?.id);
    const value = { value: item?.id, label: item?.name };
    setSelectTeeData(value);
  };

  return (
    <Modal
      title="选择数据视图"
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      className={styles["data-view"]}
      width={900}
    >
      <div className={styles["data-view-content"]}>
        <div className={styles["data-view-left"]}>
          <SearchInput placeholder="搜索" onSearch={onChange} style={{width:'100%',marginLeft:0}}/>
          {searchValue ? (
            <ul className={styles["data-view-list"]}>
              {dataList?.map((item: any) => (
                <li key={item.id} onClick={() => clickDataView(item)} className={selectTeeData?.value === item.id ? styles.selected : ''}>
                  {item.name}
                </li>
              ))}
            </ul>
          ) : (
            <Tree
              onExpand={onExpand}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              treeData={treeData}
              loadData={onLoadData}
              className={styles["data-view-tree"]}
              onSelect={onSelectTree}
              blockNode
            />
          )}
        </div>
        <div className={styles["data-view-right"]}>
          <div style={{ marginLeft: "20px" }}>
            预览 <span style={{ opacity: "0.5" }}> （展示部分数据）</span>
          </div>
          <Table
            className={styles["data-view-table"]}
            pagination={false}
            dataSource={tableDataSource?.dataSource}
            columns={tableDataSource?.columns}
            loading={loading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SelectDataView;
