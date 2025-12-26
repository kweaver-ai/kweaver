import type React from 'react';
import { Form, type FormItemProps } from 'antd';

type ViewOrEditItemProps = FormItemProps & {
  view?: boolean;
  viewRender?: (value: any) => React.ReactNode;
  getFieldValue?: (name: string) => string;
};

/**
 * 表单项分装，支持查看和编辑
 * @param props       FormProps Antd的Form组件props
 * @param {boolean}   [props.isView]      是否展示
 * @param {boolean}   [props.view]        是否为查看模式
 * @param {function}  [props.viewRender]  查看模式下的渲染函数
 * @param {function}  [props.getFieldValue]  获取表单值
 */
const ViewOrEditItem: React.FC<ViewOrEditItemProps> = props => {
  const { view, viewRender, getFieldValue, children, ...restProps } = props;
  const form = Form.useFormInstance();

  const fieldValue = form.getFieldValue(restProps.name) || '';

  return (
    <Form.Item {...restProps}>
      {view ? (
        viewRender ? (
          viewRender(fieldValue)
        ) : (
          <div className='g-ellipsis-1 g-flex-align-center' title={fieldValue}>
            {getFieldValue ? getFieldValue(fieldValue) : fieldValue}
          </div>
        )
      ) : (
        children
      )}
    </Form.Item>
  );
};

export default (props: { isVisible?: boolean } & ViewOrEditItemProps) => {
  const { isVisible = true, ...restProps } = props;
  if (!isVisible) return null;
  return <ViewOrEditItem {...restProps} />;
};
