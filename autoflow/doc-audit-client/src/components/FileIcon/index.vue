<template>
  <svg-icon :icon-class="type" :style="customStyle"></svg-icon>
</template>

<script>
import { getFileType } from '../../utils/common'
export default {
  name: 'FileIcon',
  props: {
    doc: {
      required: true
    },
    customStyle: {
      required: false
    }
  },
  data() {
    return {
      type: ''
    }
  },
  mounted() {
    if (this.doc.size === -1) {
      this.type = 'folder'
    } else {
      const type = getFileType(this.doc.name)
      this.type = type
    }
  }
}
</script>
