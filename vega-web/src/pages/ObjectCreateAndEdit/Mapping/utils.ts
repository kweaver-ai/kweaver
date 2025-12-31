import intl from 'react-intl-universal';
import OntologyObjectType from '@/services/object/type';

/**
 * 数据属性转换画布数据
 * @param dataProperties 数据属性
 * @param logicProperties 逻辑属性
 * @param fields 字段
 * @returns
 */
export interface TransformCanvasDataParams {
  dataProperties: OntologyObjectType.DataProperty[];
  logicProperties: OntologyObjectType.LogicProperty[];
  fields: OntologyObjectType.Field[];
  dataSource?: OntologyObjectType.DataSource;
  basicValue: OntologyObjectType.BasicInfo;
}
export const transformCanvasData = (
  props: TransformCanvasDataParams
): {
  nodes: OntologyObjectType.TNode[];
  edges: OntologyObjectType.TEdge[];
  allData: OntologyObjectType.ViewField[];
} => {
  const { dataProperties, logicProperties, fields, dataSource, basicValue } = props;
  const logics = logicProperties.map((item) => item.name) || [];

  const dataNodes = dataProperties
    .filter((val) => !logics.includes(val.name))
    .map((item) => ({
      ...item,
      id: item.name,
      mapped_field: undefined,
    }));
  const logicNodes = logicProperties.map((item) => ({
    id: item.name,
    name: item.name,
    display_name: item.display_name,
    type: item.type,
    comment: item.comment,
  }));
  const nodesData: any = {
    id: 'data',
    type: 'customNode',
    position: { x: 250, y: 0 },
    data: {
      label: basicValue.name,
      bg: basicValue.color,
      icon: basicValue.icon,
      attributes: [...dataNodes],
    },
  };
  const nodesView: OntologyObjectType.TNode = {
    id: 'view',
    type: 'customNode',
    position: { x: 900, y: 0 },
    data: {
      label: dataSource?.name || intl.get('Global.dataView'),
      bg: '#fff',
      icon: 'icon-dip-usedata',
      attributes: fields.map((item) => ({
        id: item.name,
        name: item.name,
        display_name: item.display_name,
        type: item.type || '',
        comment: item.comment,
      })),
    },
  };
  const edgesData = dataProperties
    .filter((val) => val.mapped_field?.name && val.type == val.mapped_field?.type)
    .map((item) => ({
      id: item.name + '&&' + item.mapped_field?.name,
      type: 'customEdge',
      source: 'data',
      sourceHandle: 'data-' + item.name,
      target: 'view',
      targetHandle: 'view-' + item.mapped_field?.name,
      data: { deletable: true },
    }));

  // 不存在映射，则自动映射
  if (!(edgesData.length > 0)) {
    dataProperties.forEach((val) => {
      const beField = fields.find((item) => item.name === val.name && (item.type === val.type || !val.type));
      if (beField) {
        edgesData.push({
          id: val.name + '&&' + beField.name,
          type: 'customEdge',
          source: 'data',
          sourceHandle: 'data-' + val.name,
          target: 'view',
          targetHandle: 'view-' + beField.name,
          data: { deletable: true },
        });
      }
    });
  }
  return {
    nodes: [nodesData, nodesView],
    edges: edgesData,
    allData: [...dataNodes, ...logicNodes],
  };
};

interface TransformAttrDataParams {
  nodes: {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      attributes: {
        name: string;
        display_name: string;
        type: string;
        comment?: string;
        mapped_field?: {
          name: string;
          display_name?: string;
          type?: string;
        };
      }[];
    };
  }[];
  edges: {
    id: string;
    type: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
  }[];
  logics: string[];
}

/**
 * 画布数据转换属性数据
 * @param nodes 节点数据
 * @param edges 边数据
 * @param logics 逻辑属性列表
 * @returns
 */
export const transformAttrData = (props: TransformAttrDataParams): OntologyObjectType.DataProperty[] => {
  const { nodes, edges, logics } = props;
  const dataNode = nodes.find((val) => val.id === 'data')!;
  const viewNode = nodes.find((val) => val.id === 'view')!;
  const realDataAttr = dataNode.data.attributes.filter((val) => !logics.includes(val.name));
  edges.forEach((val) => {
    const [source, target] = val.id.split('&&');
    const sourceAttr = realDataAttr.find((item) => item.name === source);
    const targetAttr = viewNode.data.attributes.find((item) => item.name === target);
    sourceAttr!.mapped_field = {
      name: target,
      display_name: targetAttr?.display_name,
      type: targetAttr?.type,
    };
  });

  return realDataAttr;
};
