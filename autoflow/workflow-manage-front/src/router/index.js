/* Layout */
import Layout from '@/layout'
import Vue from 'vue'
import Router from 'vue-router'

import integrationIndex from '@/views/integration/index'
import XEUtils from 'xe-utils'
const path = require('path')

Vue.use(Router)

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  /** ==================================== 分割线-公司路由（展示左侧菜单栏） ============================== **/
  {
    path: '/index',
    redirect: '/procDef/list'
  },
  {
    path: '/token',
    component: Layout,
    redirect: '/token/set',
    name: 'SETTOKEN',
    meta: { title: 'token设置', icon: 'el-icon-s-help' },
    children: [
      {
        path: 'set',
        name: 'tokenSet',
        alwaysShow: true,
        component: () => import('@/views/token/index'),
        meta: { title: 'menu.TokenSet', icon: 'el-icon-key' }
      }
    ]
  },
  {
    path: '/docShareAudit',
    component: Layout,
    name: 'DocShareAudit',
    meta: { title: '文档共享审核', icon: 'el-icon-tickets' },
    children: [
      {
        path: '',
        name: 'DocShareAudit',
        alwaysShow: true,
        component: () => import('@/views/doc-share-audit/index'),
        meta: { title: 'menu.docShareAudit', icon: 'el-icon-tickets' }
      }
    ]
  },
  {
    path: '/docSyncAudit',
    component: Layout,
    name: 'DocSyncAudit',
    meta: { title: '文档同步审核', icon: 'el-icon-tickets' },
    children: [
      {
        path: '',
        name: 'DocSyncAudit',
        alwaysShow: true,
        component: () => import('@/views/doc-sync-audit/list'),
        meta: { title: 'menu.docSyncAudit', icon: 'el-icon-tickets' }
      }
    ]
  },
  {
    path: '/processCenter',
    component: Layout,
    name: 'ProcessCenter',
    meta: { title: 'menu.processCenter', icon: 'el-icon-tickets' },
    children: [
      {
        path: '',
        name: 'ProcessCenter',
        alwaysShow: true,
        component: () => import('@/views/process-center/index'),
        meta: { title: 'menu.processCenter', icon: 'el-icon-tickets' }
      }
    ]
  },
  {
    path: '/deptAuditor',
    component: Layout,
    name: 'DeptAuditor',
    meta: { title: 'menu.deptAuditor', icon: 'el-icon-tickets' },
    children: [
      {
        path: '',
        name: 'DeptAuditor',
        alwaysShow: true,
        component: () => import('@/views/dept-auditor-rule/index'),
        meta: { title: 'menu.deptAuditor', icon: 'el-icon-tickets' }
      }
    ]
  },
  {
    path: '/doc-realname-share',
    component: () => import('@/views/doc-share-audit/integration'),
    name: 'doc-realname-share'
  },
  {
    path: '/doc-anonymity-share',
    component: () => import('@/views/doc-share-audit/anonymity'),
    name: 'doc-anonymity-share'
  },
  {
    path: '/freeAudit',
    component: Layout,
    name: 'FreeAudit',
    children: [
      {
        path: '',
        name: 'FreeAudit',
        alwaysShow: true,
        component: () => import('@/views/doc-share-audit/free-audit')
      }
    ]
  },
  {
    path: '/docShareProcess',
    component: Layout,
    name: 'DocShareProcess',
    children: [
      {
        path: '',
        name: 'DocShareProcess',
        alwaysShow: true,
        component: () => import('@/views/doc-share-audit/process-list')
      }
    ]
  },
  /** ==================================== 分割线-爱数集成路由（不展示左侧菜单栏） ============================== **/
  {
    path: location.pathname,
    name: 'index',
    hidden: true,
    component: integrationIndex
  }
]

// 适配URL前缀
let prefix = XEUtils.cookie.get('X-Forwarded-Prefix')
if(!prefix || prefix === '/' || prefix === 'undefined') {
  prefix = ''
}

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  base: window.__POWERED_BY_QIANKUN__ ? path.resolve(prefix, '/widget/workflow-manage-front/') : '',
  mode: window.__POWERED_BY_QIANKUN__ ? 'history' : 'hash',
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
