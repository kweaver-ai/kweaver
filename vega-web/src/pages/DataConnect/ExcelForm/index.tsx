import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Radio, Select, Tooltip, message } from 'antd';
import { FormProps } from 'antd/lib/form';
import DataConnectType from '@/services/dataConnect/type';
import ScanManagement from '@/services/scanManagement';
import excelExample from '@/assets/images/excelExample.svg';
import CellRangeSelect from './CellRangeSelect';
import styles from './styles.module.less';

// 将列字母转换为数字（A->1, B->2, AA->27 等）
export const columnToNumber = (column: string): number => {
  let result = 0;

  for (let i = 0; i < column.length; i += 1) {
    result *= 26;
    result += column.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
  }

  return result;
};

// 将单元格引用拆分为列和行
const parseCellReference = (cellRef: string): any => {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/);

  if (!match) throw new Error('Invalid cell reference');

  return {
    column: columnToNumber(match[1]),
    row: parseInt(match[2], 10),
  };
};

interface CompareOptions {
  compareRow?: boolean; // 是否比较行
  compareColumn?: boolean; // 是否比较列
}

export const compareCells = (cell1: string, cell2: string, options: CompareOptions = { compareRow: true, compareColumn: true }): number => {
  const pos1 = parseCellReference(cell1);
  const pos2 = parseCellReference(cell2);

  // 只比较列
  if (options.compareColumn && !options.compareRow) {
    return pos1.column - pos2.column;
  }

  // 只比较行
  if (options.compareRow && !options.compareColumn) {
    return pos1.row - pos2.row;
  }

  // 同时比较行列
  if (options.compareRow && options.compareColumn) {
    if (pos1.column !== pos2.column) {
      return pos1.column - pos2.column;
    }

    return pos1.row - pos2.row;
  }

  return 0; // 都不比较时返回相等
};

// 视图字段配置类型
export enum ExcelFieldConfigTypes {
  FirstRow = 1,
  Custom = 0,
}
// 仅支持英文数字
export const wordNumberRegex = /^[a-zA-Z0-9]+$/;

// excel单元格范围
export const excelCellRangeRegex = /^[A-Z]{1,2}[1-9][0-9]*$/;

interface EditExcelDataRangeProps extends FormProps {
  detail?: DataConnectType.Data;
  open: boolean;
  onCancel: () => void;
}

const { Option } = Select;

const EditExcelDataRange = ({ detail, open, onCancel }: EditExcelDataRangeProps): JSX.Element => {
  // 表单
  const [form] = Form.useForm();
  const { resetFields, validateFields } = form;
  // 使用 Form.useWatch 替代 getFieldValue 以实时获取表单值
  const fileName = Form.useWatch('fileName', form);
  // 选项
  const [errorRange, setErrorRange] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // 文件和sheet列表
  const [fileList, setFileList] = useState<string[]>([]);
  const [sheetList, setSheetList] = useState<string[]>([]);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [sheetLoading, setSheetLoading] = useState<boolean>(false);

  /**
   * 验证单元格范围
   * @param rule
   * @param value
   * @returns
   */
  const validateCellRange = (_rule: unknown, value: string[]): Promise<void> => {
    if (!value?.[0]) {
      setErrorRange(true);

      return Promise.reject(new Error(intl.get('DataConnect.inputStartCell')));
    }
    if (!excelCellRangeRegex.test(value?.[0])) {
      setErrorRange(true);

      return Promise.reject(new Error(intl.get('DataConnect.cellFormatTip')));
    }
    if (!value?.[1]) {
      setErrorRange(true);

      return Promise.reject(new Error(intl.get('DataConnect.inputEndCell')));
    }
    if (!excelCellRangeRegex.test(value?.[1])) {
      setErrorRange(true);

      return Promise.reject(new Error(intl.get('DataConnect.cellFormatTip')));
    }
    if (
      compareCells(value?.[0], value?.[1], {
        compareRow: false,
        compareColumn: true,
      }) > 0 ||
      compareCells(value?.[0], value?.[1], {
        compareRow: true,
        compareColumn: false,
      }) > 0
    ) {
      setErrorRange(true);

      return Promise.reject(new Error(intl.get('DataConnect.cellRangeInvalid')));
    }
    setErrorRange(false);

    return Promise.resolve();
  };

  // 获取Excel文件列表
  const fetchExcelFiles = async (catalog: string) => {
    if (!catalog) return;
    try {
      setFileLoading(true);
      const response = await ScanManagement.getExcelFiles(catalog);
      setFileList(response.data || []);
    } catch (error) {
      console.error('Failed to get Excel file list:', error);
      message.error(intl.get('Global.loadDataFailed'));
    } finally {
      setFileLoading(false);
    }
  };

  // 获取Excel Sheet列表
  const fetchExcelSheets = async (fileName: string) => {
    if (!fileName || !detail?.bin_data?.catalog_name) return;
    try {
      setSheetLoading(true);
      const response = await ScanManagement.getExcelSheets(detail?.bin_data?.catalog_name, fileName);
      setSheetList(response.data || []);
    } catch (error) {
      console.error('Failed to get Excel sheet list:', error);
      message.error(intl.get('Global.loadDataFailed'));
    } finally {
      setSheetLoading(false);
    }
  };

  // 创建Excel表
  const createExcelTable = async (values: any) => {
    try {
      setLoading(true);
      // 构建请求参数
      const requestParams = {
        datasource_id: detail?.id || '',
        catalog: detail?.bin_data?.catalog_name || '',
        file_name: values.fileName,
        // table_name: values.tableName || 'table_name',
        sheet: values.sheet.join(','),
        sheet_as_new_column: values.sheetAsNewColumn === 1,
        start_cell: values.cellRange?.[0] || '',
        end_cell: values.cellRange?.[1] || '',
        has_headers: values.hasHeaders === 1,
        // columns: values.columns || []
      };

      const responseColumns = await ScanManagement.getExcelColumns(requestParams);

      await ScanManagement.createExcelTable({
        ...requestParams,
        columns:
          responseColumns.data?.map((item) => ({
            column: item.column.toLowerCase(),
            type: item.type,
          })) || [],
        table_name: values.tableName,
      });
      message.success(intl.get('Global.createSuccess'));
      onCancel();
    } catch (error) {
      console.error('Failed to create metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const onOk = async (): Promise<void> => {
    try {
      setLoading(true);
      const values = await validateFields();
      await createExcelTable(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 监听模态框打开状态
  useEffect(() => {
    if (open && detail?.bin_data?.catalog_name) {
      // 获取Excel文件列表
      fetchExcelFiles(detail.bin_data?.catalog_name);
      resetFields();
    }
  }, [open, detail?.bin_data?.catalog_name, resetFields]);

  // 监听文件选择变化，获取对应的sheet列表
  useEffect(() => {
    if (fileName) {
      fetchExcelSheets(fileName);
    } else {
      setSheetList([]);
    }
  }, [fileName]);

  return (
    <Modal
      getContainer={(): any => document.getElementById('vega-root')}
      title={intl.get('DataConnect.configDataRange')}
      open={open}
      onCancel={onCancel}
      wrapClassName={'ar-button-model'}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          {intl.get('Global.cancel')}
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={onOk}>
          {intl.get('Global.ok')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={intl.get('Global.selectFileButton')}
          name="fileName"
          rules={[
            {
              required: true,
              message: intl.get('Global.selectFile'),
            },
          ]}
        >
          <Select placeholder={intl.get('Global.selectFile')} loading={fileLoading}>
            {fileList.map((item) => (
              <Option value={item} key={item}>
                {item}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label={intl.get('DataConnect.metadataName')}
          name="tableName"
          rules={[
            {
              required: true,
              message: intl.get('DataConnect.inputMetadataName'),
            },
            {
              pattern: /^[a-z0-9_\u4e00-\u9fa5]+$/,
              message: intl.get('DataConnect.metadataNameRule'),
            },
          ]}
        >
          <Input placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
        <Form.Item
          label={intl.get('Global.selectSheetButton')}
          name="sheet"
          rules={[
            {
              required: true,
              message: intl.get('Global.selectSheet'),
            },
          ]}
        >
          <Select placeholder={intl.get('Global.selectSheet')} mode="multiple" loading={sheetLoading}>
            {sheetList.map((item) => (
              <Option value={item} key={item}>
                {item}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label={
            <>
              <span>{intl.get('Global.selectCellRange')}</span>
              <Tooltip
                title={
                  <div>
                    {intl.get('Global.cellRangeTip')}
                    <br />
                    <img src={excelExample} />
                  </div>
                }
                styles={{ root: { maxWidth: 320 } }}
                placement="right"
              >
                <QuestionCircleOutlined className={styles.questionIcon} />
              </Tooltip>
            </>
          }
          name="cellRange"
          initialValue={['', '']}
          rules={[
            {
              required: true,
              message: intl.get('Global.selectCellRange'),
            },
            { validator: validateCellRange },
          ]}
        >
          <CellRangeSelect error={errorRange} />
        </Form.Item>
        <Form.Item label={intl.get('Global.fieldConfig')} name="hasHeaders" initialValue={ExcelFieldConfigTypes.FirstRow}>
          <Radio.Group className={styles.radioGroupContainer}>
            <Radio value={ExcelFieldConfigTypes.FirstRow} className={styles.radioItemWrapper}>
              <>
                <span>{intl.get('Global.selectFirstRow')}</span>
                <Tooltip title={intl.get('DataConnect.selectFirstRowTip')} styles={{ root: { maxWidth: 320 } }} placement="right">
                  <QuestionCircleOutlined className={styles.questionIcon} />
                </Tooltip>
              </>
            </Radio>
            <Radio value={ExcelFieldConfigTypes.Custom} className={styles.radioItemWrapper}>
              <>
                <span>{intl.get('Global.custom')}</span>
                <Tooltip title={intl.get('DataConnect.fieldNamingTip')} styles={{ root: { maxWidth: 320 } }} placement="right">
                  <QuestionCircleOutlined className={styles.questionIcon} />
                </Tooltip>
              </>
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={
            <>
              <span>{intl.get('DataConnect.sheetNameAsField')}</span>
              <Tooltip title={intl.get('DataConnect.sheetNameAsFieldTip')} styles={{ root: { maxWidth: 320 } }} placement="right">
                <QuestionCircleOutlined className={styles.questionIcon} />
              </Tooltip>
            </>
          }
          name="sheetAsNewColumn"
          initialValue={0}
        >
          <Radio.Group className={styles.radioGroupContainer}>
            <Radio value={1} className={styles.radioItemWrapper}>
              {intl.get('Global.yes')}
            </Radio>
            <Radio value={0} className={styles.radioItemWrapper}>
              {intl.get('Global.no')}
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditExcelDataRange;
