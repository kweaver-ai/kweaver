import { lazy } from 'react';
import { createRouteApp } from '@/utils/qiankun-entry-generator';
import { initMonacoEditor } from '@/components/CodeEditor';
import { ActionEnum } from '@/components/IDEWorkspace/types';
import { OperatorTypeEnum } from '@/components/OperatorList/types';

const routeComponents = {
  OperatorList: lazy(() => import('@/components/OperatorList')),
  ToolDetail: lazy(() => import('@/components/Tool/ToolDetail')),
  McpDetail: lazy(() => import('@/components/MCP/McpDetail')),
  OperatorDetailFlow: lazy(() => import('@/components/MyOperator/OperatorDetailFlow')),
  OperatorDetail: lazy(() => import('@/components/Operator/OperatorDetail')),
  IDEWorkspace: lazy(() => import('@/components/IDEWorkspace')),
};

const routes = [
  {
    path: '/',
    element: <routeComponents.OperatorList />,
  },
  {
    path: '/operator-detail',
    element: <routeComponents.OperatorDetail />,
  },
  {
    path: '/tool-detail',
    element: <routeComponents.ToolDetail />,
  },
  {
    path: '/mcp-detail',
    element: <routeComponents.McpDetail />,
  },
  {
    path: '/details/:id',
    element: <routeComponents.OperatorDetailFlow />,
  },
  {
    path: '/details/:id/log/:recordId',
    element: <routeComponents.OperatorDetailFlow />,
  },
  {
    path: '/ide/toolbox/:toolboxId/tool/create',
    element: <routeComponents.IDEWorkspace action={ActionEnum.Create} operatorType={OperatorTypeEnum.Tool} />,
  },
  {
    path: '/ide/toolbox/:toolboxId/tool/:toolId/edit',
    element: <routeComponents.IDEWorkspace action={ActionEnum.Edit} operatorType={OperatorTypeEnum.Tool} />,
  },
  {
    path: '/ide/operator/create',
    element: <routeComponents.IDEWorkspace action={ActionEnum.Create} operatorType={OperatorTypeEnum.Operator} />,
  },
  {
    path: '/ide/operator/:operatorId/edit',
    element: <routeComponents.IDEWorkspace action={ActionEnum.Edit} operatorType={OperatorTypeEnum.Operator} />,
  },
];

const { bootstrap, mount, unmount } = createRouteApp(routes, { customConfig: initMonacoEditor });
export { bootstrap, mount, unmount };
