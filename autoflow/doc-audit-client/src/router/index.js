import Layout from '@/layout/index.vue'
export function initRoutes (routes, realRouterPrefix) {
  const commonRoute = {
    path: realRouterPrefix + '/test',
    name: 'Test',
    component: Layout,
    meta: {
      icon: 'el-icon-setting'
    },
    children: [{
      path: realRouterPrefix + '/initiate/realname-share',
      name: 'InitiateRealnameShare',
      component: () => import('@/views/test/InitiateRealnameShare.vue'),
      meta: {
        title: '发起文档实名共享流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: realRouterPrefix + '/initiate/anonymous-share',
      name: 'InitiateAnonymousShare',
      component: () => import('@/views/test/InitiateAnonymousShare.vue'),
      meta: {
        title: '发起文档匿名共享流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: realRouterPrefix + '/initiate/sync',
      name: 'InitiateSync',
      component: () => import('@/views/test/InitiateSync.vue'),
      meta: {
        title: '发起文档同步流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: realRouterPrefix + '/initiate/flow',
      name: 'Flow',
      component: () => import('@/views/test/InitiateFlow.vue'),
      meta: {
        title: '发起文档流转流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: realRouterPrefix + '/token',
      name: 'Token',
      component: () => import('@/views/test/token.vue'),
      meta: {
        title: 'token设置',
        icon: 'el-icon-key'
      }
    }]
  }
  const redocRoute = {
    path: realRouterPrefix + '/redoc',
    name: 'redoc',
    hidden: true,
    component: () => import('@/views/common/redoc.vue'),
    meta: {
      title: 'API',
      icon: 'el-icon-key'
    }
  }

  const previewRoute = {
    path: realRouterPrefix + '/preview',
    name: 'preview',
    hidden: true,
    component: () => import('@/views/common/preview.vue'),
    meta: {
      title: 'preview',
      icon: 'el-icon-key'
    }
  }
  const moveIndexRoute = {
    path: '/moveIndex',
    name: 'moveIndex',
    hidden: true,
    component: () => import('@/views/move/moveIndex.vue')
  }
  const integrationRoute = {
    path: realRouterPrefix + '/',
    name: 'index',
    hidden: true,
    component: () => import('@/views/integration/index.vue')
  }





  let commonRoutes = routes.filter((item) => item.path === commonRoute.path)
  commonRoutes.length === 0 ? routes.push(commonRoute) : ''

  let redocRoutes = routes.filter((item) => item.path === redocRoute.path)
  redocRoutes.length === 0 ? routes.push(redocRoute) : ''

  let previewRoutes = routes.filter((item) => item.path === previewRoute.path)
  previewRoutes.length === 0 ? routes.push(previewRoute) : ''

  let integrationRoutes = routes.filter((item) => item.path === integrationRoute.path)
  integrationRoutes.length === 0 ? routes.push(integrationRoute) : ''

  let moveIndexRoutes = routes.filter((item) => item.path === moveIndexRoute.path)
  moveIndexRoute.length === 0 ? routes.push(moveIndexRoutes) : ''
}


