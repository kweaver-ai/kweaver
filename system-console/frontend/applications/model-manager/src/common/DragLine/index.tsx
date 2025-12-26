/**
 * 拖拽拉伸线条
 */
import { useRef } from 'react';

export interface DragLineProps {
  className?: string; // dragLine名称
  style?: React.CSSProperties;
  width?: number;
  maxWidth?: number;
  minWidth?: number;
  height?: number;
  maxHeight?: number;
  minHeight?: number;
  onChange?: (x: number, y: number) => void; // 位置发生变化的回调, x, y 是 拖拽结束时 相对于 拖拽起始位置 的偏移量
}

const DragLine = (props: DragLineProps) => {
  const { className, style, width, maxWidth, minWidth, height, maxHeight, minHeight, onChange } = props;
  const startPosition = useRef({ x: 0, y: 0 });
  const tempMarkPosition = useRef({ x: 0, y: 0 });

  const onDragStart = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    document.addEventListener('mousemove', onDragging);
    document.addEventListener('mouseup', onDragEnd);
    startPosition.current = { x: event.pageX, y: event.pageY };
  };

  const onDragging = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const offsetX = event.pageX - startPosition.current.x;
    const offsetY = event.pageY - startPosition.current.y;

    if (width) {
      const _width = width - offsetX;
      if (maxWidth && _width > maxWidth) return;
      if (minWidth && _width < minWidth) return;
    }
    if (height) {
      const _height = height - offsetY;
      if (maxHeight && _height >= maxHeight) return;
      if (minHeight && _height <= minHeight) return;
    }

    if (Math.abs(offsetX - tempMarkPosition.current.x) > 3 || Math.abs(offsetY - tempMarkPosition.current.y) > 3) {
      tempMarkPosition.current = { x: offsetX, y: offsetY };
      onChange?.(offsetX, offsetY);
    }
  };

  const onDragEnd = () => {
    document.removeEventListener('mousemove', onDragging);
    document.removeEventListener('mouseup', onDragEnd);
    startPosition.current = { x: 0, y: 0 };
    tempMarkPosition.current = { x: 0, y: 0 };
  };

  return <div className={className} style={style} onMouseDown={onDragStart} onMouseUp={onDragEnd} />;
};

export default DragLine;
