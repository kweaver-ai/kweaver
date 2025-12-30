import { useEffect, useState } from 'react';
import { Collapse, Table } from 'antd';
import { dereference, getTableData } from '@/utils/operator';
const { Panel } = Collapse;

// 生成参数表格数据的函数
const generateParamsTableData = (parameters: any[]) => {
  return parameters.map(item => ({
    ...item,
    key: item.in + '_' + item.name,
    type: item.schema?.type,
  }));
};

const JsonschemaTab = ({ operatorInfo, type }: any) => {
  const [tableData, setTableData] = useState<any>([]);
  const jsonSchema = operatorInfo?.metadata?.api_spec;

  useEffect(() => {
    if (type === 'Inputs') {
      // 生成 header、query、path、cookie 参数的表格数据
      const headerQueryPathCookieParams = generateParamsTableData(jsonSchema?.parameters || []);
      // 处理 body 参数
      const data =
        jsonSchema?.request_body?.content['application/json']?.schema ||
        jsonSchema?.request_body?.content['application/json'];

      const newSchemas = {
        parameters: data,
        components: jsonSchema?.components,
      };
      const resolvedParameters = dereference(newSchemas.parameters, newSchemas);
      setTableData([...headerQueryPathCookieParams, ...getTableData(resolvedParameters)]);
      // console.log(55, resolvedParameters, getTableData(resolvedParameters));
    } else {
      const successRes = jsonSchema?.responses?.find((item: any) => item.status_code === '200');
      const successResJson =
        successRes?.content['application/json']?.schema || successRes?.content['application/json'] || {};
      const newSchemas = {
        parameters: successResJson,
        components: jsonSchema?.components,
      };
      const resolvedParameters = dereference(newSchemas.parameters, newSchemas);
      setTableData(getTableData(resolvedParameters));
    }
  }, [operatorInfo]);

  const uiSchema = {
    name: { 'ui:placeholder': 'Enter your name' },
    age: { 'ui:placeholder': 'Enter your age' },
    email: { 'ui:placeholder': 'Enter your email' },
  };
  const columns = [
    {
      title: '字段',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    // 仅 Inputs 类型需要来源列
    ...(type === 'Inputs'
      ? [
          {
            title: '来源',
            dataIndex: 'in',
            key: 'in',
            render: (inValue: any) => {
              if (['header', 'query', 'path', 'cookie'].includes(inValue)) {
                // 转换为首字母大写
                return inValue.charAt(0).toUpperCase() + inValue.slice(1);
              }
              return 'Body';
            },
          },
        ]
      : []),
    {
      title: '是否必填',
      dataIndex: 'required',
      key: 'required',
      render: (required: any) => (required ? '是' : '否'),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
  ];
  return (
    <>
      {Boolean(tableData?.length) && (
        <Collapse ghost defaultActiveKey={1} className="operator-details-collapse">
          <Panel header={type} key="1">
            <Table columns={columns} dataSource={tableData} rowKey="key" size="small" pagination={false} />
          </Panel>
        </Collapse>
      )}
    </>
  );
};

export default JsonschemaTab;
