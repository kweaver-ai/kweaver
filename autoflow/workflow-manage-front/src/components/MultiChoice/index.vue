<template>
  <div class="gol-search" :class="isFocus?'is-focus':''" style="max-width: 600px">
    <div class="cell-icon"><i class="el-icon-search" /> </div>
    <div class="cell-text" style="max-width: 390px">
      <template v-for="(item,index) in values">
        <input
          :id="index"
          :key="`input-${item.value}`"
          maxlength="0"
          class="list-input"
          name="input-group"
          @focus="isFocus=true"
          @keyup.left="leftEvent"
          @keyup.right="rightEvent"
        >
        <div :key="item.value" class="list">
          <el-tooltip class="item" effect="light" :content="item.value" placement="top-start">
            <span style="width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;word-break:keep-all;float: left;">{{ item.value }}</span>
          </el-tooltip>
          <a class="close" @click="values.splice(index,1)">x</a>
        </div>
        </input>
      </template>
      <input
        id="last-input"
        ref="last"
        maxlength="0"
        class="list-input"
        @focus="isFocus=true"
      >
    </div>
    <div class="cell-input" style="width: 141px">
      <el-autocomplete
        v-model="value1"
        class="inline-input"
        style="width: 141px"
        name="input-group"
        :maxlength="100"
        :placeholder="inPlaceholder"
        popper-class="el-popper-new ser-popper"
        :fetch-suggestions="querySearch"
        @focus="isFocus=true"
        @blur="isFocus=false"
        @select="handleSelect"
        @keyup.left.native="leftEvent"
        @keyup.right.native="rightEvent"
        @keyup.delete.native="inputDelete"
      >
        <template slot-scope="{ item }">
          <!--          <div class="name">{{ item.value }}</div>-->
          <el-divider v-if="item.value ==='-'" style="margin: 0;" />
          <span v-else>{{ item.value }}</span>
        </template>
      </el-autocomplete>
    </div>
    <div class="cell-btn">
      <a v-if="values.length>0||value1.length>0" class="close" @click="clearValues">
        <i class="el-icon-error" />
      </a>
    </div>
  </div>
</template>
<script>
export default {
  name: 'MultiChoice',
  props: {
    types: {
      type: Array,
      default: () => { return [] }
    },
    values: {
      type: Array,
      default: () => { return [] }
    },
    placeholder: {
      type: String,
      default: ''
    },
    defaultPrompt: {
      type: Array,
      default: () => { return [] }
    }
  },
  data() {
    return {
      value1: '',
      trigger: true,
      isFocus: false
      /* types: ['标题', '名称'],
      values: []*/
    }
  },
  computed: {
    inPlaceholder() {
      return this.values.length > 0 ? '' : this.placeholder
    }
  },
  methods: {
    inputDelete(event, index) {
      if(event.keyCode !== 8){
        return
      }
      if (this.value1.length === 0) {
        if(index){
          this.values.splice(this.values.length - 1 - index, 1)
        } else {
          this.values.splice(this.values.length - 1, 1)
        }
      }
    },
    clearValues() {
      this.value1 = ''
      this.$emit('input', [])
      this.values.splice(0)
    },
    leftEvent(obj) {
      const nodeList = this.$el.querySelectorAll('*[name="input-group"]')
      const _this = this
      let index
      if (obj.target.id && (Number(obj.target.id) || Number(obj.target.id) === 0)) {
        index = Number(obj.target.id)
      } else {
        index = nodeList.length - 1
        this.$refs.last.focus()
      }
      const i = index - 1 < 0 ? 0 : index - 1
      nodeList[i].focus()
      nodeList[i].onkeydown = function(event){
        if((nodeList.length - 1 - i) !== 0){
          _this.inputDelete (event, nodeList.length - 1 - i)
          nodeList[i].onkeydown = null
        }
      }
    },
    rightEvent(obj) {
      const nodeList = this.$el.querySelectorAll('*[name="input-group"]')
      const _this = this
      let index
      if (obj.target.id && (Number(obj.target.id) || Number(obj.target.id) === 0)) {
        index = Number(obj.target.id)
        if (index + 2 === nodeList.length) {
          this.$refs.last.focus()
        }
      } else {
        index = nodeList.length - 1
      }
      const i = index + 1 > nodeList.length - 1 ? nodeList.length - 1 : index + 1
      nodeList[i].focus()
      nodeList[i].onkeydown = function(event){
        if((nodeList.length - 1 - i) !== 0){
          _this.inputDelete (event, nodeList.length - 1 - i)
          nodeList[i].onkeydown = null
        }
      }
    },
    handleSelect(item) {
      const identification = this.values.map(el => el.value)
      if (item.val && !identification.includes(item.value)) {
        // this.values.push(item)
        let flag = true
        this.values.forEach(element => {
          if (element['type'] === item['type'] && element['val'] === item['val']) {
            element.value = item.value
            element.val = item.val
            flag = false
          }
        })
        if (flag) {
          this.values.push(item)
        }
        this.$emit('input', this.values)
        this.value1 = ''
        this.$nextTick(() => {
          this.$refs.last.focus()
          const nodeList = this.$el.querySelectorAll('*[name="input-group"]')
          nodeList[nodeList.length - 1].focus()
        })
      } else {
        if (item.def) {
          this.value1 = ''
        } else {
          this.value1 = item.val
        }
      }
    },
    querySearch(queryString, cb) {
      this.trigger = false
      const results = []
      if (queryString) {
        let flag = false
        const filter = this.defaultPrompt.filter(el => {
          if (el.val && el.val.includes(queryString)) {
            flag = true
            return true
          }
          if (el.group && flag) {
            flag = false
            return true
          }
        })
          .map(el => {
            if (el['group'] === '-') {
              return { value: '-' }
            }
            const type = this.types.find(item => item.value === el.type)
            return { value: `${type.label}：${el.val}`, type: el.type, val: el.val, def: true }
          })
        if (filter.length > 0) {
          filter.push({ value: '-' })
        }
        results.push(...filter)
        const data = this.types.map(el => { return { value: `${el.label}：${queryString}`, type: el.value, val: queryString } })
        results.push(...data)
        // 调用 callback 返回建议列表的数据
      } else {
        const filter = this.defaultPrompt
          .map(el => {
            if (el['group'] === '-') {
              return { value: '-' }
            }
            const type = this.types.find(item => item.value === el.type)
            return { value: `${type.label}：${el.val}`, type: el.type, val: el.val, def: true }
          })
        results.push(...filter)
      }
      cb(results)
    }
  }
}
</script>

<style scoped>
.el-divider {
  margin: 0px 0;
  background: 0 0;
  border-top: 1px solid #dcdfe6;
}
</style>
