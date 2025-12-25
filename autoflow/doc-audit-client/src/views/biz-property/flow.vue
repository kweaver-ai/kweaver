<template>
  <div>
    <!-- 流转名称 -->
    <div class="text">
      <div class="clums">{{ $t('flow.title') }}:</div>
      <div class="texts" v-title :title="temp.apply_detail.flow_name">{{ temp.apply_detail.flow_name}}</div>
    </div>
    <div class="text">
      <div class="clums">{{ $t('flow.targetPath') }}:</div>
      <div class="texts"  v-title :title="temp.apply_detail.target_path">
        {{ temp.apply_detail.target_path |formatString }}
      </div>
    </div>
    <!-- 源文件 -->
    <div class="text">
      <div class="clums">{{ $t('flow.source') }}:</div>
      <div class="texts" style="white-space: break-spaces;" v-title :title="temp.apply_detail.doc_list | formatSourceFileNames">{{ temp.apply_detail.doc_list | formatSourceFileNames | formatString }}</div>
    </div>
    <!-- 流转说明 -->
    <div class="text">
      <div class="clums">{{ $t('flow.remark') }}:</div>
      <div class="texts"  v-title :title="temp.apply_detail.flow_explain">
        {{ temp.apply_detail.flow_explain |formatString }}
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    temp: {
      type: Object,
      required: true
    }
  },
  /**
   * @description 格式化字符串
   * @author xiashneghui
   * @param obj 值
   * @updateTime 2022/3/2
   * */
  filters: {
    formatString (applyDetail) {
      if (applyDetail.length > 14) {
        return applyDetail.substring(0, 14) + '...'
      } else {
        return applyDetail || "---"
      }

    },
    formatSourceFileNames (docList) {
      let str = ''
      if(!docList) {
        return str
      }
      for (let i = 0; i < docList.length; i++) {
        str += docList[i].path.substring(docList[i].path.lastIndexOf('/') + 1)
        if (i < docList.length - 1) {
          str += '、'
        }
      }
      return str
    }
  },
  methods: {}
}
</script>



