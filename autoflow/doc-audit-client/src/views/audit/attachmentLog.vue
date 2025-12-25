<template>
  <div v-if="fileList.length" class="attachment-container">
    <div v-for="item in fileList" :key="item.docid" class="attachment-list">
      <FileIcon
        :doc="item"
        :customStyle="'font-size: 24px;margin-right:8px;'" />
      <div class="list-content">
        <span class="file-name" @click="handlePreview(item)" :title="item.name">{{
          item.name
        }}</span>
        <svg-icon
          icon-class="download"
          class="ops-icon"
          @click="handleDownload(item)">
        </svg-icon>
      </div>
    </div>
  </div>
</template>

<script>
import { getFileAttribute, docPermCheck } from '@/api/anyshareOpenApi'
import FileIcon from '@/components/FileIcon'
export default {
  name: 'AttachmentLog',
  components: { FileIcon },
  props: {
    files: {
      required: true,
      type: Array
    }
  },
  data() {
    return {
      fileList: []
    }
  },
  computed: {
    microWidgetPropsVal() {
      return this.$store.state.app.microWidgetProps
    }
  },
  mounted() {
    this.getFileList()
  },
  methods: {
    async getFileList() {
      const files = this.files
      const list = []
      if (this.files.length) {
        files.forEach(async (item) => {
          try {
            const { data } = await getFileAttribute(item)
            list.push(data)
            this.fileList = list
          } catch (error) {
            console.error(error)
          }
        })
      }
    },
    async handlePreview(item) {
      // 先判断预览权限
      try {
        const {
          data: { result }
        } = await docPermCheck(item.id, 'preview')
        if (result !== 0) {
          this.$dialog_alert(
            _this.$t('message.errTitle'),
            _this.$t('message.fileNoPreviewPrem'),
            _this.$t('message.confirm')
          )
        } else {
          this.microWidgetPropsVal.contextMenu.previewFn({
            functionid: this.microWidgetPropsVal.config.systemInfo.functionid,
            item: {
              docid: item.id,
              size: item.size,
              name: item.name
            }
          })
        }
      } catch (error) {
        console.error(error)
      }
    },
    handleDownload(item) {
      this.microWidgetPropsVal.contextMenu.downloadFn({
        item: {
          docid: item.id,
          size: item.size,
          name: item.name
        }
      })
    }
  }
}
</script>

<style scoped>
.attachment-container {
  margin: 8px 0;
  padding: 8px;
  background: rgb(250, 250, 250);
}

.attachment-list {
  position: relative;
  display: flex;
  align-items: center;
  margin: 4px 0;
  padding: 0 12px;
  border-radius: 4px;
  background-color: #fff;
  height: 48px;
  border: 1px solid #eee;
}

.list:first-child {
  margin-top: 0;
}

.list:last-child {
  margin-bottom: 0;
}

.list-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;
}

.file-name {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-name:hover {
  color: #3461ec;
  cursor: pointer;
}
.ops-icon {
  font-size: 16px;
  cursor: pointer;
}
</style>
