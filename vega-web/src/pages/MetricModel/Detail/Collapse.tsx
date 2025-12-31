/** 表单收起展开样式组件 */
import { useState, useEffect, ReactNode } from 'react';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import classNames from 'classnames';

interface Props {
  title: string;
  children: JSX.Element | Array<JSX.Element>;
  isOpen?: boolean;
  deleteDom?: ReactNode; // 右边删除dom
  childrenErrorCount?: number; // 子节点存在错误的次数
  className?: string;
}

/** 表单折叠面板 */
const Collapse = (props: Props): JSX.Element => {
  const { title, children, isOpen, deleteDom, childrenErrorCount, className } = props;

  const [open, setOpen] = useState(true);

  useEffect(() => {
    childrenErrorCount !== 0 && childrenErrorCount !== undefined && setOpen(true);
  }, [childrenErrorCount]);

  useEffect(() => {
    isOpen !== undefined && setOpen(isOpen);
  }, []);

  return (
    <div className={classNames('g-w-100', className)}>
      <div className="g-flex-space-between">
        <div className="g-pointer" onClick={() => setOpen(!open)}>
          {open ? <CaretDownOutlined style={{ fontSize: 13 }} /> : <CaretRightOutlined style={{ fontSize: 13 }} />}
          <strong className="g-pl-2">{title}</strong>
        </div>
        <div>{deleteDom}</div>
      </div>
      <div style={open ? {} : { height: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

export default Collapse;
