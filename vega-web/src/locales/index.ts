import Action_us from './Action/en-us.json';
import Action_cn from './Action/zh-cn.json';
import Action_tw from './Action/zh-tw.json';
import AtomDataView_us from './AtomDataView/en-us.json';
import AtomDataView_cn from './AtomDataView/zh-cn.json';
import AtomDataView_tw from './AtomDataView/zh-tw.json';
import Component_us from './Component/en-us.json';
import Component_cn from './Component/zh-cn.json';
import Component_tw from './Component/zh-tw.json';
import ConceptGroup_us from './ConceptGroup/en-us.json';
import ConceptGroup_cn from './ConceptGroup/zh-cn.json';
import ConceptGroup_tw from './ConceptGroup/zh-tw.json';
import CustomDataView_us from './CustomDataView/en-us.json';
import CustomDataView_cn from './CustomDataView/zh-cn.json';
import CustomDataView_tw from './CustomDataView/zh-tw.json';
import DataConnect_us from './DataConnect/en-us.json';
import DataConnect_cn from './DataConnect/zh-cn.json';
import DataConnect_tw from './DataConnect/zh-tw.json';
import Edge_us from './Edge/en-us.json';
import Edge_cn from './Edge/zh-cn.json';
import Edge_tw from './Edge/zh-tw.json';
import Global_us from './Global/en-us.json';
import Global_cn from './Global/zh-cn.json';
import Global_tw from './Global/zh-tw.json';
import KnowledgeNetwork_us from './KnowledgeNetwork/en-us.json';
import KnowledgeNetwork_cn from './KnowledgeNetwork/zh-cn.json';
import KnowledgeNetwork_tw from './KnowledgeNetwork/zh-tw.json';
import MetricModel_us from './MetricModel/en-us.json';
import MetricModel_cn from './MetricModel/zh-cn.json';
import MetricModel_tw from './MetricModel/zh-tw.json';
import Object_us from './Object/en-us.json';
import Object_cn from './Object/zh-cn.json';
import Object_tw from './Object/zh-tw.json';
import RowColumnPermission_us from './RowColumnPermission/en-us.json';
import RowColumnPermission_cn from './RowColumnPermission/zh-cn.json';
import RowColumnPermission_tw from './RowColumnPermission/zh-tw.json';
import Task_us from './Task/en-us.json';
import Task_cn from './Task/zh-cn.json';
import Task_tw from './Task/zh-tw.json';

const en_us = {
  ...Object_us,
  ...Edge_us,
  ...Global_us,
  ...KnowledgeNetwork_us,
  ...Component_us,
  ...Action_us,
  ...Task_us,
  ...MetricModel_us,
  ...CustomDataView_us,
  ...DataConnect_us,
  ...AtomDataView_us,
  ...RowColumnPermission_us,
  ...ConceptGroup_us,
};
const zh_cn = {
  ...Object_cn,
  ...Edge_cn,
  ...Global_cn,
  ...KnowledgeNetwork_cn,
  ...Component_cn,
  ...Action_cn,
  ...Task_cn,
  ...MetricModel_cn,
  ...CustomDataView_cn,
  ...DataConnect_cn,
  ...AtomDataView_cn,
  ...RowColumnPermission_cn,
  ...ConceptGroup_cn,
};
const zh_tw = {
  ...Object_tw,
  ...Edge_tw,
  ...Global_tw,
  ...KnowledgeNetwork_tw,
  ...Component_tw,
  ...Action_tw,
  ...Task_tw,
  ...MetricModel_tw,
  ...CustomDataView_tw,
  ...DataConnect_tw,
  ...AtomDataView_tw,
  ...RowColumnPermission_tw,
  ...ConceptGroup_tw,
};

const locales = {
  'en-us': en_us,
  'zh-cn': zh_cn,
  'zh-tw': zh_tw,
};

export default locales;
