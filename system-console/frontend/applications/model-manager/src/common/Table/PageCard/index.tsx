import { useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Col, Row, Checkbox, Pagination, type PaginationProps } from 'antd';

import HOOKS from '@/hooks';

import styles from './index.module.less';

export type PageCardProps = {
  colKey: string;
  dataSource: any[];
  component: any;
  pagination?: PaginationProps;
  rowSelection?: any;
  onChange?: (page: number, pageSize: number) => void;
  children?: React.ReactNode;
  emptyContent?: React.ReactNode;
};

const PageCard = (props: PageCardProps) => {
  const { colKey, dataSource, component: Component, pagination, rowSelection, onChange } = props;

  const containerRef = useRef<HTMLDivElement>(null); // 表格容器
  const containerHeight = containerRef?.current?.getBoundingClientRect()?.height || 0; // 容器高度

  const operationBarRef = useRef(null); // 表格操作条 ref
  const { height: operationBarHeight } = HOOKS.useSize(operationBarRef); // 表格操作条高度

  const headerOffset = props.children ? operationBarHeight : 0; // 表格头部高度
  const viewportHeight = containerHeight - headerOffset - 56; // 表格允许设置的最大视口高度

  const hasPagination = !!pagination && dataSource.length > 0;
  const hasRowSelection = !!rowSelection;
  const pageSize = pagination?.pageSize || 20;
  const start = ((pagination?.current || 1) - 1) * pageSize;
  const items = hasPagination ? dataSource.slice(start, start + pageSize) : dataSource;

  const onRowSelectionChange = (key: string, checked: boolean) => {
    if (checked) {
      rowSelection.onChange(_.filter(rowSelection.selectedRowKeys, item => item !== key));
    } else {
      rowSelection.onChange([...rowSelection.selectedRowKeys, key]);
    }
  };

  return (
    <div className={styles['common-table-page-card']} ref={containerRef}>
      {props.children && <div ref={operationBarRef}>{props.children}</div>}
      {dataSource.length === 0 && (
        <div className='g-flex-center' style={{ height: viewportHeight }}>
          {props.emptyContent}
        </div>
      )}
      <div className={styles['common-table-page-card-content']} style={{ maxHeight: viewportHeight }}>
        <Row gutter={[16, 16]}>
          {_.map(items, item => {
            const key = item[colKey];
            const checked = _.includes(rowSelection?.selectedRowKeys, key);
            return (
              <Col
                key={key}
                xs={{ flex: '100%' }}
                sm={{ flex: '50%' }}
                lg={{ flex: '33.33%' }}
                xl={{ flex: '25%' }}
                xxl={{ flex: '20%' }}
                style={{ minWidth: 0 }}
              >
                <div className={styles['common-table-page-card-content-item']}>
                  {hasRowSelection && (
                    <Checkbox checked={checked} style={{ position: 'absolute', top: 12, right: 12 }} onChange={() => onRowSelectionChange(key, checked)} />
                  )}
                  <Component source={item} onSelect={() => onRowSelectionChange(key, checked)} />
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
      {hasPagination && (
        <Pagination
          align='end'
          showSizeChanger
          pageSizeOptions={['20', '50', '100']}
          style={{ marginTop: 24 }}
          showTotal={total => intl.get('components.table.total', { total })}
          onChange={onChange}
          {...pagination}
        />
      )}
    </div>
  );
};

export default PageCard;
