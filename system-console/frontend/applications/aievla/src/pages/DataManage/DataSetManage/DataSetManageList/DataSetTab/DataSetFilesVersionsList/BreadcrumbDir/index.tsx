import { CSSProperties, forwardRef, useEffect, useImperativeHandle, memo, useRef } from 'react';
import './style.less';
import { Breadcrumb } from 'antd';
import classNames from 'classnames';

import useLatestState from '@/hooks/useLatestState';
import LoadingMask from '@/components/LoadingMask';
import Format from '@/components/Format';
import _ from 'lodash';

export type BreadcrumbDataProps = {
  label: string;
  key: string;
  type: 'file' | 'dir';
  children?: BreadcrumbDataProps[];

  // 下面属性由组件内部扁平数组函数内部自行添加（外部无需传入）
  parentKey?: string; // 父节点的key
  keyPath?: string[]; // 节点的完整层级
  rootNode?: boolean; // 是不是根节点
  isLeaf?: boolean; // 是不是叶子节点

  // 允许开发者自己定义一些业务属性
  [key: string]: any;
};

interface AdBreadcrumbDirProps {
  className?: string;
  style?: CSSProperties;
  data?: BreadcrumbDataProps[]; // 树节点数据
  onLoadData?: (selectedDir: BreadcrumbDataProps) => void; // 异步加载节点数据
  loading?: boolean;
  selectedFiles?: BreadcrumbDataProps;
  onFileSelected?: (selectedFile: BreadcrumbDataProps) => void;
  errors?: any;
}

export interface AdBreadcrumbDirRef {
  refreshCurrentDirData: () => void;
}

/**
 * 面包屑导航，回退 前进按钮  每次都是返回上一次选中的面包屑
 * @param props
 * @constructor
 */
const AdBreadcrumbDir = forwardRef<AdBreadcrumbDirRef, AdBreadcrumbDirProps>((props, ref) => {
  const { className, style, data = [], loading = false, selectedFiles, onLoadData, onFileSelected, errors } = props;
  const restSpanRef = useRef<HTMLDivElement | null>(null);
  const flatData = useRef<BreadcrumbDataProps[]>([]); // 储存扁平后的数据
  const [menuProps, setMenuProps, getMenuProps] = useLatestState({
    data: [] as BreadcrumbDataProps[],
    activeMenu: undefined as BreadcrumbDataProps | undefined,
  });

  const [breadcrumbProps, setBreadcrumbProps, getBreadcrumbProps] = useLatestState({
    dataSource: [] as BreadcrumbDataProps[], // 面包屑的数据源
    activeData: undefined as BreadcrumbDataProps | undefined, // 选中的面包屑

    goBackRecord: [] as BreadcrumbDataProps[], // 回退记录, 记录的是操作当时的 activeData
    goAheadRecord: [] as BreadcrumbDataProps[], // 前进记录， 记录的是操作当时的 activeData
  });

  useImperativeHandle(ref, () => ({
    refreshCurrentDirData,
    breadcrumbProps,
    menuProps,
  }));

  /**
   * 将树数据扁平化处理 并给每一个节点添加本组件必要属性
   */
  useEffect(() => {
    const loop = (data: BreadcrumbDataProps[], parentKey = '', parentKeyPath: string[] = []) => {
      return data.reduce((result, item, index) => {
        item.keyPath = parentKeyPath.length > 0 ? [...parentKeyPath, item.key] : [item.key];
        if (parentKey) {
          item.parentKey = parentKey;
        } else {
          item.rootNode = true;
        }
        let arr = [...result, item];
        if (item.children && item.children.length > 0) {
          // if (index === 0) breadcrumbData.push(item); // 只把第一个子节点作为面包屑数据
          item.isLeaf = false;
          arr = [...arr, ...loop(item.children, item.key, item.keyPath)];
        } else {
          item.isLeaf = true;
        }
        return arr;
      }, [] as BreadcrumbDataProps[]);
    };

    flatData.current = mergeData(flatData.current, loop(data));
    const { activeData } = getBreadcrumbProps();
    let breadcrumbData: BreadcrumbDataProps[] = [];
    let newActiveData = activeData;
    let menuData: BreadcrumbDataProps[] = [];
    if (!activeData) {
      flatData.current.length > 0 && breadcrumbData.push(flatData.current[0]);
      newActiveData = breadcrumbData[0];
    } else {
      const data = getBreadcrumbDataSource(activeData);
      breadcrumbData = data.newBreadcrumbData;
      menuData = data.menuData;
    }
    onResize(breadcrumbData, newActiveData!, menuData);
  }, [data]);

  const mergeData = (oldData: BreadcrumbDataProps[], latestData: BreadcrumbDataProps[]) => {
    const latestDataKeys = latestData.map(item => item.key);
    const oldDataKeys = oldData.map(item => item.key);
    const remainKeys = _.difference(oldDataKeys, latestDataKeys);
    const targetData = oldData.filter(item => remainKeys.includes(item.key));
    return [...latestData, ...targetData];
  };

  /**
   * 通过给定面包屑数据身上的keyPath 去获取面包屑所有的父级
   * @param breadcrumbData
   */
  const getBreadcrumbDataSource = (breadcrumbData: BreadcrumbDataProps) => {
    const keyPath = breadcrumbData.keyPath ?? [];
    let newBreadcrumbData = flatData.current.filter(item => keyPath?.includes(item.key));
    let menuData = getMenuProps().data;
    // 看看有没有面包屑数据在下拉菜单中
    if (menuData.length > 0) {
      const menuKeys = menuData.map(item => item.key);
      // 过滤出不在菜单里面的面包屑
      const breadcrumbDataNoMenu = newBreadcrumbData.filter(item => !menuKeys.includes(item.key));
      if (breadcrumbDataNoMenu.length === 0) {
        // 说明面包屑全在菜单里面
        // 从菜单里面取出面包屑数据
        // const newBreadcrumbDataKeys = newBreadcrumbData.map(item => item.key)
        newBreadcrumbData = menuData.filter(item => keyPath.includes(item.key));
        newBreadcrumbData.reverse();
        menuData = [];
        // setMenuProps(prevState => ({
        //   ...prevState,
        //   data: []
        // }));
      } else {
        // 带单全部在面包屑里面
        newBreadcrumbData = breadcrumbDataNoMenu;
      }
    }
    return { newBreadcrumbData, menuData };
  };

  /**
   * 面包屑的点击事件
   */
  const onBreadcrumbItemClick = (selectedData: BreadcrumbDataProps) => {
    setBreadcrumbProps(prevState => ({
      ...prevState,
      activeData: selectedData,
      goBackRecord: [...prevState.goBackRecord, prevState.activeData!],
    }));
    onLoadData && onLoadData(selectedData);
  };

  const onResize = (breadcrumbDataSource: BreadcrumbDataProps[], newActiveData: BreadcrumbDataProps, menuData: BreadcrumbDataProps[]) => {
    const width = restSpanRef.current?.getBoundingClientRect().width || 0;
    if (width < 100) {
      // 剩余宽度不足100px的时候  需要把面包屑放在下拉菜单中
      if (breadcrumbDataSource.length > 1) {
        const menu = breadcrumbDataSource.shift()!;
        setMenuProps(prevState => ({
          ...prevState,
          data: [menu, ...menuData],
        }));
        setBreadcrumbProps(prevState => ({
          ...prevState,
          dataSource: breadcrumbDataSource,
          activeData: newActiveData,
        }));
        return;
      }
    }
    if (width > 140) {
      // 大于240 才会触发从下拉菜单中挑出来菜单作为面包屑
      if (menuData.length > 0) {
        // const menu = menuData.shift()!;
        setMenuProps(prevState => ({
          ...prevState,
          // data: menuData
          data: [],
        }));
        setBreadcrumbProps(prevState => ({
          ...prevState,
          dataSource: [...menuData.reverse(), ...breadcrumbDataSource],
          activeData: newActiveData,
        }));
        return;
      }
    }
    setMenuProps(prevState => ({
      ...prevState,
      data: menuData,
    }));
    setBreadcrumbProps(prevState => ({
      ...prevState,
      dataSource: breadcrumbDataSource,
      activeData: newActiveData,
    }));
  };

  /**
   * 刷新当前目录数据
   */
  const refreshCurrentDirData = () => {
    onLoadData && onLoadData(breadcrumbProps.activeData!);
  };

  const prefixCls = 'ad-breadcrumb';
  return (
    <>
      <LoadingMask loading={loading} />
      <div className={classNames(prefixCls, className, 'aaaaaaaaaaaaaa')} style={style}>
        <div className={`${prefixCls}-header`}>
          <div className={`${prefixCls}-btn ad-mr-2`}></div>
          {/* 当前目录的文件 */}
          {/* {breadcrumbProps.activeData?.children}  breadcrumbProps.dataSource*/}

          <div className={`${prefixCls}-nav ad-ellipsis`}>
            <span>
              <Breadcrumb style={{ whiteSpace: 'nowrap' }} separator='/'>
                {data.length > 3 ? <Breadcrumb.Item key={'<<'}>{'...'}</Breadcrumb.Item> : null}
                {(data.length > 3 ? data.slice(-3) : data || []).map((item: any, index: any) => (
                  <Breadcrumb.Item key={item.key}>
                    <Format.Button type='text' className='ad-ellipsis' onClick={() => onBreadcrumbItemClick(item)}>
                      <span style={{ maxWidth: 100 }} title={item?.label}>
                        {item?.label?.length > 6 ? item?.label?.slice(0, 6) + '...' : item?.label}
                      </span>
                    </Format.Button>
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            </span>
          </div>
        </div>
      </div>
    </>
  );
});

export default memo(AdBreadcrumbDir);
