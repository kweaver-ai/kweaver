import React, { CSSProperties, useEffect, useState } from 'react';
import classNames from 'classnames';
import type { EventArgs, Graph } from '@antv/x6';
import { Divider } from 'antd';
import intl from 'react-intl-universal';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';

interface AdG6ToolBarProps {
  className?: string;
  style?: CSSProperties;
  graph: Graph;
}

const AdX6TopToolBar: React.FC<AdG6ToolBarProps> = props => {
  const { className, style, graph } = props;
  const prefixCls = 'ad-x6-top-toolBar';
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    graph?.on('scale', handleScale);
    return () => {
      graph?.off('scale', handleScale);
    };
  }, [graph]);

  const handleScale = ({ sx }: EventArgs['scale']) => {
    setZoom(sx);
  };

  const fitView = () => {
    graph.zoomToFit({ preserveAspectRatio: true });
  };

  const onZoomChange = (type: string) => {
    let zoomValue = graph.zoom() as number;
    if (type === '-') {
      zoomValue -= 0.05;
    }
    if (type === '+') {
      zoomValue += 0.05;
    }
    if (type === '1') {
      viewCenter();
      return;
    }
    if (zoomValue > 4) {
      zoomValue = 4;
    }
    if (zoomValue < 0.05) {
      zoomValue = 0.05;
    }
    graph.zoomTo(zoomValue);
    setZoom(zoomValue);
  };

  const convertToPercentage = (rate: number) => {
    const percentage = Number(rate.toFixed(2)) * 100;
    return `${percentage.toFixed(0)}%`;
  };

  const onMoveToCenter = () => {
    const selectedNodes = graph.getSelectedCells();
    if (selectedNodes.length > 0) {
      const node = selectedNodes[0];
      graph.centerCell(node);
    } else {
      viewCenter();
    }
  };
  const viewCenter = () => {
    graph.zoomTo(1);
    setZoom(1);
    graph.centerContent();
  };

  return (
    <div className={classNames(prefixCls, className, 'ad-align-center')} style={style}>
      <Format.Button
        type='icon'
        tip={intl.get('global.zoomIn')}
        tipPosition='top'
        onClick={() => {
          onZoomChange('-');
        }}
        disabled={zoom === 0.05}
      >
        <MinusOutlined style={{ fontSize: 16 }} />
      </Format.Button>
      <Format.Button
        type='text-b'
        tip={intl.get('global.resetZoom')}
        tipPosition='top'
        onClick={() => {
          onZoomChange('1');
        }}
        style={{ textAlign: 'center', width: 64 }}
      >
        {convertToPercentage(zoom)}
      </Format.Button>
      <Format.Button
        type='icon'
        tip={intl.get('global.zoomOut')}
        tipPosition='top'
        onClick={() => {
          onZoomChange('+');
        }}
        disabled={zoom === 4}
      >
        <PlusOutlined style={{ fontSize: 16 }} />
      </Format.Button>
      <Divider type='vertical' />
      <Format.Button type='icon' tip={intl.get('global.locate')} tipPosition='top' onClick={onMoveToCenter}>
        <IconFont type='icon-dingwei' style={{ fontSize: 16 }} />
      </Format.Button>
      <Format.Button type='icon' tip={intl.get('global.adaptation')} tipPosition='top' onClick={fitView}>
        <IconFont type='icon-fenxi' style={{ fontSize: 16 }} />
      </Format.Button>
      <Format.Button type='icon' tip={intl.get('global.viewCenter')} tipPosition='top' onClick={viewCenter}>
        <IconFont type='icon-mubiao' style={{ fontSize: 16 }} />
      </Format.Button>
    </div>
  );
};

export default AdX6TopToolBar;
