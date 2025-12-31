import { useRef, useState } from 'react';
import { Resizable } from 'react-resizable';

const ResizableTitle = ({ width, onChangeSize, ...restProps }: any) => {
  const widthRef = useRef(width);
  const resizingRef = useRef(false);
  const [thCursor, setThCursor] = useState<'ew-resize' | null>(null);

  if (!restProps.title) return <th {...restProps} />; // 没有title不显示
  const onResize = (_e: any, data: any) => {
    widthRef.current = widthRef.current + data.size.width - width;
    if (widthRef.current < 60) widthRef.current = 60;
    if (Math.abs(widthRef.current - width) > 3) onChangeSize(widthRef.current);
  };

  return (
    <Resizable
      width={width || 150}
      height={0}
      onResize={onResize}
      onResizeStart={() => {
        widthRef.current = width;
        resizingRef.current = true;
        document.body.style.cssText = 'cursor: ew-resize !important';
        setThCursor('ew-resize');
      }}
      onResizeStop={() => {
        resizingRef.current = true;
        setTimeout(() => (resizingRef.current = false), 100);
        document.body.style.cssText = 'cursor: default';
        setThCursor(null);
      }}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th
        {...restProps}
        style={{ ...restProps.style, cursor: thCursor }}
        onClick={(event: React.MouseEvent) => !resizingRef.current && restProps.onClick?.(event)}
      />
    </Resizable>
  );
};

export default ResizableTitle;
