import { memo } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react';
import styles from './index.module.less';

const ArrowMarker = (props: { id?: string }) => (
  <marker id={props.id || 'arrow'} viewBox="0 0 10 10" refX={5} refY={5} markerWidth={10} markerHeight={10} orient="auto">
    <path d="M 0 0 L 10 5 L 0 10" stroke={props.id === 'arrow' ? '#b1b1b1' : '#555'} fill="transparent" />
  </marker>
);

export const CustomEdge = memo((props: EdgeProps) => {
  const { selected, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, id } = props;
  // const [isButtonVisible, setIsButtonVisible] = useState<boolean>(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const reactFlowInstance = useReactFlow();

  // const handleMouseEnter = () => {
  //     console.log('handleMouseEnter')
  //     setIsButtonVisible(true);
  // };

  // const handleMouseLeave = () => {
  //     console.log('handleMouseLeave')
  //     setIsButtonVisible(false);
  // };
  // 删除边的函数
  const deleteEdge = () => {
    reactFlowInstance.deleteElements({ edges: [{ id }] });
  };

  return (
    <>
      <svg>
        <defs>
          <ArrowMarker id="arrow" />
          <ArrowMarker id="arrowSelected" />
        </defs>
      </svg>
      <BaseEdge
        path={edgePath}
        markerEnd={selected ? 'url(#arrowSelected)' : 'url(#arrow)'}
        style={{ ...style, pointerEvents: 'all' }}
        // onMouseEnter={handleMouseEnter}
        // onMouseLeave={handleMouseLeave}
      />
      <EdgeLabelRenderer>
        {selected && (
          <div
            className={styles['edge-btn']}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            onClick={deleteEdge}
          >
            <CloseOutlined style={{ color: '#fff', fontSize: 10 }} />
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});

export default CustomEdge;
