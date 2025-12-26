import { useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { LoadingOutlined } from '@ant-design/icons';

import SERVICE from '@/services';
import { Text, Tree, Input, IconFont, Button } from '@/common';

import not_found from '@/assets/images/file-icon/not_found.svg';
import styles from './index.module.less';

type ListProps = {
  fetching: boolean;
  treeData: any;
  selectedKeys: string[];
  expandedKeys: string[];
  onExpand: (keys: any, info: any) => void;
  onChangeFetch: (fetch: boolean) => void;
  constructTreeData: (data: any) => any;
  onChangeSelected: (data: any) => void;
  onChangeExpanded: (keys: string[]) => void;
  onOpenCAE_ProjectModal: (type: string) => void;
};
const List = (props: ListProps) => {
  const { fetching, treeData, selectedKeys, expandedKeys } = props;
  const { onExpand, onChangeFetch, constructTreeData, onChangeSelected, onChangeExpanded, onOpenCAE_ProjectModal } = props;

  const [searchTreeData, setSearchTreeData] = useState<any>(null);

  const onSearch = _.debounce(async (event: any) => {
    const value = event.target.value;
    if (value) {
      onChangeFetch(true);
      try {
        const _result = await SERVICE.prompt.promptProjectGetList({ prompt_name: value });
        const promptList = _.map(_result?.res?.data, (item: any) => {
          item.id = item.prompt_item_id;
          item.type = 'folder';
          item.name = item.prompt_item_name;
          item.children = item.prompt_item_types;
          delete item.prompt_item_id;
          delete item.prompt_item_name;
          delete item.prompt_item_types;
          if (item?.children?.length > 0) {
            _.forEach(item.children, (child: any) => {
              child.type = 'folder';
              child.is_built_in = item.is_built_in;
              if (child?.prompt_info) {
                child.children = _.map(child?.prompt_info, d => {
                  d.id = d.prompt_id;
                  d.type = 'document';
                  d.is_built_in = item.is_built_in;
                  d.name = d.prompt_name;
                  return d;
                });
                delete child.prompt_info;
              }
            });
          }
          return item;
        });
        onChangeFetch(false);

        const searchTreeData = constructTreeData(promptList);
        setSearchTreeData(searchTreeData);

        const firstData = searchTreeData?.[0]?.children?.[0]?.children?.[0]?.sourceData;
        if (firstData) onChangeSelected(firstData);
        const keys: string[] = [searchTreeData?.[0]?.key, searchTreeData?.[0]?.children?.[0]?.key];
        onChangeExpanded(keys);
      } catch (_error) {
        onChangeFetch(false);
      }
    } else {
      setSearchTreeData(null);

      const firstData = treeData?.[0]?.children?.[0]?.children?.[0]?.sourceData;
      if (firstData) onChangeSelected(firstData);
      const keys: string[] = [treeData?.[0]?.key, treeData?.[0]?.children?.[0]?.key];
      onChangeExpanded(keys);
    }
  }, 300);

  const notSearch = searchTreeData !== null && _.isEmpty(searchTreeData);

  return (
    <div className={classNames('g-w-100 g-h-100 g-border-r', styles['page-prompt-list-root'])}>
      <div style={{ height: 48, padding: '0 12px' }}>
        <Input.Search className='g-mt-4' allowClear onChange={onSearch} />
      </div>
      <div className='g-flex-space-between' style={{ height: 40, padding: '0 12px' }}>
        <Text>{intl.get('Prompt.side.promptGroup')}</Text>
        <Button.Icon
          title={intl.get('Prompt.side.newGroup')}
          disabled={searchTreeData !== null}
          icon={<IconFont type='icon-dip-add' />}
          onClick={() => onOpenCAE_ProjectModal('create')}
        />
      </div>
      <div style={{ height: 'calc(100% - 48px - 40px)', overflowY: 'auto', padding: '0 12px' }}>
        {(_.isEmpty(treeData) || notSearch) && (
          <div className='g-w-100 g-flex-center' style={{ height: 200 }}>
            {fetching ? (
              <LoadingOutlined style={{ fontSize: 24 }} />
            ) : (
              <div className='g-flex-column-center' style={{ height: 400 }}>
                <img src={not_found} />
                <Text>{intl.get('Prompt.side.noContent')}</Text>
              </div>
            )}
          </div>
        )}
        <Tree.FolderAndDocument
          treeData={searchTreeData === null ? treeData : searchTreeData}
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          onSelect={(_selectedKeys: any, info: any) => {
            if (info.node.type === 'document') onChangeSelected(info?.node?.sourceData);
          }}
          onExpand={onExpand}
        />
      </div>
    </div>
  );
};

export default List;
