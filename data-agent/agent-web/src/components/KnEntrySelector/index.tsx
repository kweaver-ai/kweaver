import { memo, useState, useRef, useMemo, useCallback, useEffect } from 'react';
import intl from 'react-intl-universal';
import { debounce } from 'lodash';
import { message, Modal, Select, Spin } from 'antd';
import { getDataDicts } from '@/apis/data-model';
import Empty from '../Empty';
import LoadFailed from '../LoadFailed';
import styles from './index.module.less';
import classNames from 'classnames';

interface KnEntrySelectorProps {
  onCancel: () => void;
  onConfirm: (selectedItems: Array<{ id: string; name: string }>) => void;
}

enum LoadStatus {
  Loading = 'loading',
  Empty = 'empty',
  Normal = 'normal',
  Failed = 'failed',
  LoadingMore = 'loadingMore', // 加载更多（加载下一页的数据时）
}

const limit = 20;

// 知识条目选择弹窗
const KnEntrySelector = ({ onCancel, onConfirm }: KnEntrySelectorProps) => {
  const offsetRef = useRef<number>(0);
  const searchKeyRef = useRef<string>('');
  const requestRef = useRef<any>(undefined);
  const isLoadingMoreRef = useRef<boolean>(false);
  // 是否还有数据未加载完
  const hasMoreRef = useRef<boolean>(true);

  const [data, setData] = useState<any[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>(LoadStatus.Loading);
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string; name: string }>>([]);

  // 获取知识条目列表数据
  const fetchData = useCallback(async () => {
    if (!hasMoreRef.current) return;

    try {
      // 取消上一次的请求
      requestRef.current?.abort?.();
      // 重新赋值
      requestRef.current = getDataDicts({
        offset: offsetRef.current,
        limit,
        name_pattern: searchKeyRef.current,
      });
      const { entries } = await requestRef.current;
      // 设置offset
      offsetRef.current += entries.length;
      // 设置hasMore
      hasMoreRef.current = entries.length === limit;

      if (isLoadingMoreRef.current) {
        // 在现有的数据后面添加
        setData(prev => [...prev, ...entries.map(({ id, name }) => ({ value: name, label: name, id, name }))]);
      } else {
        setData(entries.map(({ id, name }) => ({ value: name, label: name, id, name })));
        setLoadStatus(entries.length ? LoadStatus.Normal : LoadStatus.Empty);
      }

      isLoadingMoreRef.current = false;
    } catch (ex: any) {
      if (ex === 'CANCEL') return;

      if (ex?.description) {
        message.error(ex.description);
      }
      if (!isLoadingMoreRef.current) {
        // 只有第一次加载的数据，才设置loadStatus，才设置data为空
        setLoadStatus(LoadStatus.Failed);
        setData([]);
      }

      isLoadingMoreRef.current = false;
    }
  }, []);

  const debounceFetchData = useMemo(() => debounce(fetchData, 300), [fetchData]);

  const handleSearch = (value: string) => {
    // 设置搜索关键字，清空offset，设置loadStatus，清空data
    searchKeyRef.current = value;
    offsetRef.current = 0;
    hasMoreRef.current = true;
    isLoadingMoreRef.current = false;
    setLoadStatus(LoadStatus.Loading);
    setData([]);
    debounceFetchData();
  };

  const handleScroll = (e: any) => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (distanceFromBottom < 100) {
      isLoadingMoreRef.current = true;
      debounceFetchData();
    }
  };

  useEffect(() => {
    debounceFetchData();
  }, []);

  return (
    <Modal
      open
      centered
      title={intl.get('dataAgent.selectKnowledgeEntry')}
      maskClosable={false}
      okButtonProps={{ disabled: !selectedItems.length, className: 'dip-min-width-72' }}
      cancelButtonProps={{ className: 'dip-min-width-72' }}
      onCancel={onCancel}
      onOk={() => onConfirm(selectedItems)}
      footer={(_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      )}
    >
      <Select
        showSearch
        defaultActiveFirstOption={false}
        mode="multiple"
        placeholder={intl.get('dataAgent.pleaseSelectKnowledgeEntry')}
        className={classNames('dip-w-100 dip-mt-16 dip-mb-16', styles['select'])}
        options={data}
        notFoundContent={
          loadStatus === LoadStatus.Empty ? (
            <Empty className="dip-pt-20 dip-pb-20" />
          ) : loadStatus === LoadStatus.Failed ? (
            <LoadFailed className="dip-pt-20 dip-pb-20" />
          ) : loadStatus === LoadStatus.Loading ? (
            <div style={{ height: 80 }} className="dip-flex-center">
              <Spin />
            </div>
          ) : null
        }
        onSearch={handleSearch}
        onSelect={(_, { id, name }) => {
          // 选中
          setSelectedItems(prev => [...prev, { id, name }]);
        }}
        onDeselect={(_, { id }) => {
          // 取消选中
          setSelectedItems(prev => prev.filter(selected => selected.id !== id));
        }}
        onFocus={() => {
          // 聚焦时，如果上一次搜索值不为空，则触发搜索
          if (searchKeyRef.current || loadStatus === LoadStatus.Failed) {
            handleSearch('');
          }
        }}
        onPopupScroll={handleScroll}
      />
    </Modal>
  );
};

export default memo(KnEntrySelector);
