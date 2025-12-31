import { useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Handle, Position } from '@xyflow/react';
import { Input } from 'antd';
import OntologyObjectType from '@/services/object/type';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

// 自定义节点组件 - 包含节点名称、搜索框和属性列表
// interface NodeData {
//     label: string;
//     attrClick: (val: any) => void;
//     attributes: {
//         id: string;
//         name: string;
//         type: string;
//     }[];
// }

const CustomNode = ({ data, id }: OntologyObjectType.TNode) => {
  const isNodeA = id === 'data';
  const [searchText, setSearchText] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const filteredAttributes = useMemo(
    () => data.attributes.filter((attr) => (searchText ? attr.name.toLowerCase().includes(searchText.toLowerCase()) : true)),
    [data, searchText]
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value, 'handleSearch');
    setSearchVal(e.target.value);
  };

  return (
    <div className={styles['node-box']} key={id}>
      <div className={styles['node-title']}>
        {id === 'data' ? (
          <div className={styles['name-icon']} style={{ background: data.bg }}>
            <IconFont type={data.icon} style={{ color: '#fff', fontSize: '16px' }} />
          </div>
        ) : (
          <IconFont type={data.icon} style={{ color: '#000', fontSize: '24px', marginRight: 5 }} />
        )}
        <div className={`${styles['name-text']} g-ellipsis-1`}>{data.label}</div>
        <div className={styles['name-count']}>{data.attributes.length}</div>
        {id !== 'data' && data.openDataViewSource && (
          <PlusOutlined onClick={() => data.openDataViewSource?.()} style={{ color: 'rgb(18, 110, 227)', fontSize: '16px', marginLeft: 'auto' }} />
        )}
      </div>
      <div className={styles['node-search']}>
        <Input
          placeholder={intl.get('Global.searchProperty')}
          size="middle"
          value={searchVal}
          suffix={<SearchOutlined onClick={() => setSearchText(searchVal)} />}
          onPressEnter={() => setSearchText(searchVal)}
          onChange={handleSearch}
        />
        {/* <IconFont type="icon-dip-filter" style={{ color: '#000', fontSize: '16px', marginLeft: 20 }} /> */}
      </div>
      {filteredAttributes.map((attr) => (
        <div key={attr.name} className={styles['node-attr']} onClick={() => isNodeA && data.attrClick?.(attr)}>
          <span>{attr.name}</span>
          <span>{attr.type}</span>
          <Handle
            type={isNodeA ? 'source' : 'target'}
            position={isNodeA ? Position.Right : Position.Left}
            id={`${id}-${attr.name}`}
            className={styles['node-handle']}
            // className="attribute-handle"
            // isValidConnection={(connection) => {
            //     const existingConnection = edges.find(
            //         (e) => e.sourceHandle === connection.sourceHandle || e.targetHandle === connection.targetHandle
            //     );
            //     return !existingConnection;
            // }}
          />
        </div>
      ))}
    </div>
  );
};

export default CustomNode;
