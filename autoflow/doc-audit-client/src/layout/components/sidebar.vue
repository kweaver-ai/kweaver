<template>
  <div>
    <el-menu class="el-menu-vertical-demo" 
        :default-active="activeMenu" 
        :collapse="isCollapse" 
        @select="handleSelect">
      <sidebar-item v-for="route in routes" :key="route.path" :item="route" :base-path="route.path"/>
    </el-menu>
  </div>
</template>

<script>
import sidebarItem from './sidebarItem.vue'
export default {
  name: 'sidebar',
  data () {
    return {
      isAdmin: false,
      isCollapse: false
    }
  },
  components: {
    sidebarItem
  },
  computed: {
    routes() {
      return this.$router.options.routes
    },
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    }
  },
  watch: {
    '$store.getters.curUser.isAppAdmin' (val) {
      this.isAdmin = this.$store.getters.curUser.isAppAdmin
    }
  },
  created () {
    this.isAdmin = this.$store.getters.curUser.isAppAdmin
  },
  methods: {
    handleSelect (index) {
      this.$router.push({ path: index })
    }
  }
}
</script>

<style scoped>
</style>
