import Layout from './layout/index.vue'
let routes = [
  {
    path: '/test',
    name: 'Test',
    component: Layout,
    meta: {
      icon: 'el-icon-setting'
    },
    children: [{
      path: '/initiate/realname-share',
      name: 'InitiateRealnameShare',
      component: () => import('@/views/test/InitiateRealnameShare.vue'),
      meta: {
        title: '发起文档实名共享流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: '/initiate/anonymous-share',
      name: 'InitiateAnonymousShare',
      component: () => import('@/views/test/InitiateAnonymousShare.vue'),
      meta: {
        title: '发起文档匿名共享流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: '/initiate/sync',
      name: 'InitiateSync',
      component: () => import('@/views/test/InitiateSync.vue'),
      meta: {
        title: '发起文档同步流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: '/initiate/Arbitrarily',
      name: 'Arbitrarily',
      component: () => import('@/views/test/Arbitrarily.vue'),
      meta: {
        title: '发起任意审核流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: '/initiate/flow',
      name: 'Flow',
      component: () => import('@/views/test/InitiateFlow.vue'),
      meta: {
        title: '发起文档流转流程',
        icon: 'el-icon-s-promotion'
      }
    },
    {
      path: '/token',
      name: 'Token',
      component: () => import('@/views/test/token.vue'),
      meta: {
        title: 'token设置',
        icon: 'el-icon-key'
      }
    }]
  },
  {
    path: '/redoc',
    name: 'redoc',
    hidden: true,
    component: () => import('@/views/common/redoc.vue'),
    meta: {
      title: 'API',
      icon: 'el-icon-key'
    }
  },
  {
    path: '/preview',
    name: 'preview',
    hidden: true,
    component: () => import('@/views/common/preview.vue'),
    meta: {
      title: 'preview',
      icon: 'el-icon-key'
    }
  }
]
const indexRoute = {
  path: '/',
  component: Layout,
  children: [{
    path: '',
    name: 'Audit',
    component: () => import('@/views/audit/index.vue'),
    meta: {
      title: '审核',
      icon: 'icon iconfont icon-shenhe'
    }
  }]
}
const integrationRoute = {
  path: '/',
  name: 'index',
  hidden: true,
  component: () => import('@/views/integration/index.vue')
}
const moveIndexRoute = {
  path: '/moveIndex',
  name: 'moveIndex',
  hidden: true,
  component: () => import('@/views/move/moveIndex.vue')
}

const auditViewRoute = {
  path: '/auditViewRoute',
  name: 'auditViewRoute',
  hidden: true,
  component: () => import('@/views/move/audit.vue')
}
const applyViewRoute = {
  path: '/applyViewRoute',
  name: 'applyViewRoute',
  hidden: true,
  component: () => import('@/views/move/apply.vue')
}


window.__POWERED_BY_QIANKUN__ ? routes.push(integrationRoute) : routes.push(indexRoute)
routes.push(moveIndexRoute)
routes.push(auditViewRoute)
routes.push(applyViewRoute)
export default routes
