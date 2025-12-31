import customDataView from './customDataView';
import dataView from './dataView';
import edge from './edge';
import EdgeType from './edge/type';
import knowledgeNetwork from './Knowledge-network';
import KnowledgeNetworkType from './Knowledge-network/type';
import object from './object';
import ObjectType from './object/type';
import rowColumnPermission from './rowColumnPermission';
import task from './task';

const SERVICE = {
  dataView,
  edge,
  knowledgeNetwork,
  object,
  task,
  customDataView,
  rowColumnPermission,
};

export default SERVICE;
export type { EdgeType, KnowledgeNetworkType, ObjectType };
