<template>
  <div v-if="!item.hidden && showTest">
    <template v-if="hasOneShowingChild(item.children, item) 
      && (!onlyOneChild.children || onlyOneChild.noShowingChildren) && !item.alwaysShow">
      <el-menu-item v-if="!onlyOneChild.children" :index="resolvePath(onlyOneChild.path)">
        <i :class="onlyOneChild.meta && onlyOneChild.meta.icon"></i>
        <span slot="title">{{ $t('menu.' + onlyOneChild.name) }}</span>
      </el-menu-item>
    </template>
    <el-submenu v-else :index="resolvePath(item.path)">
      <template slot="title">
        <i :class="item.meta && item.meta.icon"></i>
        <span slot="title">{{ $t('menu.' + item.name) }}</span>
      </template>
      <sidebar-item v-for="child in item.children"
        :key="child.path"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)" />
    </el-submenu>
  </div>
</template>

<script>
import path from 'path'
export default {
  name: 'sidebarItem',
  props: {
    // route object
    item: {
      type: Object,
      required: true
    },
    isNest: {
      type: Boolean,
      default: false
    },
    basePath: {
      type: String,
      default: ''
    }
  },
  data () {
    this.onlyOneChild = null
    return {}
  },
  computed: {
    showTest: function () {
      return process.env.VUE_APP_ENV !== 'anyshare' || this.item.path.indexOf('test') === -1
    }
  },
  methods: {
    hasOneShowingChild(children = [], parent) {
      const showingChildren = children.filter(item => {
        if (item.hidden) {
          return false
        } else {
          // Temp set(will be used if only has one showing child)
          this.onlyOneChild = item
          return true
        }
      })

      // When there is only one child router, the child router is displayed by default
      if (showingChildren.length === 1) {
        return true
      }

      // Show parent if there are no child router to display
      if (showingChildren.length === 0) {
        this.onlyOneChild = { ... parent, path: '', noShowingChildren: true }
        return true
      }

      return false
    },
    resolvePath(routePath) {
      if (/^(https?:|mailto:|tel:)/.test(routePath)) {
        return routePath
      }
      if (/^(https?:|mailto:|tel:)/.test(routePath)) {
        return this.basePath
      }
      return path.resolve(this.basePath, routePath)
    }
  }
}
</script>

<style scoped>
</style>
