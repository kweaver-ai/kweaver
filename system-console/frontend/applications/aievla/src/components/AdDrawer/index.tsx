import React, { useEffect, useState } from 'react';
import './style.less';
import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import classNames from 'classnames';
import DragLine from '@/components/DragLine';

export type AdDrawerDragProps = {
  enable?: boolean;
  minWidth?: number; // 最小宽度默认是width 属性的值
  maxWidth?: number;
};

export interface AdDrawerProps extends Omit<DrawerProps, 'width'> {
  subTitle?: React.ReactNode;
  drag?: AdDrawerDragProps; // 拖拽配置項
  width?: number;
}

const AdDrawer: React.FC<AdDrawerProps> = props => {
  const { title, subTitle, className, children, closable = false, mask = false, placement = 'right', extra, drag, width = 400, ...restProps } = props;
  const { enable, minWidth, maxWidth } = {
    minWidth: width,
    maxWidth: window.innerWidth / 2,
    enable: true,
    ...drag,
  };
  const [drawerWidth, setDrawerWidth] = useState<number>(width as number);

  useEffect(() => {
    setDrawerWidth(width);
  }, [width]);

  // const actualWidthRef = useRef({
  //   minWidth,
  //   maxWidth
  // });
  //
  // useEffect(() => {
  //   calculateWidth();
  //   window.addEventListener('resize', calculateWidth);
  //   return () => {
  //     window.removeEventListener('resize', calculateWidth);
  //   };
  // }, []);
  //
  // const calculateWidth = () => {
  //   const designWidth = 1920;
  //   const minRatio = minWidth / designWidth;
  //   const maxRatio = maxWidth / designWidth;
  //   const viewportWidth = document.documentElement.clientWidth || document.body.clientWidth;
  //   actualWidthRef.current = {
  //     minWidth: viewportWidth * minRatio,
  //     maxWidth: viewportWidth * maxRatio
  //   };
  //   console.log(actualWidthRef.current, 'actualWidthRef.current');
  // };

  const onWidthDrag = (widthNumber: number, offset: number) => {
    const actualWidth = widthNumber - offset;
    const curWidth = actualWidth > maxWidth! ? maxWidth : actualWidth < minWidth! ? minWidth : actualWidth;
    setDrawerWidth(curWidth!);
  };
  return (
    <Drawer width={drawerWidth} closable={closable} mask={mask} placement={placement} className={classNames('ad-drawer', className)} {...restProps}>
      {enable && (
        <DragLine
          className='ad-drawer-drag-line'
          style={{ right: drawerWidth - 5 }}
          onChange={x => {
            onWidthDrag(drawerWidth, x);
          }}
        />
      )}
      {title && (
        <div className='ad-drawer-header'>
          <div className='ad-drawer-title ad-space-between'>
            {title}
            {extra}
          </div>
          {subTitle && <div className='ad-drawer-subTitle ad-mt-1'>{subTitle}</div>}
        </div>
      )}
      <div className='ad-drawer-content ad-flex-item-full-height'>{children}</div>
    </Drawer>
  );
};

export default AdDrawer;
