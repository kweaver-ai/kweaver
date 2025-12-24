import { API, MicroAppContext } from "@applet/common";
import { Modal, Table } from "antd";
import { useState, useEffect, useContext } from "react";
import styles from "./select-data-view.module.less";
import { autoConvertToTableData } from "../../../utils/format-table";
import _ from "lodash";
import { useHandleErrReq } from "../../../utils/hooks";

const IncrementalDataView = ({
  closeModalOpen,
  isModalOpen,
  selectDataView,
}: any) => {
  const { prefixUrl } = useContext(MicroAppContext);
  const [tableDataSource, setTableDataSource] = useState<any>({});
  const handleErr = useHandleErrReq();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    dataViewsTab();
  }, []);

  const handleOk = () => {
    closeModalOpen?.();
  };

  const handleCancel = () => {
    closeModalOpen?.();
  };

  const dataViewsTab = async () => {
    setLoading(true);
    try {
      const { id, incrementField, incrementValue, filter, sql_str, type } =
        selectDataView;
      let increment: any;
      if (
        [
          "number",
          "int",
          "integer",
          "float",
          "double",
          "real",
          "DOUBLE",
          // "datatime",
          // "timestamp",
          // "time",
          // "data",
        ].includes(type)
      ) {
        increment = `${incrementValue}`;
      } else {
        increment = `'${incrementValue}'`;
      }

      let sql;
      if (filter && (incrementValue || incrementValue === 0)) {
        sql = `${sql_str} where "${incrementField}" >= ${increment} and (${filter}) order by "${incrementField}" asc`;
      } else if (filter) {
        sql = `${sql_str} where (${filter}) order by "${incrementField}" asc`;
      } else if (incrementValue || incrementValue === 0) {
        sql = `${sql_str} where "${incrementField}" >= ${increment} order by "${incrementField}" asc`;
      }

      const { data } = await API.axios.post(
        `${prefixUrl}/api/mdl-uniquery/v1/data-views/${id}`,
        {
          need_total: true,
          sql,
          limit: 50,
        },
        {
          headers: {
            "X-Http-Method-Override": "GET",
          },
        }
      );

      const result = autoConvertToTableData(data?.entries);
      setTableDataSource(result);
    } catch (error: any) {
      handleErr({ error: error?.response });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="数据预览"
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
      className={styles["data-view"]}
      width={900}
    >
      <div className={styles["data-view-content"]}>
        <div className={styles["data-view-right"]} style={{ width: "100%" }}>
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

export default IncrementalDataView;
