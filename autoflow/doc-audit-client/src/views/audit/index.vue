<template>
  <div class="el-main_cont" ref="auditClientElMainCont">
    <div>
      <el-tabs v-model="activeName" @tab-click="handleClick" class="new-tabs-1 no-padding">
        <el-tab-pane name="todo">
          <span slot="label">{{ $t('common.tabs.tasks') }}
            <el-badge is-dot class="item" :hidden="todoCount === 0"/>
          </span>
          <todo-list v-if="activeName === 'todo'" @search="handleSearch"></todo-list>
        </el-tab-pane>
        <el-tab-pane :label="$t('common.tabs.historys')" name="done">
          <done-list v-if="activeName === 'done'"></done-list>
        </el-tab-pane>
        <el-tab-pane :label="$t('common.tabs.applys')" name="apply">
          <appply-list v-if="activeName === 'apply'"></appply-list>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import appplyList from './applyList'
import todoList from './todoList'
import doneList from './doneList'
import { fecthTodoCount } from '@/api/audit'
export default {
  components: { appplyList, todoList, doneList },
  data () {
    return {
      activeName: '',
      todoCount: 0
    }
  },
  watch:{
    '$route.query.target': {
      handler(newVal){
        this.activeName = this.$route.query.target ? this.$route.query.target  : 'todo'
      },
      deep: true
    }
  },
  created () {
    this.activeName = this.$route.query.target ? this.$route.query.target : 'todo'
    this.handleSearch()
  },
  methods: {
    /**
     * @description 初始化待办数量信息
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    handleSearch () {
      let _this = this
      fecthTodoCount().then(res => {
        _this.todoCount = res.data.count
      }).catch(res => {
        console.error(res)
      })
    },
    /**
     * @description 切换列表信息
     * @param value tab类型
     * @author xiashneghui
     * @updateTime 2022/3/2
     * */
    handleClick (value) {
      if(typeof this.$route.query.applyId !== 'undefined'){
        this.$route.query.applyId = undefined
      }
      let target = value.name
      this.$router.options.routes.forEach(e => {
        if (e.name === 'index') {
          e.query = { target: target }
          this.$router.push(e)
        }
      })
    }
  }
}

</script>
