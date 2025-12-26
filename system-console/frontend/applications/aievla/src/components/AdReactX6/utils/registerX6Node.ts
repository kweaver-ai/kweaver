import { register } from '@antv/x6-react-shape';
import X6DagNodeComponent from '../components/X6DagNode/X6DagNode';
import { AdPortRectLeft, AdPortRectRight, AdX6DagNode } from './constants';
import { X6Type } from '../AdReactX6';

/**
 * 注册X6用到的所有类型的节点
 */
const registerX6Node = (graphType: X6Type = 'erGraph') => {
  if (graphType === 'dagGraph') {
    const portMarkup = {
      tagName: 'circle',
      selector: 'circle',
      attrs: {
        r: 0,
        strokeWidth: 0,
        fill: '#fff',
        stroke: '#BFBFBF',
      },
      className: 'ad-x6-end-point-port', // 终点连接桩都具有的类名
    };
    register({
      shape: AdX6DagNode,
      component: X6DagNodeComponent,
      effect: ['data'],
      // @ts-ignore
      ports: {
        groups: {
          [AdPortRectLeft]: {
            position: { name: 'absolute', args: { x: 0, y: 24 } },
            markup: [portMarkup],
          },
          [AdPortRectRight]: {
            position: { name: 'absolute', args: { x: '100%', y: 24 } },
            markup: [portMarkup],
          },
        },
      },
    });
  }
};

export default registerX6Node;
